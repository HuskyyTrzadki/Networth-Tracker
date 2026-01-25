import type { Meta, StoryObj } from "@storybook/react";

import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/features/design-system/components/ui/command";

const meta: Meta<typeof Command> = {
  title: "Design System/Command",
  component: Command,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Command>;

function CommandContent() {
  const items = [
    { label: "Portfolio", shortcut: "P" },
    { label: "Search", shortcut: "S" },
    { label: "Transactions", shortcut: "T" },
  ] as const;

  return (
    <>
      <CommandInput placeholder="Type to search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {items.map((item) => (
            <CommandItem key={item.label}>
              {item.label}
              <CommandShortcut>{item.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>Try as guest</CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  );
}

export const Inline: Story = {
  render: () => (
    <Command className="w-full max-w-md rounded-lg border border-border shadow-sm">
      <CommandContent />
    </Command>
  ),
};

function CommandDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <Button variant="default" onClick={() => setOpen(true)}>
        Open command dialog
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandContent />
      </CommandDialog>
    </div>
  );
}

export const Dialog: Story = {
  render: () => <CommandDialogExample />,
};
