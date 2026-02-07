import type { Meta, StoryObj } from "@storybook/react";
import { parseISO } from "date-fns";
import { useState } from "react";

import { DatePicker } from "@/features/design-system/components/DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "Design System/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

function DefaultDemo() {
  const [value, setValue] = useState("2026-02-07");

  return (
    <div className="w-[320px]">
      <DatePicker onChange={setValue} value={value} />
      <p className="mt-2 text-xs text-muted-foreground">ISO: {value}</p>
    </div>
  );
}

function WithRangeDemo() {
  const [value, setValue] = useState("2026-02-07");

  return (
    <div className="w-[320px]">
      <DatePicker
        maxDate={parseISO("2026-02-07")}
        minDate={parseISO("2021-02-07")}
        onChange={setValue}
        value={value}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Zakres: 2021-02-07 - 2026-02-07
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultDemo />,
};

export const WithRange: Story = {
  render: () => <WithRangeDemo />,
};
