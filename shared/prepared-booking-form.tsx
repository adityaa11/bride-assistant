"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./prepared-booking-form.module.css";
import { LiveAvailabilityCalendar } from "./live-availability-calendar";

type FormValue = { customerName: string; whatsapp: string; email: string; weddingDate: string;
  weddingStartTime: string; weddingLocation: string; note: string };
const initial: FormValue = { customerName: "", whatsapp: "", email: "", weddingDate: "",
  weddingStartTime: "", weddingLocation: "", note: "" };
const labels: { name: keyof FormValue; label: string; type?: string; required?: boolean; hint?: string }[] = [
  { name: "customerName", label: "Nama lengkap", required: true },
  { name: "whatsapp", label: "WhatsApp", type: "tel", required: true, hint: "Gunakan format internasional, misalnya +628123456789." },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "weddingStartTime", label: "Waktu mulai", type: "time", required: true },
  { name: "weddingLocation", label: "Lokasi wedding", required: true },
  { name: "note", label: "Catatan tambahan" },
];

export function PreparedBookingForm({ packageId }: { packageId: string }) {
  const [submissionKey, setSubmissionKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState(initial);
  const [state, setState] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage("Mengirim pengajuan…");
    try {
      const response = await fetch("/api/customer/bookings", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, note: form.note || null, packageId, submissionKey }) });
      const result = await response.json();
      if (!response.ok) {
        setState("error"); setMessage(result.error === "CONFLICT" ? "Kunci pengajuan ini sudah dipakai untuk data berbeda. Periksa data atau mulai pengajuan baru." :
          result.error === "INVALID_INPUT" ? "Periksa kembali nama, kontak, tanggal, waktu, dan lokasi." :
          result.error === "NOT_FOUND" ? "Paket ini tidak tersedia lagi. Pilih paket lain." : "Tanggal tidak tersedia atau pengajuan belum dapat diproses. Pilih tanggal lain atau coba lagi.");
        if (result.error === "CONFLICT") setAvailabilityRevision((value) => value + 1);
        return;
      }
      setBookingId(result.booking.id); setState("success");
      setMessage(`Booking ${result.booking.id} tersimpan dengan status Menunggu Konfirmasi.`);
    } catch {
      setState("error"); setMessage("Koneksi terputus. Coba lagi; pengajuan yang sama menggunakan kunci yang sama.");
    }
  }
  return <form className={styles.form} onSubmit={submit}>
    <h3>Lengkapi pengajuan booking</h3>
    <div><h4>Tanggal wedding</h4><LiveAvailabilityCalendar selected={form.weddingDate} onSelect={(weddingDate) => setForm((current) => ({ ...current, weddingDate }))} revision={availabilityRevision} />
      <p className={styles.hint}>Tanggal dipilih dari ketersediaan server. Pengajuan terakhir diperiksa lagi saat dikirim.</p></div>
    <div className={styles.grid}>{labels.map(({ name, label, type, required, hint }) => <label key={name}>
      <span>{label}</span><input name={name} type={type || "text"} value={form[name]} required={required} maxLength={name === "note" ? 2000 : undefined}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} disabled={state === "success"} />
      {hint && <small>{hint}</small>}
    </label>)}</div>
    <p className={styles.hint}>Harga dan promo dihitung ulang saat pengajuan disimpan. WhatsApp belum tersedia; booking tetap tersimpan.</p>
    {state === "success" ? <div className={styles.actions}><Link href="/booking-saya">Lihat Booking Saya →</Link><button type="button" onClick={() => {
      setSubmissionKey(crypto.randomUUID()); setForm(initial); setBookingId(""); setMessage(""); setState("idle");
    }}>Buat pengajuan lain</button></div> : <button className={styles.submit} type="submit" disabled={state === "loading" || !form.weddingDate}>{state === "loading" ? "Menyimpan…" : "Ajukan Booking"}</button>}
    {message && <p role={state === "error" ? "alert" : "status"} className={styles.message}>{message}{bookingId && <span className={styles.visuallyHidden}> Nomor booking tersimpan.</span>}</p>}
  </form>;
}
