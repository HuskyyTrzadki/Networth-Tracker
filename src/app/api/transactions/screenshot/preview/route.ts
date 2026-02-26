import { NextResponse } from "next/server";

import {
  getAuthenticatedSupabase,
  parseJsonBody,
  toErrorMessage,
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
    return NextResponse.json(
      { message: "Invalid input.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload: ScreenshotPreviewPayload = parsed.data;
  try {
    const result = await previewScreenshotHoldingsValueUsd(
      authResult.supabase,
      payload.holdings
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
