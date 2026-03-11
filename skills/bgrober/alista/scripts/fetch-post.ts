#!/usr/bin/env node
/**
 * Fetch raw metadata from a social media URL (Instagram or TikTok).
 * Returns structured data for the agent to reason about — no LLM calls, no place verification.
 *
 * Usage: tsx scripts/fetch-post.ts <url> [--download-images <dir>]
 *
 * Options:
 *   --download-images <dir>  Download post images to a local directory for analysis
 *   --extract-frames <dir>   Extract key frames from video to a local directory
 *
 * Output: JSON with raw post metadata including caption, tagged users, location, images, etc.
 */

import { SocialMetadataFetcher } from "./lib/metadata-fetcher";
import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));

if (!url) {
	console.error(JSON.stringify({ error: "Usage: tsx scripts/fetch-post.ts <url> [--download-images <dir>] [--extract-frames <dir>]" }));
	process.exit(1);
}

// Parse options
const downloadImagesIdx = args.indexOf("--download-images");
const downloadImagesDir = downloadImagesIdx !== -1 ? args[downloadImagesIdx + 1] : null;

const extractFramesIdx = args.indexOf("--extract-frames");
const extractFramesDir = extractFramesIdx !== -1 ? args[extractFramesIdx + 1] : null;

const apifyApiKey = process.env.APIFY_API_KEY;

if (!apifyApiKey) {
	console.error(JSON.stringify({ error: "APIFY_API_KEY is required" }));
	process.exit(1);
}

async function downloadImage(imageUrl: string, outPath: string): Promise<boolean> {
	try {
		const resp = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
		if (!resp.ok) return false;
		const buffer = Buffer.from(await resp.arrayBuffer());
		await writeFile(outPath, buffer);
		return true;
	} catch {
		return false;
	}
}

async function extractVideoFrames(videoUrl: string, outDir: string, count = 5): Promise<string[]> {
	const { execSync } = await import("node:child_process");
	const frames: string[] = [];
	try {
		// Get video duration
		const durationStr = execSync(
			`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoUrl}"`,
			{ timeout: 15000 }
		).toString().trim();
		const duration = parseFloat(durationStr);
		if (!duration || duration <= 0) return frames;

		// Extract evenly spaced frames
		const interval = duration / (count + 1);
		for (let i = 1; i <= count; i++) {
			const timestamp = (interval * i).toFixed(2);
			const outPath = join(outDir, `frame_${i}.jpg`);
			try {
				execSync(
					`ffmpeg -ss ${timestamp} -i "${videoUrl}" -frames:v 1 -q:v 2 "${outPath}" -y 2>/dev/null`,
					{ timeout: 20000 }
				);
				frames.push(outPath);
			} catch {
				// Skip frame on error
			}
		}
	} catch {
		// ffmpeg/ffprobe not available or video inaccessible
	}
	return frames;
}

async function main() {
	const fetcher = new SocialMetadataFetcher(apifyApiKey);

	// Detect platform
	const isInstagram = url.includes("instagram.com");
	const isTikTok = url.includes("tiktok.com") || url.includes("vm.tiktok.com");

	if (!isInstagram && !isTikTok) {
		console.error(JSON.stringify({ error: "Unsupported platform. Supports Instagram and TikTok." }));
		process.exit(1);
	}

	const startTime = Date.now();
	const metadata = isInstagram
		? await fetcher.getInstagramPost(url)
		: await fetcher.getTiktokVideo(url);

	if (!metadata) {
		console.error(JSON.stringify({ error: "Failed to fetch post metadata" }));
		process.exit(1);
	}

	const result: Record<string, unknown> = {
		platform: isInstagram ? "instagram" : "tiktok",
		url,
		caption: metadata.caption,
		ownerUsername: metadata.ownerUsername,
		postType: metadata.postType,
		locationName: metadata.locationName,
		locationId: metadata.locationId,
		taggedUsers: metadata.taggedUsers,
		mentions: metadata.mentions,
		hashtags: metadata.hashtags,
		altText: metadata.altText,
		transcript: metadata.transcript,
		imageCount: metadata.imageUrls?.length ?? 0,
		hasVideo: !!metadata.videoUrl,
		fetchDurationMs: Date.now() - startTime,
	};

	// Download images if requested
	if (downloadImagesDir && metadata.imageUrls && metadata.imageUrls.length > 0) {
		const absDir = resolve(downloadImagesDir);
		await mkdir(absDir, { recursive: true });

		const downloadedPaths: string[] = [];
		for (let i = 0; i < metadata.imageUrls.length; i++) {
			const ext = "jpg";
			const outPath = join(absDir, `image_${i + 1}.${ext}`);
			const ok = await downloadImage(metadata.imageUrls[i], outPath);
			if (ok) downloadedPaths.push(outPath);
		}
		result.downloadedImages = downloadedPaths;
	}

	// Extract video frames if requested
	if (extractFramesDir && metadata.videoUrl) {
		const absDir = resolve(extractFramesDir);
		await mkdir(absDir, { recursive: true });

		const frames = await extractVideoFrames(metadata.videoUrl, absDir);
		result.extractedFrames = frames;
	}

	// Include raw image URLs for reference
	if (metadata.imageUrls) {
		result.imageUrls = metadata.imageUrls;
	}
	if (metadata.videoUrl) {
		result.videoUrl = metadata.videoUrl;
	}

	console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
	console.error(JSON.stringify({ error: err.message }));
	process.exit(1);
});
