export type ScreenshotImportStep = "portfolio" | "upload" | "review";

export type ScreenshotImportStepMeta = Readonly<{
  id: ScreenshotImportStep;
  label: string;
}>;

export type ScreenshotImportPreviewState = Readonly<{
  status: "idle" | "loading" | "ready" | "error";
  totalUsd: string | null;
  missingQuotes: number;
  missingFx: number;
  asOf: string | null;
  errorMessage: string | null;
}>;
