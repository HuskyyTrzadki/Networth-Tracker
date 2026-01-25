import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";

import { Calendar } from "@/features/design-system/components/ui/calendar";

const meta: Meta<typeof Calendar> = {
  title: "Design System/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Calendar>;

function SingleDateExample() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-md"
      />
    </div>
  );
}

export const SingleDate: Story = {
  render: () => <SingleDateExample />,
};
