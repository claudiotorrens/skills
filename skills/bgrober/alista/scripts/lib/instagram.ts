/**
 * Instagram platform handler.
 * Owns the complete extraction flow for Instagram URLs.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { normalizePlaceName } from "./utils/text";
import type {
	ContentSourceClassifierInterface,
	ExtractionResult,
	MediaAnalyzerInterface,
	MetadataFetcher,
	ParsedUrl,
	Place,
	PlaceVerifierInterface,
	PlatformHandler,
	PostMetadata,
	ProfileMetadata,
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

export class InstagramHandler implements PlatformHandler {
	readonly platform = "instagram" as const;

	private readonly urlPatterns = {
		reel: /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
		post: /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
		// Profile: must be last, catches username-only URLs
		profile: /instagram\.com\/([A-Za-z0-9_.]+)\/?(?:\?.*)?$/,
	};

	constructor(
		private readonly metadataFetcher: MetadataFetcher,
		private readonly mediaAnalyzer: MediaAnalyzerInterface,
		private readonly placeVerifier: PlaceVerifierInterface,
		private readonly sourceClassifier: ContentSourceClassifierInterface,
		private readonly googleApiKey: string,
	) {}

	canHandle(url: string): boolean {
		return url.includes("instagram.com");
	}

	parseUrl(url: string): ParsedUrl | null {
		// Order matters: more specific patterns first
		for (const [urlType, pattern] of Object.entries(this.urlPatterns)) {
			const match = url.match(pattern);
			if (match) {
				return {
					platform: this.platform,
					urlType: urlType as ParsedUrl["urlType"],
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
				case "story":
					result = {
						places: [],
						contentCategory: "other",
						error: {
							code: "STORY_EXPIRED",
							message: "Stories expire after 24 hours",
							recoverable: true,
							userPrompt: "What's the place called?",
						},
					};
					break;
				default:
					result = await this.extractFromPost(parsedUrl, servicesUsed);
					break;
			}

			// Add timing and service info
			result.durationMs = Date.now() - startTime;
			result.servicesUsed = servicesUsed;

			return result;
		} catch (e) {
			console.error(`[InstagramHandler] Extraction failed for ${parsedUrl.originalUrl}:`, e);
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
		servicesUsed.push("apify");

		// Fetch profile metadata
		const profile = await this.metadataFetcher.getInstagramProfile(username);

		if (!profile) {
			return {
				places: [],
				contentCategory: "other",
				error: {
					code: "PLATFORM_ERROR",
					message: "Couldn't access this profile",
					recoverable: true,
					userPrompt: "What's the place called?",
				},
			};
		}

		// Check if business profile
		if (!this.isBusinessProfile(profile)) {
			return {
				places: [],
				contentCategory: "other",
				error: {
					code: "PERSONAL_PROFILE",
					message: "This looks like a personal account",
					recoverable: false,
				},
			};
		}

		// Extract business as place
		servicesUsed.push("google_places");
		const place = await this.extractBusinessAsPlace(profile);

		// If we found a verified place, return it
		if (place) {
			return {
				places: [place],
				contentCategory: "supported",
				contentSource: { type: "by_place", confidence: 0.9, signals: ["profile_url"] },
				metadata: {
					platform: this.platform,
					urlType: "profile",
					ownerUsername: username,
				},
			};
		}

		// If we have a display name, return as unverified place
		if (profile.displayName && profile.displayName.length > 2) {
			console.log(
				`[InstagramHandler] Returning unverified place from display name: "${profile.displayName}"`,
			);
			return {
				places: [
					{
						name: profile.displayName,
						location: null,
						address: null,
						category: "restaurant" as const,
						latitude: null,
						longitude: null,
						confidence: 0.6,
						source: "profile_unverified",
					},
				],
				contentCategory: "supported",
				contentSource: { type: "by_place", confidence: 0.9, signals: ["profile_url"] },
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
			contentSource: { type: "by_place", confidence: 0.9, signals: ["profile_url"] },
			metadata: {
				platform: this.platform,
				urlType: "profile",
				ownerUsername: username,
			},
		};
	}

	private isBusinessProfile(profile: ProfileMetadata): boolean {
		const signals: string[] = [];

		// Explicit business account flag from Instagram
		if (profile.isBusinessAccount) {
			signals.push("is_business_account");
		}

		// Business category in bio
		if (
			profile.category &&
			["Restaurant", "Cafe", "Bar", "Food", "Coffee", "Bakery"].some((c) =>
				profile.category?.includes(c),
			)
		) {
			signals.push("business_category");
		}

		// Contact/business info in bio
		if (profile.bio && /\b(order|book|reserv|menu|hours|open|delivery)\b/i.test(profile.bio)) {
			signals.push("business_keywords");
		}

		// External URL (businesses often have websites)
		if (profile.externalUrl) {
			signals.push("has_external_url");
		}

		// Username patterns
		if (this.hasBusinessUsernamePattern(profile.username)) {
			signals.push("business_username");
		}

		return signals.length >= 1;
	}

	private hasBusinessUsernamePattern(username: string): boolean {
		const businessPatterns = [
			/restaurant|cafe|bar|kitchen|eatery|bistro|grill|bakery|coffee|pizza|taco|burger|sushi/i,
			/^the[a-z]+$/i, // "thecoffeeshop"
			/_official$/i, // "placename_official"
			/hq$/i, // "placehq"
		];
		return businessPatterns.some((p) => p.test(username));
	}

	private async extractBusinessAsPlace(profile: ProfileMetadata): Promise<Place | null> {
		if (!profile.username) return null;

		// Extract location hint from display name or bio
		const locationHint = this.extractLocationHint(profile);

		// Priority 1: Use display name if available (most accurate)
		if (profile.displayName && profile.displayName.length > 2) {
			// Extract just the business name part (remove suffixes like "Café Utah")
			const businessName = this.extractBusinessNameOnly(profile.displayName);
			// Also get normalized version (handles leetspeak like "Five5eeds" → "Five Seeds")
			const normalizedName = this.normalizeBusinessName(profile.displayName);

			console.log(
				`[InstagramHandler] Trying display name: "${profile.displayName}" (business: "${businessName}", normalized: "${normalizedName}", location: "${locationHint || "none"}")`,
			);

			// Try the extracted business name first (preserves leetspeak which Google Places might have)
			if (businessName && businessName !== normalizedName) {
				const fromBusinessName = await this.placeVerifier.verify(businessName, locationHint);
				if (fromBusinessName && fromBusinessName.confidence > 0.7) {
					return fromBusinessName;
				}
			}

			// Try normalized version (handles leetspeak)
			const fromNormalized = await this.placeVerifier.verify(normalizedName, locationHint);
			if (fromNormalized) {
				return fromNormalized;
			}

			// Try original display name if normalized didn't match
			if (normalizedName !== profile.displayName) {
				const fromDisplayName = await this.placeVerifier.verify(profile.displayName, locationHint);
				if (fromDisplayName) {
					return fromDisplayName;
				}
			}
		}

		// Priority 2: Try to extract business name from bio
		if (profile.bio) {
			const bioName = this.extractBusinessNameFromBio(profile.bio);
			if (bioName) {
				console.log(`[InstagramHandler] Trying bio-extracted name: "${bioName}"`);
				const fromBio = await this.placeVerifier.verify(bioName, locationHint);
				if (fromBio) {
					return fromBio;
				}
			}
		}

		// Priority 3: Format username for search (remove underscores, etc.)
		const searchName = profile.username
			.replace(/_/g, " ")
			.replace(/official$/i, "")
			.replace(/hq$/i, "")
			.trim();

		console.log(`[InstagramHandler] Trying formatted username: "${searchName}"`);
		return this.placeVerifier.verify(searchName, locationHint);
	}

	/**
	 * Extract a location hint from profile display name or bio.
	 * Looks for city/state names that can help with Google Places search.
	 * Prefers more specific cities over broad state names.
	 */
	private extractLocationHint(profile: ProfileMetadata): string | undefined {
		// Specific cities (higher priority - search first)
		const cityPatterns = [
			/\b(park city|salt lake city|salt lake|provo|ogden|st\.?\s*george)\b/i, // Utah cities
			/\b(nyc|new york|brooklyn|manhattan|queens)\b/i, // NY
			/\b(la|los angeles|hollywood|santa monica|beverly hills)\b/i, // CA
			/\b(sf|san francisco|oakland|berkeley)\b/i, // Bay Area
			/\b(chicago|austin|denver|seattle|portland|miami|boston|atlanta|dallas|houston|phoenix)\b/i,
		];

		// Broad state/region names (lower priority)
		const statePatterns = [/\b(utah|california|texas|florida|colorado|oregon|washington)\b/i];

		// Location format in bio: "📍 City" or "Based in City"
		const bioLocationPatterns = [
			/📍\s*([A-Z][a-zA-Z\s,]+)/,
			/based in\s+([A-Z][a-zA-Z\s,]+)/i,
			/located in\s+([A-Z][a-zA-Z\s,]+)/i,
		];

		const sources = [profile.displayName?.normalize("NFC"), profile.bio].filter(
			Boolean,
		) as string[];

		// First pass: look for specific cities
		for (const source of sources) {
			for (const pattern of cityPatterns) {
				const match = source.match(pattern);
				if (match) {
					return match[1] || match[0];
				}
			}
		}

		// Second pass: look for bio location patterns
		for (const source of sources) {
			for (const pattern of bioLocationPatterns) {
				const match = source.match(pattern);
				if (match) {
					return (match[1] || match[0]).trim();
				}
			}
		}

		// Third pass: look for state names (only if no city found)
		for (const source of sources) {
			for (const pattern of statePatterns) {
				const match = source.match(pattern);
				if (match) {
					return match[1] || match[0];
				}
			}
		}

		return undefined;
	}

	/**
	 * Extract just the business name part from a display name, removing generic suffixes.
	 * Unlike normalizeBusinessName, this preserves the original spelling (including leetspeak).
	 * e.g., "Five5eeds Café Utah" → "Five5eeds"
	 */
	private extractBusinessNameOnly(displayName: string): string {
		let name = displayName.normalize("NFC");

		// Remove location suffixes
		name = name.replace(
			/\s+(utah|nyc|la|sf|slc|atx|chicago|denver|seattle|portland|austin|miami|boston)\s*$/i,
			"",
		);

		// Remove generic business type words
		name = name.replace(
			/\s+(caf[eéè]|coffee|restaurant|bar|kitchen|eatery|bistro|grill|house)\s*$/iu,
			"",
		);

		return name.trim();
	}

	/**
	 * Normalize a business display name for better matching.
	 * Handles leetspeak (Five5eeds → Five Seeds), location suffixes, etc.
	 */
	private normalizeBusinessName(name: string): string {
		// Normalize Unicode to composed form (NFC) to handle decomposed accents
		// e.g., "Cafe" + combining accent → "Café"
		let normalized = name.normalize("NFC");

		// Remove common location suffixes (case insensitive)
		const locationSuffixes = [
			/\s+(utah|nyc|la|sf|slc|atx|chi|denver|seattle|portland|austin|miami|boston)\s*$/i,
			/\s+(café|cafe|coffee|restaurant|bar|kitchen|eatery)\s+(utah|nyc|la|sf|slc)\s*$/i,
		];
		for (const suffix of locationSuffixes) {
			normalized = normalized.replace(suffix, "");
		}

		// Remove generic business type words at the end
		normalized = normalized.replace(/\s+(caf[eéè]|restaurant|bar|kitchen|eatery|bistro)\s*$/iu, "");

		// Handle leetspeak conversions
		// "Five5eeds" → "Fiveseeds" (5 in middle of word often = S)
		normalized = normalized.replace(/(\w)5(\w)/g, "$1s$2");

		// Process each word to split compound words like "Fiveseeds" → "Five Seeds"
		const words = normalized.split(/\s+/);
		const processedWords = words.map((word) => {
			// Known compound word patterns to split
			const splitPatterns = [
				{ pattern: /^(five)(seeds?)$/i, replacement: "$1 $2" },
				{ pattern: /^(coffee)(shop|house|roasters?)$/i, replacement: "$1 $2" },
				{ pattern: /^(burger|pizza|taco|sushi)(joint|place|spot|house)$/i, replacement: "$1 $2" },
			];

			for (const { pattern, replacement } of splitPatterns) {
				if (pattern.test(word)) {
					return word.replace(pattern, replacement);
				}
			}
			return word;
		});

		normalized = processedWords.join(" ");

		// Capitalize first letter of each word
		normalized = normalized
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(" ");

		return normalized.trim();
	}

	/**
	 * Try to extract a business name from a profile bio.
	 * Looks for patterns like "Welcome to [Name]", "[Name] - Restaurant", etc.
	 */
	private extractBusinessNameFromBio(bio: string): string | null {
		// Common patterns in business bios
		const patterns = [
			/^([A-Z][A-Za-z\s'&]+?)(?:\s*[|\-•]\s|\s+is\s)/i, // "Business Name | tagline" or "Business Name - tagline"
			/welcome to\s+([A-Z][A-Za-z\s'&]+)/i, // "Welcome to Business Name"
			/^([A-Z][A-Za-z\s'&]{2,30})$/m, // First line if it's just a name
		];

		for (const pattern of patterns) {
			const match = bio.match(pattern);
			if (match?.[1] && match[1].length > 2 && match[1].length < 50) {
				return match[1].trim();
			}
		}

		return null;
	}

	// ============================================================================
	// Post Extraction
	// ============================================================================

	private async extractFromPost(
		parsedUrl: ParsedUrl,
		servicesUsed: ServiceUsed[],
	): Promise<ExtractionResult> {
		servicesUsed.push("apify");

		// Fetch post metadata
		const metadata = await this.metadataFetcher.getInstagramPost(parsedUrl.originalUrl);

		if (!metadata) {
			// Try OG tags as fallback (recorded by metadataFetcher)
			servicesUsed.push("og_tags");
			return {
				places: [],
				contentCategory: "other",
				error: {
					code: "PLATFORM_ERROR",
					message: "Couldn't access this post",
					recoverable: true,
					userPrompt: "What's the place called?",
				},
			};
		}

		// Classify content source (BY_PLACE vs ABOUT_PLACE)
		const contentSource = await this.sourceClassifier.classify(metadata, parsedUrl.urlType);

		// If BY_PLACE with high confidence, the owner IS the place
		if (
			contentSource.type === "by_place" &&
			contentSource.confidence > CONFIDENCE_THRESHOLDS.byPlaceClassification
		) {
			servicesUsed.push("google_places");
			const place = await this.extractBusinessAsPlace({
				username: metadata.ownerUsername ?? "",
				// Use location tag for better Google Places matching
			});

			if (place) {
				return {
					places: [place],
					contentCategory: "supported",
					contentSource,
					metadata: {
						platform: this.platform,
						urlType: parsedUrl.urlType,
						ownerUsername: metadata.ownerUsername,
						postType: metadata.postType,
					},
				};
			}
		}

		// ABOUT_PLACE: Extract from content
		return this.extractFromContent(metadata, contentSource, parsedUrl.urlType, servicesUsed);
	}

	private async extractFromContent(
		metadata: PostMetadata,
		contentSource: ReturnType<typeof this.sourceClassifier.classify> extends Promise<infer T>
			? T
			: never,
		urlType: ParsedUrl["urlType"],
		servicesUsed: ServiceUsed[],
	): Promise<ExtractionResult> {
		let places: Place[] = [];

		// STEP 0: Check for Instagram's tagged location (highest confidence signal)
		if (metadata.locationName && metadata.locationId) {
			console.log(
				`[InstagramHandler] Post has tagged location: ${metadata.locationName} (ID: ${metadata.locationId})`,
			);
			servicesUsed.push("google_places");

			const taggedPlace = await this.placeVerifier.verify(
				metadata.locationName,
				metadata.locationCity ?? undefined,
			);

			if (taggedPlace) {
				console.log(`[InstagramHandler] Verified tagged location: ${taggedPlace.name}`);
				return {
					places: [
						{
							...taggedPlace,
							confidence: 0.95, // High confidence - user explicitly tagged this location
							source: "instagram_location_tag",
						},
					],
					contentCategory: "supported",
					contentSource,
					metadata: {
						platform: this.platform,
						urlType,
						ownerUsername: metadata.ownerUsername,
						postType: metadata.postType,
					},
				};
			}
			console.log(
				"[InstagramHandler] Tagged location not found in Google Places, falling back to extraction",
			);
		}

		// STEP 1: Always try caption extraction first (cheap, often has all the data)
		// Combine caption with altText and transcript for richer extraction
		const combinedText = [
			metadata.caption,
			metadata.altText ? `Image description: ${metadata.altText}` : "",
			metadata.transcript ? `Video transcript: ${metadata.transcript}` : "",
		]
			.filter(Boolean)
			.join("\n\n");

		let captionContentCategory: ExtractionResult["contentCategory"] = "other";

		if (combinedText && combinedText.length > 10) {
			console.log("[InstagramHandler] Extracting from caption first (caption-first strategy)...");
			if (metadata.altText || metadata.transcript) {
				console.log(
					`[InstagramHandler] Enhanced with: ${metadata.altText ? "altText" : ""}${metadata.altText && metadata.transcript ? ", " : ""}${metadata.transcript ? "transcript" : ""}`,
				);
			}
			servicesUsed.push("google_places");
			const captionResult = await this.extractFromCaption(combinedText);
			places = captionResult.places;
			captionContentCategory = captionResult.contentCategory;

			if (places.length > 0) {
				console.log(`[InstagramHandler] Found ${places.length} places from caption`);
				return {
					places,
					contentCategory: captionResult.contentCategory,
					contentSource,
					metadata: {
						platform: this.platform,
						urlType,
						ownerUsername: metadata.ownerUsername,
						postType: metadata.postType,
					},
				};
			}

			// If caption extraction determined this is unsupported content (recipe/product),
			// respect that classification and don't fall through to media analysis.
			// NOTE: "travel" content often has restaurant/bar recommendations, so we still try extraction
			if (captionContentCategory === "recipe" || captionContentCategory === "product") {
				console.log(
					`[InstagramHandler] Caption identified as "${captionContentCategory}" - skipping media analysis`,
				);
				return {
					places: [],
					contentCategory: captionContentCategory,
					contentSource,
					metadata: {
						platform: this.platform,
						urlType,
						ownerUsername: metadata.ownerUsername,
						postType: metadata.postType,
					},
				};
			}

			console.log("[InstagramHandler] No places found in caption, falling back to media analysis");
		}

		// STEP 2: Fallback to image analysis for photo posts
		if (
			(metadata.postType === "Image" || metadata.postType === "Sidecar") &&
			metadata.imageUrls &&
			metadata.imageUrls.length > 0
		) {
			console.log(
				`[InstagramHandler] Analyzing ${metadata.imageUrls.length} images with Gemini...`,
			);
			servicesUsed.push("gemini_image");
			if (!servicesUsed.includes("google_places")) {
				servicesUsed.push("google_places");
			}

			places = await this.mediaAnalyzer.extractFromImages(metadata.imageUrls, {
				caption: metadata.caption,
				location: metadata.locationName,
			});

			if (places.length > 0) {
				console.log(`[InstagramHandler] Found ${places.length} places from images`);
				return this.buildResult(places, metadata, contentSource, urlType);
			}
		}

		// STEP 3: Fallback to video analysis for video posts
		if (metadata.postType === "Video" && metadata.videoUrl) {
			console.log("[InstagramHandler] Analyzing video with Gemini...");
			servicesUsed.push("gemini_video");
			if (!servicesUsed.includes("google_places")) {
				servicesUsed.push("google_places");
			}

			places = await this.mediaAnalyzer.extractFromVideo(metadata.videoUrl, {
				caption: metadata.caption,
				location: metadata.locationName,
			});

			if (places.length > 0) {
				console.log(`[InstagramHandler] Found ${places.length} places from video`);
				return this.buildResult(places, metadata, contentSource, urlType);
			}
		}

		// No places found - preserve caption content category if it was specific (travel, etc.)
		return {
			places: [],
			contentCategory: captionContentCategory,
			contentSource,
			metadata: {
				platform: this.platform,
				urlType,
				ownerUsername: metadata.ownerUsername,
				postType: metadata.postType,
			},
		};
	}

	private buildResult(
		places: Place[],
		metadata: PostMetadata,
		contentSource: Awaited<ReturnType<typeof this.sourceClassifier.classify>>,
		urlType: ParsedUrl["urlType"],
	): ExtractionResult {
		return {
			places,
			contentCategory: places.length > 0 ? "supported" : "other",
			contentSource,
			metadata: {
				platform: this.platform,
				urlType,
				ownerUsername: metadata.ownerUsername,
				postType: metadata.postType,
				isListicle: places.length > 1,
				totalPlacesInContent: places.length,
			},
		};
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
				prompt: `Extract restaurants, bars, cafes, and events from this caption.

TYPES TO EXTRACT:
- Restaurants: fine dining, casual, fast food, food trucks
- Bars: bars, pubs, lounges, speakeasies
- Cafes: coffee shops, bakeries, dessert spots
- Events: concerts, festivals, pop-ups, food events

FOR EACH PLACE, extract:
- name: Exact business name as written
- address: Street address if present
- city: City name if mentioned
- location_hint: City + neighborhood for lookup

CRITICAL - Do NOT:
- Guess or invent place names not in the caption
- Extract generic terms ("the restaurant", "this cafe")
- Extract recipes (set content_category to "recipe")
- Extract products (set content_category to "product")
- Extract travel destinations (set content_category to "travel")

Caption: ${caption.slice(0, 3000)}

Only extract places explicitly named. If unsure, skip it.
Return empty items array if no specific places found.`,
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
							console.log(`[InstagramHandler] Skipping duplicate verified name: ${verified.name}`);
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
			console.error("[InstagramHandler] Caption extraction failed:", e);
			return { places: [], contentCategory: "other" };
		}
	}
}
