import type { ScreenshotHoldingDraft } from "../lib/screenshot-holdings";

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

  const payload = (await response.json().catch(() => null)) as
    | ParseScreenshotsResponse
    | { message?: string };

  if (!response.ok) {
    const message = payload && "message" in payload ? payload.message : null;
    throw new Error(message || "Nie udało się przetworzyć zrzutów.");
  }

  if (!payload || !("holdings" in payload)) {
    throw new Error("Nieprawidłowa odpowiedź serwera.");
  }

  return payload as ParseScreenshotsResponse;
}
