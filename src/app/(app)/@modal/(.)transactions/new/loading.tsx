export default function AddTransactionModalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-[95vw] max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
        <div className="space-y-3">
          <div className="h-5 w-40 rounded-md bg-muted/50" />
          <div className="h-4 w-64 rounded-md bg-muted/40" />
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3 w-24 rounded-md bg-muted/40" />
              <div className="h-10 rounded-md bg-muted/50" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <div className="h-9 w-24 rounded-md bg-muted/40" />
          <div className="h-9 w-32 rounded-md bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
