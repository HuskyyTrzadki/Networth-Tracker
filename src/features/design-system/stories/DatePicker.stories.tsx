import type { Meta, StoryObj } from "@storybook/react";

import { subYears } from "date-fns";
import { useState } from "react";

import { DatePicker } from "@/features/design-system/components/ui/date-picker";

const meta: Meta<typeof DatePicker> = {
  title: "Design System/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

function DatePickerExample() {
  const [value, setValue] = useState("2025-02-14");

  return (
    <div className="w-[22rem] rounded-lg border border-border bg-card p-4">
      <DatePicker
        maxDate={new Date()}
        minDate={subYears(new Date(), 5)}
        onChange={setValue}
        value={value}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DatePickerExample />,
};

