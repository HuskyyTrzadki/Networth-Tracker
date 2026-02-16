import type { Meta, StoryObj } from "@storybook/react";

import { Container } from "@/features/common";
import { DesignSurface } from "../components/DesignSurface";

function readCssVar(cssVar: `--${string}`) {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
}

function Swatch({
  name,
  className,
  sampleClassName,
  cssVar,
}: Readonly<{
  name: string;
  className: string;
  sampleClassName?: string;
  cssVar: `--${string}`;
}>) {
  const hex = readCssVar(cssVar);

  return (
    <div className="rounded-md border border-border/80 bg-card">
      <div className={`h-12 rounded-t-md ${className}`} />
      <div className="flex items-center justify-between px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
            {hex}
          </div>
        </div>
        <div className={`text-xs font-mono tabular-nums ${sampleClassName ?? ""}`}>
          Aa
        </div>
      </div>
    </div>
  );
}

function ColorsStory() {
  return (
    <DesignSurface className="p-6">
      <Container className="max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Paleta kolorów</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Swatch name="Tło" className="bg-background" cssVar="--background" />
          <Swatch
            name="Tekst"
            className="bg-foreground"
            sampleClassName="text-background"
            cssVar="--foreground"
          />
          <Swatch name="Karta" className="bg-card" cssVar="--card" />
          <Swatch name="Popover" className="bg-popover" cssVar="--popover" />
          <Swatch
            name="Główny"
            className="bg-primary"
            sampleClassName="text-primary-foreground"
            cssVar="--primary"
          />
          <Swatch
            name="Drugorzędny"
            className="bg-secondary"
            sampleClassName="text-secondary-foreground"
            cssVar="--secondary"
          />
          <Swatch
            name="Akcent"
            className="bg-accent"
            sampleClassName="text-accent-foreground"
            cssVar="--accent"
          />
          <Swatch
            name="Wyciszony"
            className="bg-muted"
            sampleClassName="text-muted-foreground"
            cssVar="--muted"
          />
          <Swatch
            name="Destrukcyjny"
            className="bg-destructive"
            sampleClassName="text-destructive-foreground"
            cssVar="--destructive"
          />
          <Swatch name="Obramowanie" className="bg-border" cssVar="--border" />
          <Swatch name="Pole" className="bg-input" cssVar="--input" />
          <Swatch name="Obwódka (focus)" className="bg-ring" cssVar="--ring" />
          <Swatch name="Wykres 1" className="bg-chart-1" cssVar="--chart-1" />
          <Swatch name="Wykres 2" className="bg-chart-2" cssVar="--chart-2" />
          <Swatch name="Wykres 3" className="bg-chart-3" cssVar="--chart-3" />
          <Swatch name="Wykres 4" className="bg-chart-4" cssVar="--chart-4" />
          <Swatch name="Wykres 5" className="bg-chart-5" cssVar="--chart-5" />
          <Swatch
            name="Zysk"
            className="bg-profit"
            sampleClassName="text-white"
            cssVar="--profit"
          />
          <Swatch
            name="Strata"
            className="bg-loss"
            sampleClassName="text-white"
            cssVar="--loss"
          />
          <Swatch
            name="Panel boczny"
            className="bg-sidebar"
            sampleClassName="text-sidebar-foreground"
            cssVar="--sidebar"
          />
          <Swatch
            name="Panel: primary"
            className="bg-sidebar-primary"
            sampleClassName="text-sidebar-primary-foreground"
            cssVar="--sidebar-primary"
          />
          <Swatch
            name="Panel: accent"
            className="bg-sidebar-accent"
            sampleClassName="text-sidebar-accent-foreground"
            cssVar="--sidebar-accent"
          />
          <Swatch
            name="Panel: border"
            className="bg-sidebar-border"
            cssVar="--sidebar-border"
          />
          <Swatch
            name="Panel: ring"
            className="bg-sidebar-ring"
            cssVar="--sidebar-ring"
          />
        </div>
      </Container>
    </DesignSurface>
  );
}

const meta: Meta<typeof ColorsStory> = {
  title: "Design System/Colors",
  component: ColorsStory,
};

export default meta;
type Story = StoryObj<typeof ColorsStory>;

export const Colors: Story = {};
