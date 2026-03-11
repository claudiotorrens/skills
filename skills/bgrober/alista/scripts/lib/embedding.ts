import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 3072;

export async function generateEmbedding(text: string, googleApiKey?: string): Promise<number[]> {
	const apiKey = googleApiKey ?? process.env.GOOGLE_API_KEY;
	if (!apiKey) throw new Error("GOOGLE_API_KEY is required for embeddings");

	const google = createGoogleGenerativeAI({ apiKey });
	const { embedding } = await embed({
		model: google.textEmbeddingModel(EMBEDDING_MODEL),
		value: text,
	});
	return embedding;
}

export async function generateEmbeddings(
	texts: string[],
	googleApiKey?: string,
): Promise<number[][]> {
	if (texts.length === 0) return [];

	const apiKey = googleApiKey ?? process.env.GOOGLE_API_KEY;
	if (!apiKey) throw new Error("GOOGLE_API_KEY is required for embeddings");

	const google = createGoogleGenerativeAI({ apiKey });
	const { embeddings } = await embedMany({
		model: google.textEmbeddingModel(EMBEDDING_MODEL),
		values: texts,
	});
	return embeddings;
}
