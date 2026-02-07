"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/cn";

type DatePickerProps = Readonly<{
  value: string | null | undefined;
  onChange: (next: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  displayLocale?: string;
  className?: string;
  popoverClassName?: string;
}>;

const DEFAULT_PLACEHOLDER = "Wybierz datę";

const isValidDate = (value: Date | undefined): value is Date => {
  if (!value) {
    return false;
  }

  return !Number.isNaN(value.getTime());
};

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = DEFAULT_PLACEHOLDER,
  displayLocale = "pl-PL",
  className,
  popoverClassName,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;
  const hasSelectedDate = isValidDate(selectedDate);
  const resolvedMaxDate = maxDate ?? new Date();
  const resolvedMinDate =
    minDate ?? new Date(resolvedMaxDate.getFullYear() - 5, 0, 1);
  const startMonth = new Date(
    resolvedMinDate.getFullYear(),
    resolvedMinDate.getMonth(),
    1
  );
  const endMonth = new Date(
    resolvedMaxDate.getFullYear(),
    resolvedMaxDate.getMonth(),
    1
  );

  const formattedDate = hasSelectedDate
    ? new Intl.DateTimeFormat(displayLocale, { dateStyle: "long" }).format(
        selectedDate
      )
    : placeholder;

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-12 w-full justify-between px-3 text-left font-medium",
            !hasSelectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          variant="outline"
        >
          <span className="truncate tabular-nums">{formattedDate}</span>
          <CalendarIcon className="size-4 shrink-0 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-auto p-0", popoverClassName)}
        side="bottom"
        sideOffset={8}
      >
        <Calendar
          captionLayout="dropdown"
          className="[--cell-size:2.65rem] sm:[--cell-size:2.8rem]"
          disabled={{
            before: resolvedMinDate,
            after: resolvedMaxDate,
          }}
          endMonth={endMonth}
          fixedWeeks
          mode="single"
          onSelect={(next) => {
            if (!next) return;
            onChange(format(next, "yyyy-MM-dd"));
            setOpen(false);
          }}
          selected={hasSelectedDate ? selectedDate : undefined}
          showOutsideDays={false}
          startMonth={startMonth}
        />
      </PopoverContent>
    </Popover>
  );
}
