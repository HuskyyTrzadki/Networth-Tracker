import type { Meta, StoryObj } from "@storybook/react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/features/design-system/components/ui/select";

const meta: Meta<typeof Select> = {
  title: "Design System/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4">
      <Select defaultValue="pln">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Currencies</SelectLabel>
            <SelectItem value="pln">PLN</SelectItem>
            <SelectItem value="usd">USD</SelectItem>
            <SelectItem value="eur" disabled>
              EUR (disabled)
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};
