"use client";
import { useEffect, useState } from "react";
import { BookingCalendar, calendarDate } from "./booking-calendar";
import styles from "./live-availability-calendar.module.css";

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
export function LiveAvailabilityCalendar({ selected, onSelect, revision = 0 }: {
  selected?: string; onSelect?: (date: string) => void; revision?: number;
}) {
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    const from = calendarDate(monthStart(month));
    const to = calendarDate(monthEnd(month));
    fetch(`/api/customer/availability?from=${from}&to=${to}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("AVAILABILITY_FAILED"); return response.json(); })
      .then((data: { dates: { date: string }[] }) => { setUnavailable(data.dates.map(({ date }) => date)); setState("ready"); })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [month, revision]);
  const blocked = new Set(unavailable);
  const past = (date: Date) => calendarDate(date) < calendarDate(new Date());
  return <div className={styles.wrap}>
    <div className={styles.toolbar}><button type="button" onClick={() => { setState("loading"); setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1)); }} aria-label="Bulan sebelumnya">‹</button>
      <strong>{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(month)}</strong>
      <button type="button" onClick={() => { setState("loading"); setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1)); }} aria-label="Bulan berikutnya">›</button></div>
    {state === "error" ? <p role="alert">Ketersediaan belum dapat dimuat. <button type="button" onClick={() => { setState("loading"); setMonth((value) => new Date(value)); }}>Coba lagi</button></p> :
      <><p role="status">{state === "loading" ? "Memuat ketersediaan tanggal…" : unavailable.length ? `${unavailable.length} tanggal tidak tersedia bulan ini.` : "Semua tanggal mendatang bulan ini tersedia."}</p>
      <BookingCalendar month={month} selected={selected} onSelect={(value) => onSelect?.(value)}
        disabled={(date) => state !== "ready" || past(date) || blocked.has(calendarDate(date)) || !onSelect}
        unavailable={(date) => blocked.has(calendarDate(date))}
        classes={{ root: styles.calendar, grid: styles.grid, weekday: styles.weekday, day: styles.day,
          selected: styles.selected, disabled: styles.disabled, unavailable: styles.unavailable }}
        ariaLabel="Kalender ketersediaan" labelDay={(date) => `${calendarDate(date)}, ${blocked.has(calendarDate(date)) ? "tidak tersedia" : "tersedia"}`}
        renderDay={(date) => <span>{date.getDate()}</span>} /></>}
  </div>;
}
