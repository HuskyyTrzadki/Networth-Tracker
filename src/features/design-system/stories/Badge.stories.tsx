import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "@/features/design-system/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Design System/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="stamp">Notowania z 19.02.2026 21:30</Badge>
    </div>
  ),
};
