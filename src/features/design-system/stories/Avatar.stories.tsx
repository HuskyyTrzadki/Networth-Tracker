import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarFallback } from "../components/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "Design System/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>SA</AvatarFallback>
    </Avatar>
  ),
};
