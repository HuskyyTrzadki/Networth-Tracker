"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { Calendar } from "@/features/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";

type Props = Readonly<{
  value: string;
  onChange: (next: string) => void;
}>;

export function TransactionDatePicker({ value, onChange }: Props) {
  const selectedDate = parseISO(value);
  const formatted = Number.isNaN(selectedDate.getTime())
    ? "Wybierz datę"
    : new Intl.DateTimeFormat("pl-PL", { dateStyle: "long" }).format(
        selectedDate
      );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-11 w-full justify-between px-3 text-left font-normal",
            Number.isNaN(selectedDate.getTime()) && "text-muted-foreground"
          )}
          variant="outline"
        >
          <span className="truncate">{formatted}</span>
          <CalendarIcon className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          disabled={{ after: new Date() }}
          mode="single"
          onSelect={(next) => {
            if (!next) return;
            onChange(format(next, "yyyy-MM-dd"));
          }}
          selected={Number.isNaN(selectedDate.getTime()) ? undefined : selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
