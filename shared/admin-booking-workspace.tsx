"use client";

import { useMemo, useState } from "react";
import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import type { CanonicalBookingStatus } from "@/shared/scenarios/contracts";
import styles from "./admin-booking-workspace.module.css";

const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const statusClass: Record<CanonicalBookingStatus, string> = { "Menunggu Konfirmasi": styles.requested, "Menunggu Pembayaran": styles.payment, "Booking Berhasil": styles.success, "Menunggu Pembatalan Booking": styles.hold, Dibatalkan: styles.cancelled, "Menunggu Reschedule Booking": styles.hold };
const formatDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export function AdminBookingWorkspace({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  const fixture = scenario.readModel.surface === "admin" ? scenario.readModel.adminBooking : undefined;
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(fixture?.records[0]?.id ?? null);
  const [notice, setNotice] = useState<string | null>(null);
  const records = useMemo(() => (fixture?.records ?? []).filter((record) => `${record.customer} ${record.packageName}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))), [fixture?.records, query]);
  const active = fixture?.records.find((record) => record.id === selected);
  if (scenario.readModel.surface !== "admin" || !fixture) return null;
  const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);
  const availability = fixture.mode === "availability";
  const respond = (label: string) => setNotice(`${label} tidak diterapkan. ${scenario.interaction.summary}`);

  return <div className={styles.page} data-scenario-id={scenario.scenarioId} data-scenario-version={scenario.version}>
    <a className="skip-link" href="#admin-workspace">Lewati ke workspace</a>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><b>✳</b><span><strong>bride.</strong><small>ASSISTANT PLANNER</small></span></div>
      <p>WORKSPACE</p><nav aria-label="Navigasi admin">{["Overview", "Bookings", "Services & Actions", "Master Packages", "Customers", "Availability"].map((item) => <a key={item} className={(availability ? item === "Availability" : item === "Bookings") ? styles.active : undefined} href={item === "Availability" ? "/admin/availability" : item === "Bookings" ? "/admin" : "#admin-workspace"}>{item}</a>)}</nav>
      <p>WEBSITE CONTENT</p><nav aria-label="Konten website">{["Portfolio & Testimonials", "Events", "Promotions"].map((item) => <a key={item} href="#admin-workspace">{item}</a>)}</nav>
      <div className={styles.studio}><b>B</b><span><strong>My Bridal Studio</strong><small>Independent Bride Assistant</small></span></div>
    </aside>
    <div className={styles.main} id="admin-workspace">
      <header className={styles.topbar}><span>Bride Assistant Planner / <b>{availability ? "Availability" : "Bookings"}</b></span><span>✦ Made for your bridal moments <b className={styles.avatar}>B</b></span></header>
      <section className={styles.title}><div><em>{availability ? "SCHEDULE / AVAILABILITY" : "SCHEDULE / BOOKINGS"}</em><h1>{scenario.readModel.title}</h1><p>{scenario.readModel.description}</p></div><button className={styles.button} onClick={() => respond(availability ? "Perubahan availability" : "Booking baru")}>{availability ? "Preview customer page" : "+ New Booking"}</button></section>
      {availability ? <Availability fixture={fixture} notice={notice} onAction={respond} /> : <Bookings records={records} active={active} view={view} query={query} notice={notice} onQuery={setQuery} onView={setView} onSelect={setSelected} onAction={respond} calendarDays={calendarDays} />}
      <footer className={styles.provenance}><strong>{scenario.provenance.label}</strong> · Scenario {scenario.scenarioId} · {scenario.state.message}</footer>
    </div>
  </div>;
}

function Bookings({ records, active, view, query, notice, onQuery, onView, onSelect, onAction, calendarDays }: Readonly<{ records: readonly { id: string; customer: string; packageName: string; date: string; start: string; end: string; location: string; status: CanonicalBookingStatus }[]; active?: { id: string; customer: string; packageName: string; date: string; start: string; end: string; location: string; status: CanonicalBookingStatus }; view: "calendar" | "list"; query: string; notice: string | null; onQuery: (value: string) => void; onView: (value: "calendar" | "list") => void; onSelect: (value: string) => void; onAction: (label: string) => void; calendarDays: readonly number[] }>) {
  return <><div className={styles.filters}><label>⌕<input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search customer / package" /></label><select aria-label="Filter status"><option>All status</option><option>Menunggu Konfirmasi</option><option>Booking Berhasil</option></select><div><button className={view === "calendar" ? styles.selected : undefined} onClick={() => onView("calendar")}>Calendar</button><button className={view === "list" ? styles.selected : undefined} onClick={() => onView("list")}>List</button></div></div>
    <div className={styles.workspace}>{view === "calendar" ? <section className={styles.card}><header><div><h2>November 2026</h2><span>Pilih tanggal untuk melihat daftar booking customer.</span></div><div><button onClick={() => onAction("Bulan sebelumnya")} aria-label="Bulan sebelumnya">‹</button><button onClick={() => onAction("Bulan selanjutnya")} aria-label="Bulan selanjutnya">›</button></div></header><div className={styles.calendar}>{weekdays.map((day) => <b key={day}>{day}</b>)}{calendarDays.map((day) => { const dayRecords = records.filter((record) => record.date === `2026-11-${String(day).padStart(2, "0")}`); return <button key={day} className={day === 12 ? styles.today : undefined} onClick={() => dayRecords[0] && onSelect(dayRecords[0].id)}><strong>{day}</strong>{dayRecords.map((record) => <i key={record.id} className={statusClass[record.status]} />)}</button>; })}</div><p className={styles.legend}>● Menunggu Konfirmasi　● Menunggu Pembayaran　● Booking Berhasil</p></section> : <section className={styles.card}><header><div><h2>All Bookings</h2><span>{records.length} reservasi sesuai filter.</span></div></header><div className={styles.tableWrap}><table><thead><tr><th>Tanggal</th><th>Customer / Paket</th><th>Jam</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} onClick={() => onSelect(record.id)}><td>{formatDate(record.date)}</td><td><strong>{record.customer}</strong><small>{record.packageName}</small></td><td>{record.start}–{record.end}</td><td><Status status={record.status} /></td></tr>)}</tbody></table></div>{records.length === 0 && <p className={styles.empty}>Tidak ada booking yang sesuai dengan filter.</p>}</section>}
      <aside className={styles.detail}><header><em>{active ? "CUSTOMER / BOOKING DETAIL" : "SELECTED DATE"}</em><h2>{active ? active.customer : "12 November 2026"}</h2><span>{active ? <Status status={active.status} /> : "Tidak ada booking"}</span></header>{active ? <div className={styles.detailBody}><dl><dt>Jadwal & lokasi</dt><dd>Tanggal <strong>{formatDate(active.date)}</strong></dd><dd>Waktu <strong>{active.start}–{active.end}</strong></dd><dd>Lokasi <strong>{active.location}</strong></dd></dl><dl><dt>Paket yang dipesan</dt><dd><strong>{active.packageName}</strong></dd><dd>Data customer hanya terlihat pada route fixture admin ini.</dd></dl><div className={styles.actions}><button onClick={() => onAction("Status booking")}>Tinjau status</button><button onClick={() => onAction("Detail booking")}>Tampilkan hasil fixture</button></div></div> : <p className={styles.empty}>Belum ada booking sesuai filter pada pilihan ini.</p>}</aside></div>{notice && <p className={styles.notice} role="status">{notice}</p>}</>;
}
function Availability({ fixture, notice, onAction }: Readonly<{ fixture: { blockedDates: readonly string[] }; notice: string | null; onAction: (label: string) => void }>) { return <><div className={styles.availability}><section className={styles.card}><h2>Working hours</h2><p>Jam operasional booking untuk semua hari yang tidak diblokir.</p><div className={styles.formRow}><label>Start time<input type="time" defaultValue="06:00" /></label><label>End time<input type="time" defaultValue="22:00" /></label></div><label>Buffer antar booking (menit)<select defaultValue="60"><option>60 menit</option></select></label><button className={styles.button} onClick={() => onAction("Pengaturan jam kerja")}>Save availability</button></section><section className={styles.card}><h2>Blocked dates</h2><p>Tanggal istirahat atau tanggal yang tidak dapat dipesan.</p><label>Block a date<input type="date" /></label><button onClick={() => onAction("Tanggal blokir")}>+ Block date</button><div className={styles.chips}>{fixture.blockedDates.map((date) => <span key={date}>{formatDate(date)} <button onClick={() => onAction("Penghapusan tanggal blokir")} aria-label={`Hapus ${formatDate(date)}`}>×</button></span>)}</div></section></div><p className={styles.hint}>Pada versi produksi, availability dicek secara transaksional di server. Fixture ini tidak mengubah jadwal atau ketersediaan.</p>{notice && <p className={styles.notice} role="status">{notice}</p>}</> }
function Status({ status }: Readonly<{ status: CanonicalBookingStatus }>) { return <span className={`${styles.status} ${statusClass[status]}`}>{status}</span>; }
