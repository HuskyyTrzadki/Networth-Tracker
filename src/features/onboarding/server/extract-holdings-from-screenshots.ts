import { generateGeminiJsonWithImages } from "@/lib/ai/gemini-client";
import { GEMINI_SCREENSHOT_MODEL } from "@/lib/ai/env";

import {
  normalizeScreenshotHoldingsForReview,
  type ScreenshotHoldingDraft,
} from "../lib/screenshot-holdings";

const SYSTEM_INSTRUCTION =
  "Jesteś silnikiem ekstrakcji danych zrzutów ekranu portfela. Zwracaj wyłącznie JSON, bez markdown.";

const USER_PROMPT =
  "Z podanych zrzutów ekranu wyciągnij listę pozycji. Zwróć JSON w formie tablicy obiektów {ticker, quantity}.\n" +
  "- ticker: symbol giełdowy lub kod waluty (PLN, USD, EUR, GBP, CHF)\n" +
  "- quantity: liczba jako string z kropką jako separator dziesiętny\n" +
  "Ignoruj ceny, wartości, średnie ceny, daty i inne kolumny. Jeśli nie jesteś pewny pozycji, pomiń ją. zostaw ta sama kolejnoscia co na SS oraz uwazaj na wauluty, waluty mozesz rozpoznac po nazwie gieldy";

export type ScreenshotImagePart = Readonly<{
  mimeType: string;
  data: string;
}>;

export async function extractHoldingsFromScreenshots(
  images: readonly ScreenshotImagePart[]
): Promise<ScreenshotHoldingDraft[]> {
  const responseText = await generateGeminiJsonWithImages({
    systemInstruction: SYSTEM_INSTRUCTION,
    userPrompt: USER_PROMPT,
    images,
    model: GEMINI_SCREENSHOT_MODEL,
  });

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Nie udało się odczytać odpowiedzi z AI.");
  }

  const holdings = normalizeScreenshotHoldingsForReview(parsed);
  if (holdings.length === 0) {
    throw new Error("Nie znaleźliśmy żadnych pozycji na zrzutach.");
  }

  return holdings;
}
