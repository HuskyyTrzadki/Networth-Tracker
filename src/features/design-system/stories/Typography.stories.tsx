import type { Meta, StoryObj } from "@storybook/react";
import { useTranslations } from "next-intl";

import { Container } from "@/features/common";
import { DesignSurface } from "../components/DesignSurface";

function TypographyStory() {
  const t = useTranslations("DesignSystem.Typography");

  return (
    <DesignSurface className="p-6">
      <Container className="max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("body")}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">{t("heading")}</div>
          <div className="space-y-1">
            <div className="text-3xl font-semibold tracking-tight">
              {t("sampleProductName")}
            </div>
            <div className="text-lg font-medium tracking-tight">
              {t("sampleProductName")}
            </div>
            <div className="text-base font-medium">{t("sampleProductName")}</div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">{t("body")}</div>
          <p className="text-base leading-6">
            {t("sampleBodySentence")}
          </p>
          <p className="text-base leading-6 text-muted-foreground">{t("muted")}</p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">{t("serif")}</div>
          <p className="font-serif text-xl leading-7">
            {t("sampleSerifSentence")}
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">{t("mono")}</div>
          <div className="space-y-2 font-mono text-sm tabular-nums">
            <div>{t("numbers")}: 1 234 567.89</div>
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
