import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";

import { BrokerImportDialog } from "../components/BrokerImportDialog";

const meta: Meta<typeof BrokerImportDialog> = {
  title: "Onboarding/Broker Import Dialog",
  component: BrokerImportDialog,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof BrokerImportDialog>;

function Demo({
  broker,
}: Readonly<{
  broker: "ibkr" | "xtb";
}>) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Preview onboarding import step</div>
            <div className="text-sm text-muted-foreground">
              Placeholder guidance + CSV upload shell for {broker.toUpperCase()}.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <BrokerImportDialog
        broker={broker}
        onOpenChange={setOpen}
        open={open}
        portfolio={{
          id: "portfolio-1",
          name: "Portfel testowy",
          baseCurrency: "PLN",
        }}
      />
    </div>
  );
}

export const IBKR: Story = {
  render: () => <Demo broker="ibkr" />,
};

export const XTB: Story = {
  render: () => <Demo broker="xtb" />,
};
