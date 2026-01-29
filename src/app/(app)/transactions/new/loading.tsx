export default function AddTransactionLoading() {
  return (
    <main className="px-6 py-8">
      <div className="space-y-2">
        <div className="h-6 w-40 rounded-md bg-muted/50" />
        <div className="h-4 w-56 rounded-md bg-muted/40" />
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
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
    </main>
  );
}
