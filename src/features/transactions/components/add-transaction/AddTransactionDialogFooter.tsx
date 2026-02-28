"use client";

import { LoaderCircle } from "lucide-react";

import { StatusStrip } from "@/features/design-system";
import { Button } from "@/features/design-system/components/ui/button";

type SubmitIntent = "close" | "addAnother";

export function AddTransactionDialogFooter({
  isEditMode,
  isDirty,
  isSubmitting,
  isSubmittable,
  rootError,
  submitIntent,
  onClose,
  onSubmitIntentChange,
}: Readonly<{
  isEditMode: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmittable: boolean;
  rootError?: string;
  submitIntent: SubmitIntent;
  onClose: () => void;
  onSubmitIntentChange: (nextIntent: SubmitIntent) => void;
}>) {
  return (
    <footer className="sticky bottom-0 z-10 border-t border-dashed border-border/65 bg-card/92 px-5 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:px-6 md:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5 space-y-1">
          {isSubmitting ? (
            <StatusStrip label="Status: zapisywanie" />
          ) : rootError ? (
            <StatusStrip label="Status: błąd zapisu" tone="negative" />
          ) : isDirty ? (
            <StatusStrip label="Status: w edycji" />
          ) : (
            <StatusStrip label="Status: gotowe" />
          )}
          {rootError ? (
            <p className="text-[12px] text-[color:var(--loss)]">{rootError}</p>
          ) : null}
        </div>

        {isEditMode ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              onClick={onClose}
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="h-10 rounded-full px-6"
            >
              Anuluj
            </Button>
            <Button
              disabled={!isSubmittable || isSubmitting}
              type="submit"
              className="h-10 min-w-32 rounded-full px-6"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz zmiany"
              )}
            </Button>
          </div>
        ) : (
          <div className="flex w-full max-w-[320px] flex-col gap-2 sm:ml-auto">
            <Button
              disabled={!isSubmittable || isSubmitting}
              onClick={() => onSubmitIntentChange("close")}
              type="submit"
              className="h-11 w-full rounded-2xl px-6"
            >
              {isSubmitting && submitIntent === "close" ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Zapisywanie...
                </>
              ) : (
                "Dodaj transakcję"
              )}
            </Button>
            <Button
              disabled={!isSubmittable || isSubmitting}
              onClick={() => onSubmitIntentChange("addAnother")}
              type="submit"
              variant="outline"
              className="h-11 w-full rounded-2xl px-6"
            >
              {isSubmitting && submitIntent === "addAnother" ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz i dodaj kolejną"
              )}
            </Button>
          </div>
        )}
      </div>
    </footer>
  );
}
