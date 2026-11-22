"use client";

import { CustomerFrame } from "@/shared/customer-home";
import { BookingCalendar, calendarDate, parseCalendarDate } from "@/shared/booking-calendar";
import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import styles from "./customer-booking.module.css";

function subscribeToCalendarDay(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, tomorrow.getTime() - now.getTime());
  };
  schedule();
  return () => clearTimeout(timer);
}

const currentCalendarDay = () => calendarDate(new Date());
const serverCalendarDay = () => undefined;

export function CustomerBooking({
  scenarioId,
}: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);
  const request =
    scenario.readModel.surface === "customer"
      ? scenario.readModel.bookingRequest
      : undefined;
  const [selectedDate, setSelectedDate] = useState(request?.selectedDate);
  const [visibleMonth, setVisibleMonth] = useState<"november" | "december">(
    request?.selectedDate ? "december" : "november",
  );
  const [submitted, setSubmitted] = useState(
    scenarioId === "customer.booking-request-result",
  );
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [formError, setFormError] = useState("");
  const today = useSyncExternalStore(subscribeToCalendarDay, currentCalendarDay, serverCalendarDay);
  if (scenario.readModel.surface !== "customer") return null;
  const packages = request?.packages ?? [];
  const unavailable = new Set(
    scenario.readModel.availability
      .filter((item) => item.state === "unavailable")
      .map((item) => item.date),
  );
  const selectedPackage =
    packages.find((item) => item.id === selectedPackageId) ?? packages[0];
  const invalid = scenarioId === "customer.booking-request-invalid";
  const noPackage = scenarioId === "customer.booking-request-no-package";
  const unavailableState =
    scenarioId === "customer.booking-request-unavailable";
  const dateLabel = selectedDate
    ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(parseCalendarDate(selectedDate))
    : "Belum ada tanggal dipilih";
  const showingDecember = visibleMonth === "december";
  const calendarMonth = showingDecember ? "Desember 2026" : "November 2026";
  return (
    <CustomerFrame active="Booking Baru" scenarioId={scenarioId}>
      <section className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.breadcrumb}>
            <Link href="/beranda">Beranda</Link> / Booking Baru
          </div>
          <div className={styles.eyebrow}>
            LET&apos;S PLAN YOUR BEAUTIFUL DAY
          </div>
          <h1>
            Find your perfect date,
            <br />
            <em>we&apos;ll take care of the rest.</em>
          </h1>
          <p>
            Pilih paket dan tanggal yang kamu inginkan, lalu lengkapi detail
            acara untuk meninjau simulasi pengajuan. Tidak ada permintaan yang
            dikirim ke tim Ranur.
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
                  <button
                    aria-label="Bulan sebelumnya"
                    disabled={!showingDecember}
                    onClick={() => setVisibleMonth("november")}
                    type="button"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Bulan berikutnya"
                    disabled={showingDecember}
                    onClick={() => setVisibleMonth("december")}
                    type="button"
                  >
                    ›
                  </button>
                </div>
              </header>
              <BookingCalendar
                ariaLabel="Pilih tanggal pernikahan"
                classes={{ root: styles.calendar, grid: styles.calendarGrid, weekday: styles.calendarWeekday, day: styles.day, selected: styles.selected, disabled: styles.disabledDay, unavailable: styles.unavailable }}
                disabled={[(date) => !today || calendarDate(date) < today, (date) => unavailable.has(calendarDate(date))]}
                labelDay={(date) => `${date.getDate()} ${date.getMonth() === 10 ? "November" : "Desember"} 2026${unavailable.has(calendarDate(date)) ? ", tidak tersedia" : ""}`}
                month={new Date(2026, showingDecember ? 11 : 10, 1)}
                onSelect={setSelectedDate}
                renderDay={(date, selected) => {
                  const blocked = unavailable.has(calendarDate(date));
                  return <><span>{date.getDate()}</span><small>{blocked ? "Penuh" : selected ? "Dipilih" : ""}</small></>;
                }}
                selected={selectedDate}
                unavailable={(date) => unavailable.has(calendarDate(date))}
              />
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
                Pada simulasi ini tidak ada permintaan yang dikirim ke tim Ranur.
              </p>
            </section>
            <section
              aria-labelledby="formTitle"
              className={`${styles.card} ${styles.formCard}`}
            >
              <header className={styles.formHead}>
                <div className={styles.eyebrow}>NEW BOOKING REQUEST</div>
                <h2 id="formTitle">Detail pendampingan</h2>
                <p>Lengkapi informasi berikut untuk meninjau hasil simulasi booking.</p>
              </header>
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (invalid || noPackage || unavailableState) return;
                  if (!selectedDate || !selectedPackage) {
                    setFormError(
                      "Pilih paket dan tanggal wedding sebelum mengajukan booking.",
                    );
                    return;
                  }
                  if (selectedDate < currentCalendarDay() || unavailable.has(selectedDate)) {
                    setFormError("Tanggal yang dipilih sudah berlalu atau tidak tersedia. Pilih tanggal lain.");
                    return;
                  }
                  setFormError("");
                  setSubmitted(true);
                }}
              >
                <label>
                  Pilihan Paket *
                  <select
                    aria-invalid={invalid || undefined}
                    defaultValue={selectedPackage?.id ?? ""}
                    name="package"
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    required
                  >
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
                    name="customerName"
                    placeholder="Nama lengkap"
                    required
                  />
                  <Field
                    invalid={invalid}
                    label="WhatsApp *"
                    name="whatsapp"
                    placeholder="08xxxxxxxxxx"
                    required
                    type="tel"
                  />
                </div>
                <Field
                  invalid={invalid}
                  label="Email *"
                  name="email"
                  placeholder="nama@email.com"
                  required
                  type="email"
                />
                <div className={styles.two}>
                  <label>
                    Tanggal Wedding *<input placeholder="Pilih Tanggal" readOnly value={selectedDate ? dateLabel : ""} />
                    <input name="date" required type="hidden" value={selectedDate ?? ""} />
                  </label>
                  <Field invalid={invalid} label="Waktu Mulai *" name="startTime" required type="time" />
                </div>
                <Field
                  invalid={invalid}
                  label="Lokasi Wedding *"
                  name="location"
                  placeholder="Venue, area, atau kota"
                  required
                />
                <label>
                  Catatan
                  <textarea name="notes" placeholder="Informasi prosesi, kebutuhan khusus, atau detail lainnya" />
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
                {(invalid || noPackage || unavailableState || formError) && (
                  <p className={styles.message} role="alert">
                    {formError || scenario.state.message}
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
                  Hasil simulasi menampilkan status <b>Menunggu Konfirmasi</b>.
                  Tidak ada booking yang dikirim atau disimpan.
                </p>
              </form>
            </section>
          </div>
        ) : (
          <section aria-live="polite" className={styles.success}>
            <span className={styles.successIcon}>✓</span>
            <p className={styles.eyebrow}>SIMULATION RESULT</p>
            <h2>Hasil pengajuan booking ♡</h2>
            <b>Menunggu Konfirmasi</b>
            <p>
              Ini hanya hasil simulasi. Detail form tidak dikirim atau disimpan;
              Beranda dan Booking Saya tetap menampilkan data fixture yang sudah ada.
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
  name,
  placeholder,
  required = false,
  type = "text",
}: Readonly<{
  invalid?: boolean;
  label: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}>) {
  return (
    <label>
      {label}
      <input
        aria-invalid={invalid || undefined}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
