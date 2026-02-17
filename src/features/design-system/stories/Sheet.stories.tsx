import type { Meta, StoryObj } from "@storybook/react";
import { X } from "lucide-react";
import * as React from "react";

import { Container } from "@/features/common";
import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
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
} from "@/features/design-system/components/ui/sheet";

import { DesignSurface } from "../components/DesignSurface";

function SheetStory() {
  const [open, setOpen] = React.useState(false);

  const formId = "design-system-sheet-form";

  const fields = Array.from({ length: 18 }, (_, index) => ({
    id: `field-${index + 1}`,
    label: `Pole ${index + 1}`,
    placeholder: "Wpisz wartość…",
  }));

  return (
    <DesignSurface className="p-6">
      <Container className="max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sheet (centrum operacyjne)
          </h1>
          <p className="text-sm text-muted-foreground">
            Zmień rozmiar okna, żeby zobaczyć zachowanie mobile/desktop.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">Pozycja w portfelu</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Szybka edycja i akcje w panelu bocznym.
              </div>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button>Otwórz panel</Button>
              </SheetTrigger>

              <SheetContent side="right">
                <SheetHeader>
                  <div className="min-w-0">
                    <SheetTitle className="truncate">Edytuj pozycję</SheetTitle>
                    <SheetDescription className="mt-1">
                      Szczegóły, szybki podgląd i akcje.
                    </SheetDescription>
                  </div>
                  <SheetClose asChild>
                    <Button size="icon" variant="ghost" aria-label="Zamknij">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <SheetBody>
                  <div
                    id={formId}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Formularz</div>
                      <div className="text-xs text-muted-foreground">
                        Treść scrolluje się niezależnie, footer jest zawsze widoczny.
                      </div>
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
                  </div>
                </SheetBody>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="outline">Anuluj</Button>
                  </SheetClose>
                  <Button type="button" onClick={() => setOpen(false)} form={formId}>
                    Zapisz
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
