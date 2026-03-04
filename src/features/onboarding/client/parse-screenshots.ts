import type { ScreenshotHoldingDraft } from "../lib/screenshot-holdings";
import { toClientError } from "@/lib/http/client-error";

export type ParseScreenshotsResponse = Readonly<{
  holdings: ScreenshotHoldingDraft[];
}>;

export async function parseScreenshots(
  files: readonly File[]
): Promise<ParseScreenshotsResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("screenshots", file));

  const response = await fetch("/api/onboarding/screenshot/parse", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw toClientError(
      payload,
      "Nie udało się przetworzyć zrzutów.",
      response.status
    );
  }

  if (!payload || typeof payload !== "object" || !("holdings" in payload)) {
    throw new Error("Nieprawidłowa odpowiedź serwera.");
  }

  return payload as ParseScreenshotsResponse;
}
