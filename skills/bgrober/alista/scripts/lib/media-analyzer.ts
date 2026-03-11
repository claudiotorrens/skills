/**
 * Media analyzer service using Gemini for image and video analysis.
 * Extracts place names from visual content.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { deduplicateBy, normalizePlaceName } from "./utils/text";
import type { MediaAnalyzerInterface, Place, PlaceVerifierInterface } from "./types";
import { CONFIDENCE_THRESHOLDS, SIZE_LIMITS, TIMEOUTS } from "./types";

// ============================================================================
// Schemas for Gemini extraction
// ============================================================================

const imageExtractionSchema = z.object({
	places: z.array(
		z.object({
			name: z.string().describe("Business name as shown"),
			location_hint: z.string().optional().describe("City/area if visible"),
			category: z.enum(["restaurant", "bar", "cafe", "event"]),
			detection_source: z
				.enum(["storefront_sign", "menu", "logo", "receipt", "text_overlay"])
				.describe("Where the name was found"),
		}),
	),
	has_business_visible: z.boolean().describe("Is a business clearly shown?"),
});

const videoExtractionSchema = z.object({
	places: z
		.array(
			z.object({
				name: z.string().describe("Name of the restaurant, bar, cafe, or venue"),
				location_hint: z.string().optional().describe("City or neighborhood if mentioned"),
				category: z.enum(["restaurant", "bar", "cafe", "event"]).describe("Type of place"),
			}),
		)
		.describe("All place names shown or mentioned in the video"),
	has_places: z.boolean().describe("Whether the video shows specific place names"),
});

export class MediaAnalyzer implements MediaAnalyzerInterface {
	constructor(
		private readonly placeVerifier: PlaceVerifierInterface,
		private readonly googleApiKey: string,
	) {}

	// ============================================================================
	// Image Analysis
	// ============================================================================

	/**
	 * Extract places from one or more images.
	 * Analyzes each image for visible signage, menus, logos, etc.
	 */
	async extractFromImages(
		imageUrls: string[],
		context?: { caption?: string; location?: string },
	): Promise<Place[]> {
		const allPlaces: Place[] = [];
		const seenNames = new Set<string>();

		// Process images sequentially to respect rate limits
		// Could be parallelized with p-limit if needed
		for (const imageUrl of imageUrls.slice(0, 5)) {
			// Limit to 5 images max
			const places = await this.analyzeImage(imageUrl, context);

			for (const place of places) {
				const normalized = normalizePlaceName(place.name ?? "");
				if (normalized && !seenNames.has(normalized)) {
					seenNames.add(normalized);
					allPlaces.push(place);
				}
			}
		}

		return allPlaces;
	}

	private async analyzeImage(
		imageUrl: string,
		context?: { caption?: string; location?: string },
	): Promise<Place[]> {
		try {
			// Download the image
			const imageResp = await fetch(imageUrl, {
				signal: AbortSignal.timeout(15000),
				headers: {
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				},
			});

			if (!imageResp.ok) {
				console.log(`[MediaAnalyzer] Failed to download image: ${imageResp.status}`);
				return [];
			}

			const imageBuffer = await imageResp.arrayBuffer();
			const imageSizeMB = imageBuffer.byteLength / (1024 * 1024);

			// Check size limit
			if (imageSizeMB > SIZE_LIMITS.image.maxMB) {
				console.log(`[MediaAnalyzer] Image too large: ${imageSizeMB.toFixed(2)} MB`);
				return [];
			}

			const imageBase64 = Buffer.from(imageBuffer).toString("base64");

			// Determine media type from response headers
			const contentType = imageResp.headers.get("content-type") ?? "image/jpeg";
			const mediaType = contentType.includes("png") ? "image/png" : "image/jpeg";

			console.log(`[MediaAnalyzer] Analyzing image: ${imageSizeMB.toFixed(2)} MB`);

			const google = createGoogleGenerativeAI({ apiKey: this.googleApiKey });

			const { object: result } = await generateObject({
				model: google("gemini-2.0-flash"),
				schema: imageExtractionSchema,
				temperature: 0,
				seed: 42,
				messages: [
					{
						role: "user",
						content: [
							{ type: "file", data: imageBase64, mediaType: mediaType },
							{ type: "text", text: this.buildImagePrompt(context) },
						],
					},
				],
			});

			if (!result.places || result.places.length === 0) {
				console.log("[MediaAnalyzer] Image analysis: no places found");
				return [];
			}

			console.log(`[MediaAnalyzer] Image analysis found ${result.places.length} places`);

			// Verify each extracted place
			return this.verifyExtractedPlaces(result.places, context?.location);
		} catch (e) {
			console.error("[MediaAnalyzer] Image analysis failed:", e);
			return [];
		}
	}

	private buildImagePrompt(context?: { caption?: string; location?: string }): string {
		let prompt = `Extract restaurant, bar, or cafe names ONLY if clearly visible in:
- Storefront signs or awnings
- Menu headers or boards
- Logos or branding
- Receipts
- Text overlays added by the poster

CRITICAL: Only extract names you can clearly read. Do NOT guess or invent place names.
If text is blurry, partially visible, or you're unsure, return empty.
Return empty if no specific business names are clearly visible.`;

		if (context?.caption) {
			prompt += `\n\nCaption for context: "${context.caption.slice(0, 500)}"`;
		}
		if (context?.location) {
			prompt += `\nLocation hint: ${context.location}`;
		}

		return prompt;
	}

	// ============================================================================
	// Video Analysis
	// ============================================================================

	/**
	 * Extract places from video content.
	 * Analyzes video frames and audio for place mentions.
	 */
	async extractFromVideo(
		videoUrl: string,
		context?: { caption?: string; location?: string },
	): Promise<Place[]> {
		try {
			// Download the video
			console.log("[MediaAnalyzer] Downloading video for Gemini analysis...");
			const videoResp = await fetch(videoUrl, {
				signal: AbortSignal.timeout(30000),
				headers: {
					"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
				},
			});

			if (!videoResp.ok) {
				console.error("[MediaAnalyzer] Failed to download video:", videoResp.status);
				return [];
			}

			const videoBuffer = await videoResp.arrayBuffer();
			const videoSizeMB = videoBuffer.byteLength / (1024 * 1024);
			console.log(`[MediaAnalyzer] Video downloaded: ${videoSizeMB.toFixed(2)} MB`);

			// Check if video is too large for inline (20MB limit)
			if (videoSizeMB > SIZE_LIMITS.video.maxMB) {
				console.log("[MediaAnalyzer] Video too large for inline processing, skipping");
				return [];
			}

			const videoBase64 = Buffer.from(videoBuffer).toString("base64");

			// Use Gemini to analyze the video
			const google = createGoogleGenerativeAI({ apiKey: this.googleApiKey });

			const { object: result } = await generateObject({
				model: google("gemini-2.0-flash"),
				schema: videoExtractionSchema,
				temperature: 0,
				seed: 42,
				messages: [
					{
						role: "user",
						content: [
							{ type: "file", data: videoBase64, mediaType: "video/mp4" },
							{ type: "text", text: this.buildVideoPrompt(context) },
						],
					},
				],
			});

			if (!result.has_places || !result.places || result.places.length === 0) {
				console.log("[MediaAnalyzer] Video analysis: no places found");
				return [];
			}

			console.log(`[MediaAnalyzer] Video analysis found ${result.places.length} places`);

			// Deduplicate extracted places before verification
			const uniqueExtracted = deduplicateBy(result.places, (p: { name: string }) => p.name);
			console.log(`[MediaAnalyzer] After deduplication: ${uniqueExtracted.length} unique places`);

			// Verify with Google Places
			return this.verifyExtractedPlaces(uniqueExtracted, context?.location);
		} catch (e) {
			console.error("[MediaAnalyzer] Video analysis failed:", e);
			return [];
		}
	}

	private buildVideoPrompt(context?: { caption?: string; location?: string }): string {
		const basePrompt = `Extract restaurant, bar, cafe, or venue names from this video.

Look for names that are:
- Shown as text overlays on screen
- Spoken clearly by the creator
- Visible on signage or menus

CRITICAL: Only extract names you can clearly see or hear.
- Do NOT guess or invent place names
- Do NOT extract generic descriptions like "the cafe" or "this restaurant"
- If you're unsure about a name, skip it
- For listicles, only extract places that are explicitly named

Return each place with name, category, and location if mentioned.
If no specific place names found, set has_places to false.`;

		// Add context from video metadata if available
		const contextParts: string[] = [];
		if (context?.caption) {
			contextParts.push(`Video title: "${context.caption.slice(0, 500)}"`);
		}
		if (context?.location) {
			contextParts.push(`Tagged location: "${context.location}"`);
		}

		if (contextParts.length > 0) {
			return `${basePrompt}

CONTEXT FROM VIDEO METADATA:
${contextParts.join("\n")}

IMPORTANT: If the video title or tagged location mentions a city or country (e.g., "6 spots in Athens", "Best NYC restaurants"), use that location as the location_hint for ALL extracted places.
- For US cities, use "City, State" format (e.g., "Austin, TX", "New York, NY")
- For international cities, use "City, Country" format (e.g., "Athens, Greece", "Paris, France", "Tokyo, Japan")
This specific format is required for accurate place verification.`;
		}

		return basePrompt;
	}

	// ============================================================================
	// Verification
	// ============================================================================

	/**
	 * Verify extracted places with Google Places
	 */
	private async verifyExtractedPlaces(
		extracted: Array<{ name: string; location_hint?: string; category: string; address?: string }>,
		locationHint?: string,
	): Promise<Place[]> {
		const places: Place[] = [];
		const seenNames = new Set<string>();

		// Check if circuit is open before starting verification
		if (this.placeVerifier.isCircuitOpen()) {
			console.warn("[MediaAnalyzer] Google Places circuit open, returning all as unverified");
			return extracted.map((item) => ({
				name: item.name,
				location: item.location_hint ?? locationHint ?? null,
				address: item.address ?? null,
				category: item.category as Place["category"],
				latitude: null,
				longitude: null,
				confidence: 0.6, // Lower confidence for unverified
				source: "media_unverified_circuit_open",
			}));
		}

		for (const item of extracted) {
			// Skip duplicates
			const normalizedName = normalizePlaceName(item.name);
			if (seenNames.has(normalizedName)) {
				console.log(`[MediaAnalyzer] Skipping duplicate: ${item.name}`);
				continue;
			}
			seenNames.add(normalizedName);

			// Verify with Google Places (pass address for better matching)
			const verified = await this.placeVerifier.verify(
				item.name,
				item.location_hint ?? locationHint,
				item.address,
			);

			if (verified) {
				// Check if verified name is also a duplicate
				const verifiedNormalized = normalizePlaceName(verified.name ?? "");
				if (
					verifiedNormalized &&
					seenNames.has(verifiedNormalized) &&
					verifiedNormalized !== normalizedName
				) {
					console.log(`[MediaAnalyzer] Skipping duplicate verified name: ${verified.name}`);
					continue;
				}
				if (verifiedNormalized) {
					seenNames.add(verifiedNormalized);
				}

				places.push({
					...verified,
					category: verified.category !== "place" ? verified.category : item.category,
					confidence: 0.85, // High confidence for media-extracted + verified
					source: "media_verified",
				});
			} else {
				// Include unverified with lower confidence
				const unverifiedPlace: Place = {
					name: item.name,
					location: item.location_hint ?? locationHint ?? null,
					address: item.address ?? null,
					category: item.category as Place["category"],
					latitude: null,
					longitude: null,
					confidence: 0.65, // Lower for unverified
					source: "media_unverified",
				};

				// Only include if above threshold
				if (unverifiedPlace.confidence > CONFIDENCE_THRESHOLDS.includePlace) {
					places.push(unverifiedPlace);
				}
			}
		}

		return places;
	}
}
