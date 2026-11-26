"use client";

import Link from "next/link";
import { useState } from "react";
import { CustomerFrame } from "./customer-home";
import styles from "./customer-booking-records.module.css";

type OwnBooking = { id: string; status: string; wedding_date: string; wedding_location: string;
  wedding_start_time: string; final_price: string; submission_snapshot: { customerName: string;
  whatsapp: string; email: string; note: string | null }; package_snapshot: { name: string;
  description: string; durationMinutes: number; basePrice: string; items: { id: string; name: string }[] };
  promotion_snapshot: { title: string } | null };
type History = { id: string; to_status: string; occurred_at: string };
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(value));

export function CustomerBookingRecords({ records, initialHistory = [], unavailable = false, error = false, loading = false }: {
  records: OwnBooking[]; initialHistory?: History[]; unavailable?: boolean; error?: boolean; loading?: boolean;
}) {
  const [selected, setSelected] = useState<OwnBooking | null>(records[0] ?? null);
  const [history, setHistory] = useState<History[]>(initialHistory);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "error">("idle");
  async function choose(record: OwnBooking) {
    setSelected(record); setDetailState("loading"); setHistory([]);
    try {
      const response = await fetch(`/api/customer/bookings/${encodeURIComponent(record.id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("DETAIL_FAILED");
      const result = await response.json();
      setSelected(result.booking.booking); setHistory(result.booking.history); setDetailState("idle");
    } catch { setDetailState("error"); }
  }
  return <CustomerFrame active="Booking Saya"><section className={styles.intro}><div className={styles.wrap}>
    <p className={styles.eyebrow}>YOUR BRIDAL JOURNEY</p><h1>Booking <em>Saya.</em></h1>
    <p>Semua rencana pendampinganmu dalam satu tempat. Lihat detail acara, paket yang dipilih, dan perkembangan konfirmasi booking.</p>
    <Link className={styles.primary} href="/booking">+ Buat Booking Baru</Link>
  </div></section><main id="main" className={`${styles.wrap} ${styles.main}`}>
    {loading ? <State title="Menyiapkan booking, dear." copy="Data booking sedang dimuat." /> :
      unavailable ? <State title="Booking Saya belum tersedia." copy="Riwayat booking akan tersedia setelah pemeriksaan ketersediaan tanggal diaktifkan." /> :
      error ? <State title="Booking belum dapat ditampilkan." copy="Coba muat ulang halaman." alert /> :
      records.length === 0 ? <State title="Belum ada booking, dear." copy="Ketika kamu mengajukan pendampingan, seluruh informasi dan statusnya akan muncul di halaman ini." /> : <>
        <section aria-label="Ringkasan booking" className={styles.overview}><Summary label="Total Booking" value={records.length} /><Summary label="Menunggu Konfirmasi" value={records.filter((row) => row.status === "Menunggu Konfirmasi").length} /><Summary label="Dikonfirmasi" value={records.filter((row) => row.status === "Booking Berhasil").length} /></section>
        <div className={styles.workspace}><section aria-label="Daftar booking" className={styles.list}><p className={styles.eyebrow}>YOUR RESERVATIONS</p><h2>Daftar Booking</h2><p>Pilih salah satu booking untuk melihat detail lengkap.</p>
          {records.map((record) => <button type="button" key={record.id} aria-pressed={selected?.id === record.id} onClick={() => choose(record)}>
            <span className={styles.reference}>{record.id}</span><strong>{record.package_snapshot.name}</strong><span>{record.status}</span><small>{date(record.wedding_date)} · {record.wedding_location}</small>
          </button>)}
        </section>{selected && <section aria-label="Detail booking" className={styles.detail}>
          <p className={styles.eyebrow}>BOOKING DETAILS · RANUR BRIDAL CARE</p><h2>{selected.package_snapshot.name}</h2><p className={styles.status}>{selected.status}</p><p className={styles.reference}>No. Booking: {selected.id}</p>
          <h3>Detail Acara</h3><dl><div><dt>Tanggal Wedding</dt><dd>{date(selected.wedding_date)}</dd></div><div><dt>Waktu Mulai</dt><dd>{selected.wedding_start_time.slice(0, 5)}</dd></div><div><dt>Lokasi Wedding</dt><dd>{selected.wedding_location}</dd></div></dl>
          <h3>Paket Pendampingan</h3><p>{selected.package_snapshot.description}</p><p>{selected.package_snapshot.durationMinutes} menit · Harga dasar {rupiah.format(Number(selected.package_snapshot.basePrice))}</p>
          <ul>{selected.package_snapshot.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
          {selected.promotion_snapshot && <p>Promo saat pengajuan: {selected.promotion_snapshot.title}</p>}
          <strong>Harga akhir {rupiah.format(Number(selected.final_price))}</strong>
          <h3>Informasi Customer</h3><dl><div><dt>Nama Lengkap</dt><dd>{selected.submission_snapshot.customerName}</dd></div><div><dt>WhatsApp</dt><dd>{selected.submission_snapshot.whatsapp}</dd></div><div><dt>Email</dt><dd>{selected.submission_snapshot.email}</dd></div></dl>
          <h3>Catatan Tambahan</h3><p>{selected.submission_snapshot.note || "Tidak ada catatan."}</p>
          <h3>Perkembangan Booking</h3>{detailState === "loading" ? <p role="status">Memuat riwayat…</p> : detailState === "error" ? <p role="alert">Riwayat belum dapat dimuat. Pilih booking lagi untuk mencoba.</p> : history.length ? <ol>{history.map((event) => <li key={event.id}>{event.to_status} · {date(event.occurred_at)}</li>)}</ol> : <p>Pilih booking untuk memuat riwayat.</p>}
          <p className={styles.hint}>Detail paket dan harga adalah salinan saat pengajuan. WhatsApp belum tersedia; booking tetap tersimpan.</p>
        </section>}</div></>}
  </main></CustomerFrame>;
}
function Summary({ label, value }: { label: string; value: number }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function State({ title, copy, alert = false }: { title: string; copy: string; alert?: boolean }) { return <section role={alert ? "alert" : "status"} className={styles.state}><h2>{title}</h2><p>{copy}</p><Link className={styles.primary} href="/booking">Pilih Paket &amp; Booking</Link></section>; }
