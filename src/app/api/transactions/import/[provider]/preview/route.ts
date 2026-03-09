import { NextResponse } from "next/server";

import { requireBrokerImportProvider } from "@/features/transactions/server/broker-import/provider-registry";
import { apiError, apiFromUnknownError } from "@/lib/http/api-error";
import { getAuthenticatedSupabase } from "@/lib/http/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "",
]);

type Props = Readonly<{
  params: Promise<{
    provider: string;
  }>;
}>;

export async function POST(request: Request, { params }: Props) {
  const auth = await getAuthenticatedSupabase({
    unauthorizedMessage: "Zaloguj się, aby zaimportować historię od brokera.",
  });
  if (!auth.ok) {
    return auth.response;
  }

  const { provider: providerParam } = await params;

  try {
    const provider = requireBrokerImportProvider(providerParam as never);
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
        code: "BROKER_IMPORT_FILES_MISSING",
        message: "Dodaj przynajmniej jeden plik eksportu brokera.",
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
        code: "BROKER_IMPORT_INVALID_FILE_TYPE",
        message: "Importer brokera obsługuje tylko wspierane pliki eksportu.",
        details: { fileName: invalidFile.name, provider: provider.id },
        request,
      });
    }

    const invalidMimeFile = files.find((file) => !XLSX_MIME_TYPES.has(file.type));
    if (invalidMimeFile) {
      return apiError({
        status: 400,
        code: "BROKER_IMPORT_INVALID_FILE_MIME",
        message: "Wybrany plik nie wygląda jak wspierany eksport brokera.",
        details: { fileName: invalidMimeFile.name, provider: provider.id },
        request,
      });
    }

    const preview = await provider.buildPreview(createAdminClient(), files, baseCurrency);
    return NextResponse.json(preview);
  } catch (error) {
    return apiFromUnknownError({
      error,
      request,
      fallbackMessage: "Nie udało się przygotować podglądu importu brokera.",
      fallbackCode: "BROKER_IMPORT_PREVIEW_FAILED",
    });
  }
}
