import { NextResponse } from "next/server";

import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildXtbImportPreview } from "@/features/transactions/server/xtb-import/preview-xtb-import";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "",
]);

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby zaimportować historię z XTB.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    const baseCurrencyRaw = formData.get("baseCurrency");
    const baseCurrency =
      typeof baseCurrencyRaw === "string" && baseCurrencyRaw.trim().length === 3
        ? baseCurrencyRaw.trim().toUpperCase()
        : "PLN";

    if (files.length === 0) {
      return apiError({
        status: 400,
        code: "XTB_IMPORT_FILES_MISSING",
        message: "Dodaj przynajmniej jeden plik Excel z XTB.",
        request,
      });
    }

    const invalidFile = files.find((file) => {
      const name = file.name.toLowerCase();
      return !name.endsWith(".xlsx") && !name.endsWith(".xls");
    });
    if (invalidFile) {
      return apiError({
        status: 400,
        code: "XTB_IMPORT_INVALID_FILE_TYPE",
        message: "Importer XTB obsługuje tylko rozpakowane pliki Excel (.xlsx, .xls).",
        details: { fileName: invalidFile.name },
        request,
      });
    }

    const invalidMimeFile = files.find((file) => !XLSX_MIME_TYPES.has(file.type));
    if (invalidMimeFile) {
      return apiError({
        status: 400,
        code: "XTB_IMPORT_INVALID_FILE_MIME",
        message: "Wybrany plik nie wygląda jak arkusz Excel XTB.",
        details: { fileName: invalidMimeFile.name },
        request,
      });
    }

    const preview = await buildXtbImportPreview(
      createAdminClient(),
      files,
      baseCurrency
    );
    return NextResponse.json(preview);
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się przygotować podglądu importu XTB.",
      fallbackCode: "XTB_IMPORT_PREVIEW_FAILED",
    });
  }
}
