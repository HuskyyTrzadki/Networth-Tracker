import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/features/design-system/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <Button size="lg">Primary — Dodaj transakcję</Button>
      <Button size="lg" variant="outline">
        Outline — Importuj CSV
      </Button>
      <Button size="lg" variant="secondary">
        Secondary
      </Button>
      <Button size="lg" variant="ghost">
        Ghost
      </Button>
      <Button size="lg" variant="link">
        Link
      </Button>
      <Button size="lg" variant="destructive">
        Destructive
      </Button>
    </div>
  ),
};
