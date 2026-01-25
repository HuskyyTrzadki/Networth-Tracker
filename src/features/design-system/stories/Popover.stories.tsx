import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/features/design-system/components/ui/button";
import { Input } from "@/features/design-system/components/ui/input";
import { Label } from "@/features/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";

const meta: Meta<typeof Popover> = {
  title: "Design System/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold tracking-tight">
              Quick input
            </div>
            <p className="text-sm text-muted-foreground">
              Small surface for a short action.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ticker">Ticker</Label>
            <Input id="ticker" placeholder="AAPL" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
