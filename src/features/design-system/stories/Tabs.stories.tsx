import type { Meta, StoryObj } from "@storybook/react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/design-system/components/ui/tabs";

const meta: Meta<typeof Tabs> = {
  title: "Design System/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            Overview content
          </div>
        </TabsContent>
        <TabsContent value="positions" className="mt-4">
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            Positions content
          </div>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
            Activity content
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
};
