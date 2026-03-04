import { NextResponse } from "next/server";

import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";
import { extractHoldingsFromScreenshots } from "@/features/onboarding/server/extract-holdings-from-screenshots";

const MAX_FILES = 6;
const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024;

const isImageFile = (value: unknown): value is File =>
  typeof File !== "undefined" && value instanceof File;

export async function POST(request: Request) {
  const authResult = await getAuthenticatedSupabase();
  if (!authResult.ok) {
    return authResult.response;
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError({
      status: 400,
      code: "INVALID_FORM_DATA",
      message: "Nie udało się odczytać przesłanych plików.",
      request,
    });
  }

  const files = Array.from(formData.values()).filter(isImageFile);
  if (files.length === 0) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dodaj przynajmniej jeden zrzut ekranu.",
      request,
    });
  }

  if (files.length > MAX_FILES) {
    return apiError({
      status: 400,
      code: "VALIDATION_ERROR",
      message: `Dodaj maksymalnie ${MAX_FILES} zrzutów.`,
      request,
    });
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return apiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Obsługujemy tylko pliki graficzne.",
        request,
      });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Jeden z plików jest za duży (limit 6 MB).",
        request,
      });
    }
  }

  try {
    const images = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          mimeType: file.type,
          data: buffer.toString("base64"),
        } as const;
      })
    );

    const holdings = await extractHoldingsFromScreenshots(images);
    return NextResponse.json({ holdings }, { status: 200 });
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackCode: "SCREENSHOT_PARSE_FAILED",
    });
  }
}
