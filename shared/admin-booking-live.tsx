"use client";

import { useState } from "react";
import { AdminWorkspaceFrame } from "./admin-workspace-frame";
import styles from "./admin-booking-live.module.css";

type Booking = { id: string; status: string; wedding_date: string; wedding_start_time: string;
  wedding_location: string; final_price: string; created_at: string;
  submission_snapshot: { customerName: string; whatsapp: string; email: string; note: string | null;
    weddingDate: string; weddingStartTime: string; weddingLocation: string };
  package_snapshot: { name: string; description: string; durationMinutes: number; basePrice: string;
    items: { id: string; name: string }[] };
  promotion_snapshot: { title: string } | null };
type Event = { id: string; actor_id: string; from_status: string | null; to_status: string; occurred_at: string };
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(value));
const nextStatus = (status: string) => status === "Menunggu Konfirmasi" ? "Menunggu Pembayaran" : status === "Menunggu Pembayaran" ? "Booking Berhasil" : null;

export function AdminBookingLive({ initial, unavailable = false, error = null }: { initial: Booking[]; unavailable?: boolean; error?: string | null }) {
  const [records, setRecords] = useState(initial);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [history, setHistory] = useState<Event[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [paymentReviewed, setPaymentReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [detailError, setDetailError] = useState(false);
  const visible = records.filter((record) => (filter === "all" || record.status === filter) &&
    `${record.submission_snapshot.customerName} ${record.id}`.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID")));
  async function choose(record: Booking) {
    setSelected(record); setHistory([]); setDetailError(false); setMessage(null); setPaymentReviewed(false); setBusy(true);
    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(record.id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("READ_FAILED");
      const body = await response.json();
      setSelected(body.result.booking); setHistory(body.result.history);
    } catch { setDetailError(true); } finally { setBusy(false); }
  }
  async function decide(record: Booking) {
    const targetStatus = nextStatus(record.status);
    if (!targetStatus || targetStatus === "Booking Berhasil") return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(record.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedStatus: record.status, targetStatus, paymentReviewed }),
      });
      if (!response.ok) { await choose(record); setMessage(response.status === 409 ? "Status berubah. Muat ulang detail sebelum memutuskan." : "Keputusan belum tersimpan. Coba lagi."); return; }
      const body = await response.json();
      const updated = { ...record, status: body.result.booking.status };
      setRecords((current) => current.map((item) => item.id === record.id ? updated : item));
      setSelected(updated); setHistory((current) => [...current, body.result.event]);
      setMessage("Keputusan tersimpan dan dicatat di riwayat booking.");
    } catch { setMessage("Koneksi gagal. Muat ulang detail sebelum mencoba lagi."); }
    finally { setBusy(false); }
  }
  return <AdminWorkspaceFrame active="Bookings" scenarioId="admin.booking-live" scenarioVersion="m3-t06"
    eyebrow="Your bridal workspace / Bookings" title="Bookings"
    subtitle="Tinjau pengajuan dari customer dan catat keputusan pada booking yang sama.">
    <div className={styles.filters}>
      <label>Cari customer atau ID<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama customer atau ID booking" /></label>
      <label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option>Menunggu Konfirmasi</option><option>Menunggu Pembayaran</option><option>Booking Berhasil</option></select></label>
    </div>
    {unavailable ? <section className={styles.state} role="status"><h2>Booking admin belum aktif.</h2><p>Daftar dan keputusan booking akan tersedia setelah pemeriksaan tanggal diaktifkan.</p></section> :
      error ? <section className={styles.state} role="alert"><h2>Booking belum dapat dimuat.</h2><p>Coba muat ulang halaman.</p></section> :
      <div className={styles.grid}><section className={styles.panel} aria-label="Antrean booking"><header><h2>Antrean Booking</h2><p>{visible.length} pengajuan sesuai filter</p></header>
        {visible.length ? <ul className={styles.list}>{visible.map((record) => <li key={record.id}><button type="button" aria-pressed={selected?.id === record.id} onClick={() => choose(record)}>
          <strong>{record.submission_snapshot.customerName}</strong><span className={styles.status}>{record.status}</span>
          <small>{record.package_snapshot.name} · {date(record.wedding_date)} · {record.wedding_location}</small><small className={styles.id}>{record.id}</small>
        </button></li>)}</ul> : <div className={styles.empty} role="status">Belum ada booking sesuai filter. Pengajuan customer pertama akan muncul di sini.</div>}
      </section><aside className={styles.panel} aria-label="Detail booking"><header><h2>Detail Booking</h2><p>Pengajuan, paket, dan riwayat keputusan</p></header>
        {!selected ? <div className={styles.empty}>Pilih booking untuk melihat detail dan mengambil keputusan.</div> : <div className={styles.detail}>
          {busy && <p role="status">Memuat detail booking…</p>}{detailError && <p role="alert">Detail gagal dimuat. Pilih booking lagi untuk mencoba.</p>}
          <div className={styles.heading}><h3>{selected.submission_snapshot.customerName}</h3><span className={styles.status}>{selected.status}</span></div>
          <p className={styles.id}>No. Booking: {selected.id}</p>
          <h4>Detail Acara</h4><dl><div><dt>Tanggal Wedding</dt><dd>{date(selected.wedding_date)}</dd></div><div><dt>Waktu Mulai</dt><dd>{selected.wedding_start_time.slice(0, 5)}</dd></div><div><dt>Lokasi Wedding</dt><dd>{selected.wedding_location}</dd></div></dl>
          <h4>Paket Pendampingan</h4><p>{selected.package_snapshot.name} · {selected.package_snapshot.durationMinutes} menit</p><p>{selected.package_snapshot.description}</p><ul>{selected.package_snapshot.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          <p>Harga dasar {currency.format(Number(selected.package_snapshot.basePrice))} · Harga akhir {currency.format(Number(selected.final_price))}</p>{selected.promotion_snapshot && <p>Promo saat pengajuan: {selected.promotion_snapshot.title}</p>}
          <h4>Kontak Customer</h4><dl><div><dt>WhatsApp</dt><dd>{selected.submission_snapshot.whatsapp}</dd></div><div><dt>Email</dt><dd>{selected.submission_snapshot.email}</dd></div></dl>
          <h4>Catatan</h4><p>{selected.submission_snapshot.note || "Tidak ada catatan."}</p>
          <h4>Riwayat Status</h4>{history.length ? <ol>{history.map((event) => <li key={event.id}>{event.to_status} · {date(event.occurred_at)} · Aktor {event.actor_id}</li>)}</ol> : <p>Memuat riwayat atau belum ada peristiwa.</p>}
          {nextStatus(selected.status) === "Menunggu Pembayaran" && <button className={styles.primary} type="button" onClick={() => decide(selected)} disabled={busy || detailError}>Pindah ke Menunggu Pembayaran</button>}
          {nextStatus(selected.status) === "Booking Berhasil" && <div className={styles.pending}><label><input type="checkbox" checked={paymentReviewed} onChange={(event) => setPaymentReviewed(event.target.checked)} /> Saya sudah memeriksa dan menyetujui bukti pembayaran melalui kanal manual.</label><p>Keputusan Booking Berhasil menunggu pemeriksaan benturan tanggal sebelum dapat disimpan.</p><button type="button" disabled aria-disabled="true">Booking Berhasil belum aktif</button></div>}
          {message && <p role="status" className={styles.message}>{message}</p>}
        </div>}
      </aside></div>}
  </AdminWorkspaceFrame>;
}
