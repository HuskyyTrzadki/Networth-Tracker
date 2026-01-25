import type { Meta, StoryObj } from "@storybook/react";
import { format } from "date-fns";
import { useState } from "react";

import { AddTransactionDialog } from "@/features/transactions";
import { Button } from "@/features/design-system/components/ui/button";

const meta: Meta<typeof AddTransactionDialog> = {
  title: "Transactions/Add Transaction Dialog",
  component: AddTransactionDialog,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof AddTransactionDialog>;

function Demo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Background</div>
            <div className="text-sm text-muted-foreground">
              Dialog overlay should feel intentional.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <AddTransactionDialog onOpenChange={setOpen} open={open} />
    </div>
  );
}

function FilledDemo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Filled example</div>
            <div className="text-sm text-muted-foreground">
              Shows the “ready to save” state.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <AddTransactionDialog
        initialValues={{
          type: "BUY",
          assetId: "a987e7d4-3c70-4e1c-9b9b-3e8acb2f7b05",
          currency: "USD",
          date: format(new Date(), "yyyy-MM-dd"),
          quantity: "10",
          price: "100",
          fee: "1",
          notes: "Earnings dip",
        }}
        onOpenChange={setOpen}
        open={open}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

export const Filled: Story = {
  render: () => <FilledDemo />,
};
