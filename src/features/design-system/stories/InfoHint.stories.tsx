import type { Meta, StoryObj } from "@storybook/react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { InfoHint } from "@/features/design-system/components/InfoHint";

const meta: Meta<typeof InfoHint> = {
  title: "Design System/InfoHint",
  component: InfoHint,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof InfoHint>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Akcje</span>
        <InfoHint
          text="Pokazuje dodatkowy kontekst dopiero po najechaniu, zeby nie przeciazac widoku."
          ariaLabel="Wyjasnienie pola Akcje"
        />
      </div>
    </TooltipProvider>
  ),
};
