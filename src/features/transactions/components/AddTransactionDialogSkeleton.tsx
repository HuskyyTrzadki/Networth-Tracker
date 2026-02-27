type Props = Readonly<{
  fullscreen?: boolean;
}>;

export function AddTransactionDialogSkeleton({ fullscreen = false }: Props) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          : "mx-auto w-full max-w-[1080px]"
      }
    >
      <div className="w-[95vw] max-w-[1080px] overflow-hidden rounded-lg border border-border/65 bg-background">
        <div className="space-y-2 border-b border-dashed border-border/60 bg-card/92 px-6 py-5">
          <div className="h-5 w-44 rounded-md bg-muted/50" />
          <div className="h-4 w-72 rounded-md bg-muted/40" />
        </div>

        <div className="grid gap-4 bg-background/40 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4 rounded-lg border border-border/65 bg-card/94 p-4 shadow-[var(--surface-shadow)] sm:p-5">
            {Array.from({ length: 6 }).map((_, index) => (
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

        <div className="flex justify-end gap-2 border-t border-dashed border-border/60 bg-card/92 px-6 py-5">
          <div className="h-9 w-24 rounded-md bg-muted/40" />
          <div className="h-9 w-36 rounded-md bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
