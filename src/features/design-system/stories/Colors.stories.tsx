import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";

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
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className={`h-12 rounded-t-lg ${className}`} />
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
  const t = useTranslations("DesignSystem.Colors");

  return (
    <DesignSurface className="p-6">
      <Container className="max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Swatch name={t("swatches.background")} className="bg-background" cssVar="--background" />
          <Swatch
            name={t("swatches.foreground")}
            className="bg-foreground"
            sampleClassName="text-background"
            cssVar="--foreground"
          />
          <Swatch name={t("swatches.card")} className="bg-card" cssVar="--card" />
          <Swatch name={t("swatches.popover")} className="bg-popover" cssVar="--popover" />
          <Swatch
            name={t("swatches.primary")}
            className="bg-primary"
            sampleClassName="text-primary-foreground"
            cssVar="--primary"
          />
          <Swatch
            name={t("swatches.secondary")}
            className="bg-secondary"
            sampleClassName="text-secondary-foreground"
            cssVar="--secondary"
          />
          <Swatch
            name={t("swatches.accent")}
            className="bg-accent"
            sampleClassName="text-accent-foreground"
            cssVar="--accent"
          />
          <Swatch
            name={t("swatches.muted")}
            className="bg-muted"
            sampleClassName="text-muted-foreground"
            cssVar="--muted"
          />
          <Swatch
            name={t("swatches.destructive")}
            className="bg-destructive"
            sampleClassName="text-destructive-foreground"
            cssVar="--destructive"
          />
          <Swatch name={t("swatches.border")} className="bg-border" cssVar="--border" />
          <Swatch name={t("swatches.input")} className="bg-input" cssVar="--input" />
          <Swatch name={t("swatches.ring")} className="bg-ring" cssVar="--ring" />
          <Swatch name={t("swatches.chart1")} className="bg-chart-1" cssVar="--chart-1" />
          <Swatch name={t("swatches.chart2")} className="bg-chart-2" cssVar="--chart-2" />
          <Swatch name={t("swatches.chart3")} className="bg-chart-3" cssVar="--chart-3" />
          <Swatch name={t("swatches.chart4")} className="bg-chart-4" cssVar="--chart-4" />
          <Swatch name={t("swatches.chart5")} className="bg-chart-5" cssVar="--chart-5" />
          <Swatch
            name={t("swatches.profit")}
            className="bg-profit"
            sampleClassName="text-white"
            cssVar="--profit"
          />
          <Swatch
            name={t("swatches.loss")}
            className="bg-loss"
            sampleClassName="text-white"
            cssVar="--loss"
          />
          <Swatch
            name={t("swatches.sidebar")}
            className="bg-sidebar"
            sampleClassName="text-sidebar-foreground"
            cssVar="--sidebar"
          />
          <Swatch
            name={t("swatches.sidebarPrimary")}
            className="bg-sidebar-primary"
            sampleClassName="text-sidebar-primary-foreground"
            cssVar="--sidebar-primary"
          />
          <Swatch
            name={t("swatches.sidebarAccent")}
            className="bg-sidebar-accent"
            sampleClassName="text-sidebar-accent-foreground"
            cssVar="--sidebar-accent"
          />
          <Swatch
            name={t("swatches.sidebarBorder")}
            className="bg-sidebar-border"
            cssVar="--sidebar-border"
          />
          <Swatch
            name={t("swatches.sidebarRing")}
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
