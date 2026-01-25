import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "@/features/design-system/components/ui/input";
import { Label } from "@/features/design-system/components/ui/label";

const meta: Meta<typeof Input> = {
  title: "Design System/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const States: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="input-default">Default</Label>
        <Input id="input-default" placeholder="Ticker (e.g. AAPL)" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="input-disabled">Disabled</Label>
        <Input id="input-disabled" placeholder="Disabled" disabled />
      </div>
    </div>
  ),
};
