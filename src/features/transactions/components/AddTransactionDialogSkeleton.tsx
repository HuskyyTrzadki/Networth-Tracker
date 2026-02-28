import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/features/design-system/components/ui/dialog";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  fullscreen?: boolean;
}>;

function AddTransactionDialogSkeletonContent({
  fullscreen = false,
}: Readonly<{ fullscreen?: boolean }>) {
  return (
    <div className={cn("flex flex-col", fullscreen ? "h-[92dvh]" : null)}>
      <div className="space-y-2 border-b border-dashed border-border/60 bg-card/92 px-6 py-5">
        <div className="h-5 w-44 rounded-md bg-muted/50" />
        <div className="h-4 w-72 rounded-md bg-muted/40" />
      </div>

      <div className="flex-1 overflow-hidden bg-background/40 px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4 rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-28 rounded-md bg-muted/40" />
                <div className="h-10 rounded-md bg-muted/50" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)]">
              <div className="h-20 rounded-md bg-muted/40" />
            </div>
            <div className="rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)]">
              <div className="h-28 rounded-md bg-muted/40" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-dashed border-border/60 bg-card/92 px-6 py-5">
        <div className="h-9 w-24 rounded-md bg-muted/40" />
        <div className="h-9 w-36 rounded-md bg-muted/50" />
      </div>
    </div>
  );
}

export function AddTransactionDialogSkeleton({ fullscreen = false }: Props) {
  if (fullscreen) {
    return (
      <Dialog open>
        <DialogContent
          className="max-h-[92dvh] overflow-hidden rounded-lg border border-border/70 bg-card/96 p-0 shadow-[var(--surface-shadow)] sm:max-w-[1080px]"
        >
          <DialogTitle className="sr-only">Ładowanie formularza transakcji</DialogTitle>
          <DialogDescription className="sr-only">
            Trwa przygotowanie danych formularza.
          </DialogDescription>
          <AddTransactionDialogSkeletonContent fullscreen />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <div className="w-[95vw] max-w-[1080px] overflow-hidden rounded-lg border border-border/65 bg-background">
        <AddTransactionDialogSkeletonContent />
      </div>
    </div>
  );
}
