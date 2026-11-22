"use client";

import { DayPicker, type DayButtonProps, type Matcher } from "react-day-picker";
import { id } from "react-day-picker/locale";
import { createContext, useContext, type ReactNode } from "react";
import styles from "./booking-calendar.module.css";

const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function calendarDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type CalendarClasses = {
  root: string;
  grid: string;
  weekday: string;
  day: string;
  selected: string;
  disabled?: string;
  unavailable?: string;
};

const DayContent = createContext<{
  className: string;
  render: (date: Date, selected: boolean) => ReactNode;
} | null>(null);

function CalendarDayButton({ day, modifiers, children, ...buttonProps }: DayButtonProps) {
  const content = useContext(DayContent);
  if (!content) throw new Error("CalendarDayButton requires BookingCalendar");
  return <button {...buttonProps} className={content.className}>{content.render(day.date, modifiers.selected) ?? children}</button>;
}

export function BookingCalendar({
  month,
  selected,
  onSelect,
  disabled,
  unavailable,
  classes,
  ariaLabel,
  labelDay,
  renderDay,
}: {
  month: Date;
  selected?: string;
  onSelect: (date: string) => void;
  disabled?: Matcher | Matcher[];
  unavailable?: Matcher | Matcher[];
  classes: CalendarClasses;
  ariaLabel: string;
  labelDay: (date: Date) => string;
  renderDay: (date: Date, selected: boolean) => ReactNode;
}) {
  return (
    <DayContent.Provider value={{ className: classes.day, render: renderDay }}><DayPicker
      aria-label={ariaLabel}
      className={`${styles.root} ${classes.root}`}
      classNames={{
        month_grid: `${styles.grid} ${classes.grid}`,
        weekday: classes.weekday,
        selected: classes.selected,
        disabled: classes.disabled,
      }}
      components={{ DayButton: CalendarDayButton }}
      disabled={disabled}
      formatters={{ formatWeekdayName: (date) => weekdays[date.getDay()] }}
      hideNavigation
      labels={{ labelDayButton: labelDay }}
      lang="id"
      locale={id}
      mode="single"
      modifiers={unavailable ? { unavailable } : undefined}
      modifiersClassNames={unavailable && classes.unavailable ? { unavailable: classes.unavailable } : undefined}
      month={month}
      onSelect={(date) => { if (date) onSelect(calendarDate(date)); }}
      required
      selected={selected ? parseCalendarDate(selected) : undefined}
      showOutsideDays={false}
      weekStartsOn={1}
    /></DayContent.Provider>
  );
}
