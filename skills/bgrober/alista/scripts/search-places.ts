#!/usr/bin/env bun
/**
 * Search saved places using hybrid FTS + vector search.
 *
 * Usage: bun scripts/search-places.ts --query "coffee" [--type cafe] [--limit 5] [--list]
 * Output: JSON array of matching places
 */

import { getAllPlaces, getDb, searchPlaces } from "./lib/db";
import { generateEmbedding } from "./lib/embedding";

const args = process.argv.slice(2);
let query = "";
let contentType = "";
let limit = 10;
let listAll = false;

for (let i = 0; i < args.length; i++) {
	switch (args[i]) {
		case "--query":
			query = args[++i];
			break;
		case "--type":
			contentType = args[++i];
			break;
		case "--limit":
			limit = Number.parseInt(args[++i], 10);
			break;
		case "--list":
			listAll = true;
			break;
		default:
			if (!query) query = args[i];
	}
}

try {
	const db = getDb();

	if (listAll || !query) {
		// List all places
		const places = getAllPlaces({
			contentType: contentType || undefined,
			limit,
			status: "active",
		});

		console.log(
			JSON.stringify(
				{
					count: places.length,
					places: places.map((p) => ({
						id: p.id,
						name: p.name,
						city: p.city,
						category: p.content_type,
						address: p.address,
						status: p.status,
						created_at: p.created_at,
					})),
				},
				null,
				2,
			),
		);
	} else {
		// Hybrid search
		let queryEmbedding: number[] | undefined;
		try {
			queryEmbedding = await generateEmbedding(query);
		} catch {
			// Continue without vector search if embedding fails
		}

		const results = searchPlaces(query, {
			contentType: contentType || undefined,
			limit,
			queryEmbedding,
		});

		console.log(
			JSON.stringify(
				{
					query,
					count: results.length,
					results: results.map((r) => ({
						id: r.place.id,
						name: r.place.name,
						city: r.place.city,
						category: r.place.content_type,
						address: r.place.address,
						score: r.score,
						matchType: r.matchType,
					})),
				},
				null,
				2,
			),
		);
	}
} catch (err) {
	console.error(
		JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
	);
	process.exit(1);
}
