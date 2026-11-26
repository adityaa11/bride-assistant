"use client";
import { useEffect, useState } from "react";
import { AdminWorkspaceFrame } from "./admin-workspace-frame";
import { LiveAvailabilityCalendar } from "./live-availability-calendar";
import styles from "./admin-booking-live.module.css";
import availabilityStyles from "./admin-availability-live.module.css";

const today = () => new Date().toISOString().slice(0, 10);
const nextYear = () => { const date = new Date(); date.setUTCFullYear(date.getUTCFullYear() + 1); return date.toISOString().slice(0, 10); };
export function AdminAvailabilityLive() {
  const [date, setDate] = useState("");
  const [closed, setClosed] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/availability?from=${today()}&to=${nextYear()}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("READ_FAILED"); return response.json(); })
      .then((body: { dates: string[] }) => { setClosed(body.dates); setState("ready"); })
      .catch(() => { if (!controller.signal.aborted) setState("error"); });
    return () => controller.abort();
  }, [revision]);
  async function command(target: string, operation: "close" | "open") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: target, operation }) });
      if (!response.ok) { setMessage(response.status === 409 ? "Tanggal sudah dipakai atau ditutup. Muat ulang ketersediaan." : "Perubahan tanggal gagal disimpan."); return; }
      setMessage(operation === "close" ? "Tanggal ditutup." : "Tanggal dibuka."); setRevision((value) => value + 1);
    } catch { setMessage("Koneksi gagal. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <AdminWorkspaceFrame active="Availability" scenarioId="admin.availability-live" scenarioVersion="m3-t07"
    eyebrow="Schedule / Availability" title="Your availability" subtitle="Tutup atau buka tanggal. Keputusan tersimpan di server dan langsung berlaku untuk customer.">
    <div className={styles.grid}><section className={styles.panel}><header><h2>Kalender ketersediaan</h2><p>Tanggal yang ditutup atau sudah dipesan tidak dapat dipilih.</p></header>
      <div className={styles.detail}><LiveAvailabilityCalendar selected={date} onSelect={setDate} revision={revision} /></div></section>
      <section className={styles.panel}><header><h2>Tutup tanggal</h2><p>Penutupan tidak memerlukan booking.</p></header><div className={styles.detail}>
        <label className={availabilityStyles.dateField}>Pilih tanggal<input type="date" value={date} min={today()} onChange={(event) => setDate(event.target.value)} /></label>
        <button className={styles.primary} type="button" disabled={!date || busy} onClick={() => command(date, "close")}>Tutup tanggal</button>
        {message && <p role={message.includes("gagal") || message.includes("dipakai") ? "alert" : "status"} className={styles.message}>{message}</p>}
        <h3>Tanggal ditutup</h3>
        {state === "loading" ? <p role="status">Memuat tanggal ditutup…</p> : state === "error" ? <p role="alert">Tanggal ditutup belum dapat dimuat. <button className={availabilityStyles.retry} type="button" onClick={() => { setState("loading"); setRevision((value) => value + 1); }}>Coba lagi</button></p> :
          closed.length === 0 ? <p role="status">Belum ada tanggal ditutup.</p> : <ul className={availabilityStyles.closedList}>{closed.map((item) => <li key={item}><span>{item}</span><button type="button" disabled={busy} onClick={() => command(item, "open")}>Buka tanggal</button></li>)}</ul>}
      </div></section></div>
  </AdminWorkspaceFrame>;
}
