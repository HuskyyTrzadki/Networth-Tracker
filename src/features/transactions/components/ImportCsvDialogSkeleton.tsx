import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";

type Props = Readonly<{
  fullscreen?: boolean;
}>;

function ImportCsvDialogSkeletonContent() {
  return (
    <div className="flex flex-col bg-card/96">
      <div className="space-y-2 border-b border-dashed border-border/60 bg-card/92 px-5 py-4 md:px-6 md:py-5">
        <div className="h-3 w-24 animate-pulse rounded-md bg-muted/35" />
        <div className="h-6 w-36 animate-pulse rounded-md bg-muted/45" />
        <div className="h-3 w-56 animate-pulse rounded-md bg-muted/30" />
      </div>

      <div className="space-y-4 bg-background/38 px-5 py-4 md:px-6 md:py-5">
        <div className="rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)]">
          <div className="h-20 animate-pulse rounded-md bg-muted/35" />
        </div>
        <div className="rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)]">
          <div className="h-24 animate-pulse rounded-md bg-muted/30" />
        </div>
      </div>

      <div className="flex justify-end border-t border-dashed border-border/60 bg-card/92 px-5 py-4 md:px-6 md:py-5">
        <div className="h-10 w-24 animate-pulse rounded-full bg-muted/35" />
      </div>
    </div>
  );
}

export function ImportCsvDialogSkeleton({ fullscreen = false }: Props) {
  if (fullscreen) {
    return (
      <Dialog open>
        <DialogContent className="overflow-hidden border border-border/70 bg-card p-0 shadow-[var(--surface-shadow)] sm:max-w-xl">
          <DialogTitle className="sr-only">Ładowanie importu CSV</DialogTitle>
          <DialogDescription className="sr-only">
            Trwa przygotowanie widoku importu CSV.
          </DialogDescription>
          <ImportCsvDialogSkeletonContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-border/70 bg-card shadow-[var(--surface-shadow)]">
      <ImportCsvDialogSkeletonContent />
    </div>
  );
}
