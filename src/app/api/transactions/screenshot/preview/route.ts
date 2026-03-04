import { NextResponse } from "next/server";

import { apiFromUnknownError, apiValidationError } from "@/lib/http/api-error";
import {
  getAuthenticatedSupabase,
  parseJsonBody,
} from "@/lib/http/route-handler";
import { previewScreenshotHoldingsValueUsd } from "@/features/onboarding/server/screenshot-preview-service";
import {
  screenshotPreviewSchema,
  type ScreenshotPreviewPayload,
} from "@/features/transactions/lib/screenshot-preview-schema";

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const parsed = screenshotPreviewSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues, { request });
  }

  const payload: ScreenshotPreviewPayload = parsed.data;
  try {
    const result = await previewScreenshotHoldingsValueUsd(
      authResult.supabase,
      payload.holdings
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "SCREENSHOT_PREVIEW_FAILED",
    });
  }
}
