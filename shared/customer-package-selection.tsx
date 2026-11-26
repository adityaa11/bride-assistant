import Link from "next/link";
import { CustomerFrame } from "./customer-home";
import type { PublicPackageDetail } from "./server/public-package-read";
import styles from "./customer-package-selection.module.css";
import { PreparedBookingForm } from "./prepared-booking-form";

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function CustomerPackageSelection({ packages, selectedId, error = false, prepared = false }: {
  packages: readonly PublicPackageDetail[]; selectedId?: string; error?: boolean; prepared?: boolean;
}) {
  const selected = packages.find((pkg) => pkg.id === selectedId);
  return <CustomerFrame active="Booking Baru"><main id="main" className={styles.main}>
    <header className={styles.heading}><p>YOUR BRIDAL JOURNEY / 01</p><h1>Pilih pendampingan <em>untuk harimu.</em></h1><span>Kenali layanan dan pilih paket yang sesuai. Harga dasar dan promo ditampilkan terpisah.</span></header>
    {error ? <p role="alert" className={styles.notice}>Paket belum dapat dimuat. Coba muat ulang halaman.</p> : packages.length === 0 ? <p role="status" className={styles.notice}>Belum ada paket yang dipublikasikan. Booking belum dapat dimulai.</p> : <div className={styles.grid}>{packages.map((pkg) => <article className={pkg.id === selected?.id ? styles.selected : styles.card} key={pkg.id}>
      <p className={styles.kicker}>BRIDAL CARE · {pkg.durationMinutes} MENIT</p><h2>{pkg.name}</h2><p>{pkg.description}</p>
      <strong className={styles.price}>Harga dasar {rupiah.format(pkg.basePrice)}</strong>
      <ul>{pkg.items.map((item) => <li key={item.id}>{item.name} · {item.type === "service" ? "Service" : "Action"}</li>)}</ul>
      {pkg.offer && <aside className={styles.offer}><b>{pkg.offer.title}</b><span>{pkg.offer.type === "percentage" ? `${pkg.offer.value}%` : rupiah.format(pkg.offer.value)} diskon · {pkg.offer.startsOn}–{pkg.offer.endsOn}</span><span>{pkg.offer.description}</span></aside>}
      <Link aria-current={pkg.id === selected?.id ? "true" : undefined} href={`/booking?packageId=${encodeURIComponent(pkg.id)}`}>{pkg.id === selected?.id ? "Paket dipilih" : "Pilih paket"} <span aria-hidden="true">↗</span></Link>
    </article>)}</div>}
    {selected && <section aria-live="polite" className={styles.handoff}><p>PAKET PILIHAN</p><h2>{selected.name}</h2><span>Pilihan ini menyimpan ID paket saja. Harga, isi paket, dan promo diperiksa ulang oleh server saat pengajuan booking.</span>{prepared ? <PreparedBookingForm key={selected.id} packageId={selected.id} /> : <p role="status">Pengajuan booking akan tersedia setelah pemeriksaan ketersediaan tanggal diaktifkan.</p>}</section>}
  </main></CustomerFrame>;
}
