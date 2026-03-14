import { Card, CardContent } from "@/features/design-system/components/ui/card";

type LegalSection = Readonly<{
  title: string;
  paragraphs: readonly string[];
}>;

type Props = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  updatedAt: string;
  note?: string | null;
  sections: readonly LegalSection[];
}>;

export function LegalDocument({
  eyebrow,
  title,
  summary,
  updatedAt,
  note = null,
  sections,
}: Props) {
  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="space-y-4 rounded-[28px] border border-border/75 bg-card/95 px-6 py-6 shadow-[var(--surface-shadow)] sm:px-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="max-w-3xl font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-border/80 pt-4 text-xs text-muted-foreground">
          <span>Ostatnia aktualizacja: {updatedAt}</span>
          {note ? (
            <>
              <span aria-hidden="true">•</span>
              <span>{note}</span>
            </>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-border/70 bg-card/95 shadow-[var(--surface-shadow)]">
            <CardContent className="space-y-3 p-6 sm:p-7">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm leading-7 text-muted-foreground">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </article>
  );
}
