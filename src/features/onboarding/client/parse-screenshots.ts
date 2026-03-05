import type { ScreenshotHoldingDraft } from "../lib/screenshot-holdings";
import { requestJson } from "@/lib/http/client-request";

export type ParseScreenshotsResponse = Readonly<{
  holdings: ScreenshotHoldingDraft[];
}>;

export async function parseScreenshots(
  files: readonly File[]
): Promise<ParseScreenshotsResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("screenshots", file));

  const { payload } = await requestJson("/api/onboarding/screenshot/parse", {
    method: "POST",
    body: formData,
    fallbackMessage: "Nie udało się przetworzyć zrzutów.",
  });

  if (!payload || typeof payload !== "object" || !("holdings" in payload)) {
    throw new Error("Nieprawidłowa odpowiedź serwera.");
  }

  return payload as ParseScreenshotsResponse;
}
