/**
 * TikTok platform handler.
 * Owns the complete extraction flow for TikTok URLs.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { normalizePlaceName } from "./utils/text";
import type {
	ExtractionResult,
	MediaAnalyzerInterface,
	MetadataFetcher,
	ParsedUrl,
	Place,
	PlaceVerifierInterface,
	PlatformHandler,
	PostMetadata,
	ServiceUsed,
} from "./types";
import { CONFIDENCE_THRESHOLDS } from "./types";

// Schema for LLM extraction from caption
const captionExtractionSchema = z.object({
	items: z
		.array(
			z.object({
				name: z.string().describe("Name of the restaurant, bar, cafe, or event"),
				item_type: z.enum(["restaurant", "bar", "cafe", "event"]).describe("Type of item"),
				address: z
					.string()
					.optional()
					.describe("Street address if present (e.g., '123 Main St', '456 Oak Ave')"),
				city: z.string().optional().describe("City name if mentioned (e.g., 'New York', 'Austin')"),
				location_hint: z
					.string()
					.optional()
					.describe("Combined city + neighborhood for lookup (e.g., 'SoHo, New York')"),
				confidence: z.number().min(0).max(1).describe("Confidence this is a real, specific place"),
			}),
		)
		.max(10)
		.describe("All restaurants, bars, cafes, or events found"),
	content_category: z
		.enum(["supported", "recipe", "product", "travel", "other"])
		.describe("What type of content this post is about"),
});

export class TikTokHandler implements PlatformHandler {
	readonly platform = "tiktok" as const;

	private readonly urlPatterns = {
		video: /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
		shortUrl: /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
		shortUrlT: /tiktok\.com\/t\/([A-Za-z0-9]+)/, // Alternative short URL format
		profile: /tiktok\.com\/@([A-Za-z0-9_.]+)\/?$/,
	};

	constructor(
		private readonly metadataFetcher: MetadataFetcher,
		private readonly mediaAnalyzer: MediaAnalyzerInterface,
		private readonly placeVerifier: PlaceVerifierInterface,
		private readonly googleApiKey: string,
	) {}

	canHandle(url: string): boolean {
		return url.includes("tiktok.com") || url.includes("vm.tiktok.com");
	}

	parseUrl(url: string): ParsedUrl | null {
		for (const [urlType, pattern] of Object.entries(this.urlPatterns)) {
			const match = url.match(pattern);
			if (match) {
				return {
					platform: this.platform,
					// Short URLs (both vm.tiktok.com and tiktok.com/t/) are always video links
					urlType:
						urlType === "shortUrl" || urlType === "shortUrlT"
							? "video"
							: (urlType as ParsedUrl["urlType"]),
					identifier: match[1],
					originalUrl: url,
				};
			}
		}
		return null;
	}

	async extract(parsedUrl: ParsedUrl): Promise<ExtractionResult> {
		const startTime = Date.now();
		const servicesUsed: ServiceUsed[] = [];

		try {
			let result: ExtractionResult;

			switch (parsedUrl.urlType) {
				case "profile":
					result = await this.extractFromProfile(parsedUrl.identifier, servicesUsed);
					break;
				default:
					result = await this.extractFromVideo(parsedUrl, servicesUsed);
					break;
			}

			// Add timing and service info
			result.durationMs = Date.now() - startTime;
			result.servicesUsed = servicesUsed;

			return result;
		} catch (e) {
			console.error(`[TikTokHandler] Extraction failed for ${parsedUrl.originalUrl}:`, e);
			return {
				places: [],
				contentCategory: "other",
				error: {
					code: "PLATFORM_ERROR",
					message: "Something went wrong fetching this content",
					recoverable: true,
					userPrompt: "What's the place called?",
				},
				durationMs: Date.now() - startTime,
				servicesUsed,
			};
		}
	}

	// ============================================================================
	// Profile Extraction
	// ============================================================================

	private async extractFromProfile(
		username: string,
		servicesUsed: ServiceUsed[],
	): Promise<ExtractionResult> {
		// TikTok profiles are less commonly businesses compared to Instagram
		// For now, we just extract the username as potential place
		servicesUsed.push("google_places");

		const searchName = username.replace(/_/g, " ").trim();
		const place = await this.placeVerifier.verify(searchName);

		if (place && place.confidence > CONFIDENCE_THRESHOLDS.placeMatch) {
			return {
				places: [place],
				contentCategory: "supported",
				contentSource: { type: "by_place", confidence: 0.7, signals: ["profile_url"] },
				metadata: {
					platform: this.platform,
					urlType: "profile",
					ownerUsername: username,
				},
			};
		}

		return {
			places: [],
			contentCategory: "other",
			error: {
				code: "NO_PLACES_FOUND",
				message: "This profile doesn't appear to be a restaurant or bar",
				recoverable: true,
				userPrompt: "What's the place called?",
			},
			metadata: {
				platform: this.platform,
				urlType: "profile",
				ownerUsername: username,
			},
		};
	}

	// ============================================================================
	// Video Extraction
	// ============================================================================

	private async extractFromVideo(
		parsedUrl: ParsedUrl,
		servicesUsed: ServiceUsed[],
	): Promise<ExtractionResult> {
		servicesUsed.push("oembed");

		// Fetch video metadata
		const metadata = await this.metadataFetcher.getTiktokVideo(parsedUrl.originalUrl);

		if (!metadata) {
			return {
				places: [],
				contentCategory: "other",
				error: {
					code: "PLATFORM_ERROR",
					message: "Couldn't access this video",
					recoverable: true,
					userPrompt: "What's the place called?",
				},
			};
		}

		// TikTok videos are almost always ABOUT places (reviews, recommendations)
		// unless posted by the business itself (less common)
		let contentSourceType: "by_place" | "about_place" = "about_place";
		let contentSourceConfidence = 0.7;

		// Check if it might be BY_PLACE (business account)
		if (metadata.ownerUsername && this.isBusinessUsername(metadata.ownerUsername)) {
			contentSourceType = "by_place";
			contentSourceConfidence = 0.6;
		}

		const contentSource = {
			type: contentSourceType,
			confidence: contentSourceConfidence,
			signals: [] as Array<"personal_username_pattern" | "has_place_mentions">,
		};

		// STEP 1: Always try caption extraction first (cheap, often has all the data)
		// Combine caption with transcript for richer extraction
		const combinedText = [
			metadata.caption,
			metadata.transcript ? `Video transcript: ${metadata.transcript}` : "",
		]
			.filter(Boolean)
			.join("\n\n");

		let captionContentCategory: ExtractionResult["contentCategory"] = "other";

		if (combinedText && combinedText.length > 10) {
			console.log("[TikTokHandler] Extracting from caption first (caption-first strategy)...");
			if (metadata.transcript) {
				console.log("[TikTokHandler] Enhanced with: transcript");
			}
			servicesUsed.push("google_places");

			const captionResult = await this.extractFromCaption(combinedText);
			captionContentCategory = captionResult.contentCategory;

			if (captionResult.places.length > 0) {
				console.log(`[TikTokHandler] Found ${captionResult.places.length} places from caption`);
				return {
					places: captionResult.places,
					contentCategory: captionResult.contentCategory,
					contentSource,
					metadata: {
						platform: this.platform,
						urlType: "video",
						ownerUsername: metadata.ownerUsername,
						isListicle: captionResult.places.length > 1,
						totalPlacesInContent: captionResult.places.length,
					},
				};
			}

			// If caption extraction determined this is unsupported content (recipe/product/travel),
			// respect that classification and don't fall through to video analysis
			if (captionContentCategory !== "supported" && captionContentCategory !== "other") {
				console.log(
					`[TikTokHandler] Caption identified as "${captionContentCategory}" - skipping video analysis`,
				);
				return {
					places: [],
					contentCategory: captionContentCategory,
					contentSource,
					metadata: {
						platform: this.platform,
						urlType: "video",
						ownerUsername: metadata.ownerUsername,
					},
				};
			}

			console.log("[TikTokHandler] No places found in caption, falling back to video analysis");
		}

		// STEP 2: Fallback to video analysis if we have a video URL
		if (metadata.videoUrl) {
			console.log("[TikTokHandler] Analyzing video with Gemini...");
			servicesUsed.push("gemini_video");
			if (!servicesUsed.includes("google_places")) {
				servicesUsed.push("google_places");
			}

			const places = await this.mediaAnalyzer.extractFromVideo(metadata.videoUrl, {
				caption: metadata.caption,
			});

			if (places.length > 0) {
				console.log(`[TikTokHandler] Found ${places.length} places from video`);
				return {
					places,
					contentCategory: "supported",
					contentSource,
					metadata: {
						platform: this.platform,
						urlType: "video",
						ownerUsername: metadata.ownerUsername,
						isListicle: places.length > 1,
						totalPlacesInContent: places.length,
					},
				};
			}
		}

		// No places found
		return {
			places: [],
			contentCategory: "other",
			contentSource,
			metadata: {
				platform: this.platform,
				urlType: "video",
				ownerUsername: metadata.ownerUsername,
			},
		};
	}

	private isBusinessUsername(username: string): boolean {
		const businessPatterns = [
			/restaurant|cafe|bar|kitchen|eatery|bistro|grill|bakery|coffee|pizza|taco|burger|sushi/i,
			/_official$/i,
		];
		return businessPatterns.some((p) => p.test(username));
	}

	// ============================================================================
	// Caption Extraction
	// ============================================================================

	private async extractFromCaption(
		caption: string,
	): Promise<{ places: Place[]; contentCategory: ExtractionResult["contentCategory"] }> {
		const google = createGoogleGenerativeAI({ apiKey: this.googleApiKey });

		try {
			const { object: result } = await generateObject({
				model: google("gemini-2.0-flash"),
				schema: captionExtractionSchema,
				temperature: 0,
				seed: 42,
				prompt: `Extract restaurants, bars, cafes, and events from this TikTok video caption.

EXTRACT these types:
- Restaurants: fine dining, casual dining, fast food, food trucks
- Bars: bars, pubs, lounges, speakeasies
- Cafes: coffee shops, bakeries, dessert spots
- Events: concerts, festivals, pop-ups, food events, shows, markets

For EACH place, extract:
- name: The business name
- address: Street address if present (e.g., "123 Main St", "456 Oak Ave Ste 100")
- city: City name (e.g., "New York", "Austin", "Los Angeles")
- location_hint: Combine city + neighborhood for lookup (e.g., "SoHo, New York")

COMMON ADDRESS FORMATS in captions:
- "Restaurant Name - 123 Main St, City"
- "📍 Place Name, Address"
- "1. Place Name - Location"
- "@restaurantname (City)"

DO NOT EXTRACT (set appropriate content_category instead):
- Recipes, cooking tutorials, or BBQ/grilling technique videos → content_category: "recipe"
  (Look for: #recipe, #cooking, #homemade, #brisket, #bbq technique content, food preparation videos)
- Products being sold → content_category: "product"
- Travel destinations or landmarks → content_category: "travel"
- Generic location mentions like "downtown" or "the city"

Caption: ${caption.slice(0, 3000)}

CLASSIFICATION RULES:
1. If caption has #recipe hashtag or describes cooking/grilling techniques, set content_category to "recipe"
2. If caption mentions specific restaurant/bar/cafe names to visit, set content_category to "supported"
3. If no places are found and content is about food preparation (not dining out), set content_category to "recipe"
4. TikTok captions are often brief - look for place names, @mentions of businesses, and location hashtags`,
			});

			const contentCategory = result.content_category ?? "other";

			if (!result.items || result.items.length === 0) {
				return { places: [], contentCategory };
			}

			// Validate each item - verify with Google Places
			const validatedPlaces: Place[] = [];
			const seenNames = new Set<string>();

			for (const extracted of result.items) {
				// Skip duplicates
				const normalizedName = normalizePlaceName(extracted.name);
				if (seenNames.has(normalizedName)) {
					continue;
				}
				seenNames.add(normalizedName);

				let finalConfidence = extracted.confidence ?? 0.5;
				let place: Place;

				// Events skip Google Places verification
				if (extracted.item_type === "event") {
					finalConfidence = Math.max(finalConfidence, 0.7);
					place = {
						name: extracted.name,
						location: extracted.location_hint ?? null,
						address: extracted.address ?? null,
						category: "event",
						latitude: null,
						longitude: null,
						confidence: finalConfidence,
						source: "llm_event",
					};
				} else {
					// Restaurants/bars/cafes get verified with Google Places
					// Pass address for better matching accuracy
					const verified = await this.placeVerifier.verify(
						extracted.name,
						extracted.location_hint,
						extracted.address,
					);

					if (verified) {
						// Check if verified name is also a duplicate (Google Places may normalize differently)
						const verifiedNormalized = normalizePlaceName(verified.name ?? "");
						if (
							verifiedNormalized &&
							seenNames.has(verifiedNormalized) &&
							verifiedNormalized !== normalizedName
						) {
							console.log(`[TikTokHandler] Skipping duplicate verified name: ${verified.name}`);
							continue;
						}
						if (verifiedNormalized) {
							seenNames.add(verifiedNormalized);
						}

						finalConfidence = Math.min(finalConfidence + 0.3, 0.95);
						place = {
							...verified,
							category: verified.category !== "place" ? verified.category : extracted.item_type,
							confidence: finalConfidence,
							source: "llm_verified",
						};
					} else {
						finalConfidence = Math.max(finalConfidence - 0.2, 0);
						place = {
							name: extracted.name,
							location: extracted.location_hint ?? null,
							address: extracted.address ?? null,
							category: extracted.item_type,
							latitude: null,
							longitude: null,
							confidence: finalConfidence,
							source: "llm_unverified",
						};
					}
				}

				// Only include items above threshold
				if (place.confidence > CONFIDENCE_THRESHOLDS.includePlace) {
					validatedPlaces.push(place);
				}
			}

			return { places: validatedPlaces, contentCategory };
		} catch (e) {
			console.error("[TikTokHandler] Caption extraction failed:", e);
			return { places: [], contentCategory: "other" };
		}
	}
}
