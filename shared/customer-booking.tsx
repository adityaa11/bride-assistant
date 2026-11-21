"use client";

import { CustomerFrame } from "@/shared/customer-home";
import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import Link from "next/link";
import { useState } from "react";
import styles from "./customer-booking.module.css";

const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function CustomerBooking({
  scenarioId,
}: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  const request =
    scenario.readModel.surface === "customer"
      ? scenario.readModel.bookingRequest
      : undefined;
  const [selectedDate, setSelectedDate] = useState(request?.selectedDate);
  const [visibleMonth, setVisibleMonth] = useState<"november" | "december">(request?.selectedDate ? "december" : "november");
  const [submitted, setSubmitted] = useState(
    scenarioId === "customer.booking-request-result",
  );
  if (scenario.readModel.surface !== "customer") return null;
  const packages = request?.packages ?? [];
  const unavailable = new Set(
    scenario.readModel.availability
      .filter((item) => item.state === "unavailable")
      .map((item) => item.date),
  );
  const selectedPackage = packages[0];
  const invalid = scenarioId === "customer.booking-request-invalid";
  const noPackage = scenarioId === "customer.booking-request-no-package";
  const unavailableState =
    scenarioId === "customer.booking-request-unavailable";
  const dateLabel =
    selectedDate === "2026-12-12"
      ? "12 Desember 2026"
      : selectedDate === "2026-12-13"
        ? "13 Desember 2026"
        : "Belum ada tanggal dipilih";
  const showingDecember = visibleMonth === "december";
  const calendarMonth = showingDecember ? "Desember 2026" : "November 2026";
  const calendarPrefix = showingDecember ? "2026-12" : "2026-11";
  const calendarDays = showingDecember ? 31 : 30;
  const leadingBlanks = showingDecember ? 1 : 6;
  return (
    <CustomerFrame active="Booking Baru" scenarioId={scenarioId}>
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.breadcrumb}>
            <Link href="/beranda">Beranda</Link> / Booking Baru
          </div>
          <div className={styles.eyebrow}>LET&apos;S PLAN YOUR BEAUTIFUL DAY</div>
          <h1>
            Find your perfect date,
            <br />
            <em>we&apos;ll take care of the rest.</em>
          </h1>
          <p>
            Pilih paket dan tanggal yang kamu inginkan, lalu lengkapi detail
            acara. Tim Ranur akan meninjau pengajuanmu dan mengonfirmasi
            ketersediaan pendamping.
          </p>
          <div className={styles.steps}>
            {[
              ["01", "Pilih Paket"],
              ["02", "Pilih Tanggal"],
              ["03", "Lengkapi Detail"],
            ].map(([number, label]) => (
              <span className={styles.step} key={number}>
                <b>{number}</b>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>
      <main className={styles.wrap} id="main">
        {!submitted ? (
          <div className={styles.grid}>
            <section
              aria-labelledby="calendarTitle"
              className={`${styles.card} ${styles.calendarCard}`}
            >
              <header className={styles.calendarTop}>
                <div>
                  <div className={styles.eyebrow}>WEDDING CALENDAR</div>
                  <h2 id="calendarTitle">{calendarMonth}</h2>
                  <p>Pilih tanggal untuk pengajuan booking.</p>
                </div>
                <div className={styles.calendarActions}>
                    <button aria-label="Bulan sebelumnya" disabled={!showingDecember} onClick={() => setVisibleMonth("november")} type="button">
                    ‹
                  </button>
                    <button aria-label="Bulan berikutnya" disabled={showingDecember} onClick={() => setVisibleMonth("december")} type="button">
                    ›
                  </button>
                </div>
              </header>
              <div aria-hidden="true" className={styles.weekdays}>
                {weekdays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div
                aria-label="Pilih tanggal pernikahan"
                className={styles.calendar}
                role="group"
              >
                {Array.from({ length: leadingBlanks }, (_, index) => <span aria-hidden="true" className={styles.blank} key={`blank-${index}`} />)}
                {Array.from({ length: calendarDays }, (_, index) => index + 1).map(
                  (day) => {
                    const date = `${calendarPrefix}-${String(day).padStart(2, "0")}`;
                    const blocked = unavailable.has(date);
                    const selected = selectedDate === date;
                    const past = !showingDecember && day < 21;
                    return (
                      <button
                        aria-label={`${day} Desember 2026${blocked ? ", tidak tersedia" : ""}`}
                        aria-pressed={selected || undefined}
                        className={`${styles.day} ${selected ? styles.selected : ""} ${blocked ? styles.unavailable : ""}`}
                      disabled={blocked || past}
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        type="button"
                      >
                        <span>{day}</span>
                        <small>
                          {blocked ? "Penuh" : selected ? "Dipilih" : ""}
                        </small>
                      </button>
                    );
                  },
                )}
              </div>
              <div className={styles.legend}>
                <span>
                  <i />
                  Dapat diajukan
                </span>
                <span>
                  <i className={styles.legendSelected} />
                  Dipilih
                </span>
                <span>
                  <i className={styles.legendUnavailable} />
                  Tidak tersedia
                </span>
              </div>
              <p className={styles.note}>
                Tanggal yang dapat dipilih belum merupakan jaminan ketersediaan.
                Konfirmasi final dilakukan oleh tim Ranur setelah permintaan
                masuk.
              </p>
            </section>
            <section
              aria-labelledby="formTitle"
              className={`${styles.card} ${styles.formCard}`}
            >
              <header className={styles.formHead}>
                <div className={styles.eyebrow}>NEW BOOKING REQUEST</div>
                <h2 id="formTitle">Detail pendampingan</h2>
                <p>Lengkapi informasi berikut untuk mengajukan booking.</p>
              </header>
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!invalid && !noPackage && !unavailableState)
                    setSubmitted(true);
                }}
              >
                <label>
                  Pilihan Paket *
                <select aria-invalid={invalid || undefined} defaultValue={selectedPackage?.id ?? ""}>
                    <option value="">
                      {noPackage
                        ? "Belum ada paket pendampingan"
                        : "Pilih paket pendampingan"}
                    </option>
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.duration}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedPackage && (
                  <p className={styles.packageDetail}>
                    {selectedPackage.description}
                  </p>
                )}
                <div className={styles.two}>
                  <Field
                    invalid={invalid}
                    label="Nama Lengkap *"
                    placeholder="Nama lengkap"
                  />
                  <Field
                    invalid={invalid}
                    label="WhatsApp *"
                    placeholder="08xxxxxxxxxx"
                    type="tel"
                  />
                </div>
                <Field
                  invalid={invalid}
                  label="Email *"
                  placeholder="nama@email.com"
                  type="email"
                />
                <div className={styles.two}>
                  <label>
                    Tanggal Wedding *<input readOnly value={dateLabel} />
                  </label>
                  <Field invalid={invalid} label="Waktu Mulai *" type="time" />
                </div>
                <Field
                  invalid={invalid}
                  label="Lokasi Wedding *"
                  placeholder="Venue, area, atau kota"
                />
                <label>
                  Catatan
                  <textarea placeholder="Informasi prosesi, kebutuhan khusus, atau detail lainnya" />
                </label>
                <div className={styles.summary}>
                  <small>RINGKASAN PENGAJUAN</small>
                  <strong>{dateLabel}</strong>
                  <span>
                    {selectedPackage
                      ? `${selectedPackage.name} · ${selectedPackage.duration}`
                      : "Pilih paket pendampingan dan tanggal wedding."}
                  </span>
                </div>
                {(invalid || noPackage || unavailableState) && (
                  <p className={styles.message} role="alert">
                    {scenario.state.message}
                  </p>
                )}
                <button
                  className={styles.submit}
                  disabled={noPackage || unavailableState}
                  type="submit"
                >
                  Ajukan Booking <span aria-hidden="true">→</span>
                </button>
                <p className={styles.tip}>
                  Booking yang diajukan akan memiliki status{" "}
                  <b>Menunggu Konfirmasi</b>. Tim Ranur akan memeriksa jadwal
                  dan mengonfirmasi detailnya.
                </p>
              </form>
            </section>
          </div>
        ) : (
          <section aria-live="polite" className={styles.success}>
            <span className={styles.successIcon}>✓</span>
            <p className={styles.eyebrow}>REQUEST RECEIVED</p>
            <h2>Booking berhasil diajukan ♡</h2>
            <b>Menunggu Konfirmasi</b>
            <p>
              Hasil pengajuan ini adalah fixture untuk review. Tidak ada
              booking, data customer, atau transisi resmi yang dibuat.
            </p>
            <Link className={styles.submit} href="/booking-saya">
              Lihat Booking Saya
            </Link>
          </section>
        )}
      </main>
    </CustomerFrame>
  );
}

function Field({
  invalid = false,
  label,
  placeholder,
  type = "text",
}: Readonly<{
  invalid?: boolean;
  label: string;
  placeholder?: string;
  type?: string;
}>) {
  return (
    <label>
      {label}
      <input
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
