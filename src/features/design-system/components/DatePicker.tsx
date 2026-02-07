"use client";

import { format, isValid, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { Calendar } from "@/features/design-system/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/design-system/components/ui/popover";
import { cn } from "@/lib/cn";

type DatePickerProps = Readonly<{
  value: string;
  onChange: (nextValue: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}>;

const toDayStartTimestamp = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const parseDateValue = (value: string): Date | undefined => {
  if (!value) return undefined;

  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
};

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = "Wybierz datę",
  className,
}: DatePickerProps) {
  const selectedDate = parseDateValue(value);
  const minTimestamp = minDate ? toDayStartTimestamp(minDate) : null;
  const maxTimestamp = maxDate ? toDayStartTimestamp(maxDate) : null;

  const isDayDisabled = (day: Date) => {
    const dayTimestamp = toDayStartTimestamp(day);

    if (minTimestamp !== null && dayTimestamp < minTimestamp) {
      return true;
    }

    if (maxTimestamp !== null && dayTimestamp > maxTimestamp) {
      return true;
    }

    return false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            "h-11 w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
          variant="outline"
        >
          <CalendarIcon className="mr-2 size-4" aria-hidden />
          {selectedDate ? format(selectedDate, "dd.MM.yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1.5">
        <Calendar
          className="[--cell-size:2.4rem] p-2"
          disabled={isDayDisabled}
          initialFocus
          mode="single"
          onSelect={(nextDate) => {
            if (!nextDate) return;
            onChange(format(nextDate, "yyyy-MM-dd"));
          }}
          selected={selectedDate}
        />
      </PopoverContent>
    </Popover>
  );
}
