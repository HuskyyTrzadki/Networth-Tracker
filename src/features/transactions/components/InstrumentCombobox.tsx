"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/features/design-system/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/features/design-system/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";

import { instrumentOptions, type InstrumentOption } from "../lib/instrument-options";

function getInstrumentById(id: string | null | undefined): InstrumentOption | null {
  if (!id) return null;
  return instrumentOptions.find((option) => option.id === id) ?? null;
}

type Props = Readonly<{
  value: string | null;
  onChange: (next: InstrumentOption) => void;
}>;

export function InstrumentCombobox({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const selected = getInstrumentById(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between gap-3 px-3",
            !selected && "text-muted-foreground"
          )}
          role="combobox"
          variant="outline"
        >
          <span className="flex min-w-0 items-center gap-3">
            {selected ? (
              <>
                <span className="font-mono text-sm tabular-nums">
                  {selected.ticker}
                </span>
                <span className="truncate text-sm text-foreground">
                  {selected.name}
                </span>
              </>
            ) : (
              <span className="text-sm">
                Wybierz instrument…
              </span>
            )}
          </span>
          <span className="flex items-center gap-2">
            {selected ? (
              <span className="font-mono text-xs text-muted-foreground">
                {selected.currency}
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder="Szukaj (np. Apple, BTC, XTB)" />
          <CommandList>
            <CommandEmpty>Brak wyników.</CommandEmpty>
            <CommandGroup>
              {instrumentOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  value={`${option.ticker} ${option.name}`}
                >
                  <Check
                    aria-hidden
                    className={cn(
                      "mr-2 size-4",
                      option.id === selected?.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="font-mono text-sm tabular-nums">
                      {option.ticker}
                    </span>
                    <span className="truncate">{option.name}</span>
                  </span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {option.currency}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
