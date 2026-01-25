import type { Meta, StoryObj } from "@storybook/react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/design-system/components/ui/form";
import { Input } from "@/features/design-system/components/ui/input";

const meta: Meta<typeof Form> = {
  title: "Design System/Form",
  component: Form,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Form>;

const schema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
});

type Values = z.infer<typeof schema>;

function BasicFormExample() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ticker: "" },
  });

  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(() => undefined)}
        >
          <FormField
            control={form.control}
            name="ticker"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticker</FormLabel>
                <FormControl>
                  <Input placeholder="AAPL" {...field} />
                </FormControl>
                <FormDescription>Example: AAPL, TSLA.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicFormExample />,
};
