export const GEMINI_ECONOMIC_MODEL = "gemini-2.5-flash-lite";

export type GeminiEnv = Readonly<{
  apiKey: string;
  model: string;
}>;

export function getGeminiEnv(): GeminiEnv {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Missing GEMINI_API_KEY env var.");
  }

  return {
    apiKey,
    model: GEMINI_ECONOMIC_MODEL,
  };
}
