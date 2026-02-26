export const GEMINI_ECONOMIC_MODEL = "gemini-2.5-flash-lite";
export const GEMINI_SCREENSHOT_MODEL = "gemini-3-flash-preview";

export type GeminiEnv = Readonly<{
  apiKey: string;
  model: string;
}>;

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("Missing GEMINI_API_KEY env var.");
  }

  return apiKey;
}

export function getGeminiEnv(model = GEMINI_ECONOMIC_MODEL): GeminiEnv {
  return {
    apiKey: getGeminiApiKey(),
    model,
  };
}
