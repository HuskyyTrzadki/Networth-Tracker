import { FIVE_YEAR_TREND_ANALYSIS } from "./stock-report-five-year-trend-analysis";
import StockReportCollapsible from "./StockReportCollapsible";

export default function StockReportFiveYearTrendAnalysisSection() {
  return (
    <section className="space-y-3 border-b border-dashed border-[color:var(--report-rule)] pb-6">
      <h3 className="text-2xl font-semibold tracking-tight">
        {FIVE_YEAR_TREND_ANALYSIS.title}
      </h3>
      <p className="text-sm text-muted-foreground">{FIVE_YEAR_TREND_ANALYSIS.subtitle}</p>

      <div className="space-y-2">
        {FIVE_YEAR_TREND_ANALYSIS.sections.map((section) => (
          <StockReportCollapsible
            key={section.title}
            title={section.title}
            className="rounded-sm border border-dashed border-[color:var(--report-rule)] px-3 py-2.5"
            contentClassName="space-y-3 border-t border-dashed border-[color:var(--report-rule)] pt-2.5"
          >
            {section.description ? (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            ) : null}
            {section.subsections.map((subsection) => (
              <article key={subsection.title} className="space-y-1.5">
                <h4 className="text-sm font-semibold tracking-tight">{subsection.title}</h4>
                <p className="text-sm text-foreground/90">{subsection.body}</p>
              </article>
            ))}
          </StockReportCollapsible>
        ))}
      </div>
    </section>
  );
}
