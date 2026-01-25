import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "@/features/design-system/components/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "Design System/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
      <Textarea placeholder="Why did I buy this? (e.g. -10% after earnings)" />
    </div>
  ),
};
