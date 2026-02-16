import type { Meta, StoryObj } from "@storybook/react";

import { Container } from "@/features/common";
import { DesignSurface } from "../components/DesignSurface";

function TypographyStory() {
  return (
    <DesignSurface className="p-6">
      <Container className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Typografia</h1>
          <p className="text-sm text-muted-foreground">
            Tekst główny
          </p>
        </div>

        <div className="space-y-3 rounded-md border border-border/80 bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Nagłówek</div>
          <div className="space-y-1">
            <div className="text-3xl font-semibold tracking-tight">
              Portfolio Tracker
            </div>
            <div className="text-lg font-medium tracking-tight">
              Portfolio Tracker
            </div>
            <div className="text-base font-medium">Portfolio Tracker</div>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border/80 bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Tekst główny</div>
          <p className="text-base leading-6">
            Narzędzia do portfela powinny być precyzyjne, szybkie i godne zaufania.
          </p>
          <p className="text-base leading-6 text-muted-foreground">Tekst pomocniczy</p>
        </div>

        <div className="space-y-3 rounded-md border border-border/80 bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Szeryf (News)</div>
          <p className="font-serif text-xl leading-7">
            Rynki poruszają się historiami tak samo jak liczbami.
          </p>
        </div>

        <div className="space-y-3 rounded-md border border-border/80 bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Monospace (dane)</div>
          <div className="space-y-2 font-mono text-sm tabular-nums">
            <div>Liczby (tabular-nums): 1 234 567.89</div>
            <div>USD 10,245.32</div>
            <div>PLN 4,205.10</div>
          </div>
        </div>
      </Container>
    </DesignSurface>
  );
}

const meta: Meta<typeof TypographyStory> = {
  title: "Design System/Typography",
  component: TypographyStory,
};

export default meta;
type Story = StoryObj<typeof TypographyStory>;

export const Typography: Story = {};
