export default function LoadingStockReportPage() {
  return (
    <main className="space-y-6">
      <div className="h-20 animate-pulse border-b border-dashed border-black/15 bg-card/55" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <div className="h-[460px] animate-pulse border-b border-dashed border-black/15 bg-card/55" />
          <div className="h-[380px] animate-pulse border-b border-dashed border-black/15 bg-card/55" />
        </div>
        <div className="space-y-4">
          <div className="h-52 animate-pulse border-b border-dashed border-black/15 bg-card/55" />
          <div className="h-40 animate-pulse border-b border-dashed border-black/15 bg-card/55" />
          <div className="h-40 animate-pulse border-b border-dashed border-black/15 bg-card/55" />
        </div>
      </div>
    </main>
  );
}
