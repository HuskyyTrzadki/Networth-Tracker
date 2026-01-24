import type { Meta, StoryObj } from "@storybook/react";

import { DashboardEmptyState } from "@/features/portfolio";

const meta: Meta<typeof DashboardEmptyState> = {
  title: "Portfolio/DashboardEmptyState",
  component: DashboardEmptyState,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof DashboardEmptyState>;

export const Default: Story = {
  args: {
    title: "Twój portfel jest pusty.",
    subtitle: "Dodaj swoje pierwsze aktywo, aby zobaczyć analizę.",
    primaryAction: {
      label: "Dodaj transakcję",
      href: "/transactions/new",
    },
    secondaryAction: {
      label: "Importuj CSV",
      href: "/transactions/new?import=csv",
    },
  },
};
