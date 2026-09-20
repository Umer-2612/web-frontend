"use client";

import { format } from "date-fns";
import { CalendarIcon, ClockIcon } from "lucide-react";
import type { DayButton } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type TimeSlot = [number, number];

const TIME_GROUPS: Array<{ label: string; slots: TimeSlot[] }> = [
  {
    label: "Morning",
    slots: [
      [8, 0],
      [8, 30],
      [9, 0],
      [9, 30],
      [10, 0],
      [10, 30],
      [11, 0],
      [11, 30],
    ],
  },
  {
    label: "Afternoon",
    slots: [
      [12, 0],
      [12, 30],
      [13, 0],
      [13, 30],
      [14, 0],
      [14, 30],
      [15, 0],
      [15, 30],
      [16, 0],
      [16, 30],
    ],
  },
  {
    label: "Evening",
    slots: [
      [17, 0],
      [17, 30],
      [18, 0],
      [18, 30],
      [19, 0],
      [19, 30],
      [20, 0],
      [20, 30],
    ],
  },
];

const ALL_SLOTS = TIME_GROUPS.flatMap((group) => group.slots);
const LAST_SLOT = ALL_SLOTS[ALL_SLOTS.length - 1] ?? [20, 30];

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  placeholder?: string;
  className?: string;
}

function withTime(day: Date, hour: number, minute: number) {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function formatTime(hour: number, minute: number) {
  return format(withTime(new Date(), hour, minute), "h:mm a");
}

function isSameSlot(value: Date | undefined, hour: number, minute: number) {
  return value?.getHours() === hour && value.getMinutes() === minute;
}

function getFirstAvailableSlot(day: Date, minDate?: Date) {
  return ALL_SLOTS.find(([hour, minute]) => {
    const candidate = withTime(day, hour, minute);
    return !minDate || candidate >= minDate;
  });
}

export function DateTimePicker({ value, onChange, minDate, placeholder = "Pick a date and time", className }: DateTimePickerProps) {
  const selectedHour = value ? value.getHours() : undefined;
  const selectedMinute = value ? value.getMinutes() : undefined;
  const selectedDateLabel = value ? format(value, "EEEE, MMM d") : placeholder;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
      return;
    }

    const currentSlot =
      selectedHour !== undefined && selectedMinute !== undefined ? ([selectedHour, selectedMinute] as const) : undefined;
    const currentDate = currentSlot ? withTime(day, currentSlot[0], currentSlot[1]) : undefined;
    const nextSlot = currentDate && (!minDate || currentDate >= minDate) ? currentSlot : getFirstAvailableSlot(day, minDate);

    onChange(nextSlot ? withTime(day, nextSlot[0], nextSlot[1]) : undefined);
  };

  const isDateDisabled = (day: Date) => {
    if (!minDate) return false;
    const lastAvailable = withTime(day, LAST_SLOT[0], LAST_SLOT[1]);
    return lastAvailable < minDate;
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const day = value ?? minDate ?? new Date();
    onChange(withTime(day, hour, minute));
  };

  return (
    <div className={cn("grid gap-4 sm:grid-cols-[280px_1fr] sm:items-stretch", className)}>
      <div className="bg-background flex rounded-xl border p-3 sm:h-[380px]">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDaySelect}
          disabled={isDateDisabled}
          captionLayout="label"
          className="w-full self-start [--cell-size:--spacing(9)]"
          classNames={{
            root: "w-full",
            month: "w-full",
            month_grid: "w-full",
          }}
          components={{
            DayButton: (props: React.ComponentProps<typeof DayButton>) => <CalendarDayButton {...props} />,
          }}
        />
      </div>

      <div className="bg-background flex flex-col gap-3 rounded-xl border p-4 sm:h-[380px]">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarIcon className="text-muted-foreground size-4" />
            <span>{selectedDateLabel}</span>
          </div>
          {value && (
            <div className="text-primary flex items-center gap-1.5 text-sm font-semibold">
              <ClockIcon className="size-4" />
              {format(value, "h:mm a")}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {TIME_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium">{group.label}</p>
              <div className="grid grid-cols-3 gap-2">
                {group.slots.map(([hour, minute]) => {
                  const disabled = !!minDate && withTime(value ?? minDate, hour, minute) < minDate;

                  return (
                    <Button
                      key={`${hour}:${minute}`}
                      type="button"
                      variant={isSameSlot(value, hour, minute) ? "default" : "outline"}
                      size="sm"
                      disabled={disabled}
                      onClick={() => handleTimeSelect(hour, minute)}
                      className="h-9"
                    >
                      {formatTime(hour, minute)}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
