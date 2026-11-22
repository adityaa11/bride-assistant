"use client";

import { useState } from "react";
import { AdminIcon, AdminWorkspaceFrame } from "@/shared/admin-workspace-frame";
import type { CanonicalBookingStatus, ScenarioResult } from "@/shared/scenarios/contracts";
import styles from "./admin-customer-workspace.module.css";

type RecordItem = Readonly<{ id: string; customer: string; phone: string; packageName: string; date: string; start: string; end: string; location: string; status: CanonicalBookingStatus }>;
const dateText = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const statusStyle: Record<CanonicalBookingStatus, string> = {
  "Menunggu Konfirmasi": styles.requested, "Menunggu Pembayaran": styles.hold,
  "Booking Berhasil": styles.confirmed, "Menunggu Reschedule Booking": styles.hold,
  "Menunggu Pembatalan Booking": styles.hold, Dibatalkan: styles.cancelled,
};

export function AdminCustomerWorkspace({ scenario }: { scenario: ScenarioResult }) {
  const fixture = scenario.readModel.surface === "admin" ? scenario.readModel.adminCustomers : undefined;
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  if (!fixture) return null;

  const records: readonly RecordItem[] = fixture.records;
  const customers = [...new Set(records.map((record) => record.customer))].sort((a, b) => a.localeCompare(b, "id-ID"));
  const filtered = customers.filter((name) => name.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")));
  const active = selected && customers.includes(selected) ? selected : null;
  const history = active ? records.filter((record) => record.customer === active).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)) : [];
  const isError = scenario.state.kind === "error";

  return <AdminWorkspaceFrame
    active="Customers"
    scenarioId={scenario.scenarioId}
    scenarioVersion={scenario.version}
    eyebrow={active ? "Customers / Customer details" : "People / Customers"}
    title={active ?? "Your brides"}
    subtitle={active ? "Customer information and their booking history." : "A simple directory of customers who have made a booking."}
    action={active
      ? <button className={styles.btn} type="button" onClick={() => setSelected(null)}><AdminIcon name="arrow-left" />Back to Customers</button>
      : <a className={`${styles.btn} ${styles.primary}`} href="/admin"><AdminIcon name="plus" />Add via Booking</a>}
  >
    {active ? <section className={`${styles.card} ${styles.cardPad}`} aria-label="Booking history">
      <div className={styles.sectionRow}><h2>Booking history</h2><span className={styles.tiny}>{history.length} booking</span></div>
      <div className={styles.history}>{history.map((record) => <a className={styles.bookingItem} href={`/admin/bookings/detail?booking=${encodeURIComponent(record.id)}`} key={record.id}>
        <span className={styles.itemRow}><strong>{dateText(record.date)} · {record.packageName}</strong><span className={`${styles.status} ${statusStyle[record.status]}`}>{record.status}</span></span>
        <span className={styles.itemMeta}>{record.start}–{record.end} · {record.location}</span>
      </a>)}</div>
    </section> : <>
      {customers.length > 0 && <label className={styles.fieldSearch}><AdminIcon name="search" /><span className={styles.visuallyHidden}>Search customer name</span><input type="search" placeholder="Search customer name..." autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} /></label>}
      {filtered.length > 0 && <div className={styles.customerGrid}>{filtered.map((name) => {
        const bookings = records.filter((record) => record.customer === name);
        return <button className={styles.customerCard} type="button" key={name} onClick={() => setSelected(name)}>
          <span className={styles.customerInitial} aria-hidden="true">{name[0]}</span>
          <span className={styles.customerText}><strong>{name}</strong><small>{bookings.length} booking{bookings.length === 1 ? "" : "s"} · {bookings[0].phone}</small></span>
          <AdminIcon name="chevron-right" />
        </button>;
      })}</div>}
      {filtered.length === 0 && <div className={styles.empty} role={isError ? "alert" : "status"}>{isError ? scenario.state.message : customers.length === 0 ? scenario.state.message : "Tidak ada customer yang sesuai dengan filter."}</div>}
      <div className={styles.hintbox}>Untuk MVP, customer dapat dibuat langsung ketika BA menambahkan booking. Daftar customer ini dibentuk dari data booking.</div>
    </>}
  </AdminWorkspaceFrame>;
}
