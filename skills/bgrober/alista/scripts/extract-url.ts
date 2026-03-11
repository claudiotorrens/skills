#!/usr/bin/env bun
/**
 * Extract places from a social media URL (Instagram or TikTok).
 *
 * Usage: bun scripts/extract-url.ts <url>
 * Output: JSON with extracted places
 */

import { InstagramHandler } from "./lib/instagram";
import { TikTokHandler } from "./lib/tiktok";
import { PlaceVerifier } from "./lib/place-verifier";
import { MediaAnalyzer } from "./lib/media-analyzer";
import { SocialMetadataFetcher } from "./lib/metadata-fetcher";
import { ContentSourceClassifier } from "./lib/content-source-classifier";

const url = process.argv[2];

if (!url) {
	console.error(JSON.stringify({ error: "Usage: bun scripts/extract-url.ts <url>" }));
	process.exit(1);
}

try {
	const googleApiKey = process.env.GOOGLE_API_KEY;
	const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
	const apifyApiKey = process.env.APIFY_API_KEY;

	if (!googleApiKey || !googlePlacesApiKey) {
		throw new Error("GOOGLE_API_KEY and GOOGLE_PLACES_API_KEY are required");
	}

	// Create services
	const placeVerifier = new PlaceVerifier(googlePlacesApiKey);
	const mediaAnalyzer = new MediaAnalyzer(placeVerifier, googleApiKey);
	const metadataFetcher = new SocialMetadataFetcher(apifyApiKey);
	const sourceClassifier = new ContentSourceClassifier();

	// Create handlers
	const handlers = [
		new InstagramHandler(
			metadataFetcher,
			mediaAnalyzer,
			placeVerifier,
			sourceClassifier,
			googleApiKey,
		),
		new TikTokHandler(metadataFetcher, mediaAnalyzer, placeVerifier, googleApiKey),
	];

	// Find matching handler
	const handler = handlers.find((h) => h.canHandle(url));

	if (!handler) {
		console.log(
			JSON.stringify({
				error: "Unsupported URL. Only Instagram and TikTok URLs are supported.",
				supported_platforms: ["instagram.com", "tiktok.com"],
			}),
		);
		process.exit(1);
	}

	// Parse and extract
	const parsedUrl = handler.parseUrl(url);
	if (!parsedUrl) {
		console.log(JSON.stringify({ error: "Could not parse URL format" }));
		process.exit(1);
	}

	const result = await handler.extract(parsedUrl);

	// Output result
	console.log(JSON.stringify(result, null, 2));
} catch (err) {
	console.error(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
	process.exit(1);
}
