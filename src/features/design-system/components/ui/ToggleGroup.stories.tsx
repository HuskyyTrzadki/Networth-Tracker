import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

function SingleExample() {
  const [value, setValue] = useState("performance");

  return (
    <ToggleGroup type="single" value={value} onValueChange={setValue}>
      <ToggleGroupItem value="performance">Performance</ToggleGroupItem>
      <ToggleGroupItem value="value">Wartość</ToggleGroupItem>
    </ToggleGroup>
  );
}

function RangeExample() {
  const [value, setValue] = useState("7D");

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={setValue}
      className="flex flex-wrap gap-2"
    >
      <ToggleGroupItem value="1D">1D</ToggleGroupItem>
      <ToggleGroupItem value="7D">7D</ToggleGroupItem>
      <ToggleGroupItem value="1M">1M</ToggleGroupItem>
      <ToggleGroupItem value="3M">3M</ToggleGroupItem>
      <ToggleGroupItem value="YTD">YTD</ToggleGroupItem>
      <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
      <ToggleGroupItem value="ALL">ALL</ToggleGroupItem>
    </ToggleGroup>
  );
}

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Single: Story = {
  render: () => <SingleExample />,
};

export const Range: Story = {
  render: () => <RangeExample />,
};
