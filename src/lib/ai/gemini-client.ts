import { getGeminiEnv } from "./env";

type GenerateJsonInput = Readonly<{
  systemInstruction: string;
  userPrompt: string;
}>;

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateGeminiJson(
  input: GenerateJsonInput
): Promise<string> {
  const env = getGeminiEnv();
  const response = await fetch(
    `${GEMINI_ENDPOINT}/${env.model}:generateContent?key=${env.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: input.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: input.userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          topP: 0.95,
          topK: 1,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Gemini request failed (${response.status}): ${text || "No response body."}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini response missing JSON content.");
  }

  return text;
}
