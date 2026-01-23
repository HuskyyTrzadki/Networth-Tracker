import type { Meta, StoryObj } from "@storybook/react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

import { Container } from "@/features/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DesignSurface } from "../components/DesignSurface";

function SheetStory() {
  const t = useTranslations("DesignSystem.Sheet");
  const [open, setOpen] = React.useState(false);

  const formId = "design-system-sheet-form";

  const fields = Array.from({ length: 18 }, (_, index) => ({
    id: `field-${index + 1}`,
    label: t("fieldLabel", { index: index + 1 }),
    placeholder: t("fieldPlaceholder"),
  }));

  return (
    <DesignSurface className="p-6">
      <Container className="max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageHint")}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{t("mockCardTitle")}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{t("mockCardSubtitle")}</div>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button>{t("open")}</Button>
              </SheetTrigger>

              <SheetContent side="right">
                <SheetHeader>
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{t("title")}</SheetTitle>
                    <SheetDescription className="mt-1">{t("description")}</SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button size="icon" variant="ghost" aria-label={t("close")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <SheetBody>
                  <form
                    id={formId}
                    className="space-y-6"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setOpen(false);
                    }}
                  >
                    <div className="space-y-2">
                      <div className="text-sm font-medium">{t("sectionTitle")}</div>
                      <div className="text-xs text-muted-foreground">{t("sectionHint")}</div>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <label
                            htmlFor={field.id}
                            className="text-sm font-medium leading-none"
                          >
                            {field.label}
                          </label>
                          <Input id={field.id} placeholder={field.placeholder} />
                        </div>
                      ))}
                    </div>
                  </form>
                </SheetBody>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">{t("cancel")}</Button>
                  </SheetClose>
                  <Button type="submit" form={formId}>
                    {t("save")}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </Container>
    </DesignSurface>
  );
}

const meta: Meta<typeof SheetStory> = {
  title: "Design System/Sheet",
  component: SheetStory,
};

export default meta;
type Story = StoryObj<typeof SheetStory>;

export const SheetPanel: Story = {};
