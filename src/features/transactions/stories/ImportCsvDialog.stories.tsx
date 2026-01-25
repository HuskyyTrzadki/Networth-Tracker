import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import { ImportCsvDialog } from "@/features/transactions/components/ImportCsvDialog";

const meta: Meta<typeof ImportCsvDialog> = {
  title: "Transactions/Import CSV Dialog",
  component: ImportCsvDialog,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof ImportCsvDialog>;

function Demo() {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-dvh bg-background p-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Background</div>
            <div className="text-sm text-muted-foreground">
              Placeholder for the upcoming importer flow.
            </div>
          </div>
          <Button onClick={() => setOpen(true)} size="lg">
            Open modal
          </Button>
        </div>
      </div>

      <ImportCsvDialog onOpenChange={setOpen} open={open} />
    </div>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

