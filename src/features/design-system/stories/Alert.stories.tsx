import type { Meta, StoryObj } from "@storybook/react";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const meta: Meta<typeof Alert> = {
  title: "Design System/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Inline: Story = {
  render: () => (
    <div className="w-[360px]">
      <Alert className="border-none p-0 shadow-none">
        <AlertTitle>Uwaga</AlertTitle>
        <AlertDescription>To jest krótki komunikat inline.</AlertDescription>
      </Alert>
    </div>
  ),
};
