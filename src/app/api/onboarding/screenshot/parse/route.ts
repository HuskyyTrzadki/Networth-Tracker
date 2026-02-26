import { NextResponse } from "next/server";

import { getAuthenticatedSupabase, toErrorMessage } from "@/lib/http/route-handler";
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
    return NextResponse.json(
      { message: "Nie udało się odczytać przesłanych plików." },
      { status: 400 }
    );
  }

  const files = Array.from(formData.values()).filter(isImageFile);
  if (files.length === 0) {
    return NextResponse.json(
      { message: "Dodaj przynajmniej jeden zrzut ekranu." },
      { status: 400 }
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { message: `Dodaj maksymalnie ${MAX_FILES} zrzutów.` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Obsługujemy tylko pliki graficzne." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Jeden z plików jest za duży (limit 6 MB)." },
        { status: 400 }
      );
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
    const message = toErrorMessage(error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
