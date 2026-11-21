import type { ScenarioResult } from "@/shared/scenarios/contracts";

export const scenarioCatalogue = {
  "public.catalogue-loading": {
    state: { kind: "loading", message: "Packages are being prepared for review.", nextReviewAction: "Wait for the fixture state." },
    readModel: { surface: "public", title: "Package review", description: "Published package data is loading.", publishedContent: [], packages: [], promotions: [] },
  },
  "public.catalogue-empty": {
    state: { kind: "empty", message: "No published packages are available in this fixture.", nextReviewAction: "Review the empty catalogue state." },
    readModel: { surface: "public", title: "No packages yet", description: "There are no published packages to show.", publishedContent: [], packages: [], promotions: [] },
  },
  "public.published-content-empty": {
    state: { kind: "empty", message: "No published content is available in this fixture.", nextReviewAction: "Review the empty public-content state." },
    readModel: { surface: "public", title: "No published content", description: "Draft content is not included in public reads.", publishedContent: [], packages: [], promotions: [] },
  },
  "public.discovery-success": {
    state: { kind: "success", message: "Published discovery content is ready for review.", nextReviewAction: "Review the public discovery fixture." },
    readModel: {
      surface: "public",
      title: "Ranur Bridal Care",
      description: "Published fixture content for public review.",
      publishedContent: [],
      packages: [
        { id: "intimate", category: "The essentials", title: "The Intimate Care", duration: "3 jam pendampingan", description: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan.", inclusions: ["Personal Bridal Companion", "Bantuan gaun, veil, dan aksesori", "Pengingat touch-up & kebutuhan personal"], featured: false },
        { id: "gentle", category: "The signature", title: "The Gentle Companion", duration: "5 jam pendampingan", description: "Dukungan personal mulai dari persiapan hingga prosesi utama.", inclusions: ["Seluruh Essential Bridal Care", "Pemeriksaan barang pribadi", "Pendampingan selama rangkaian utama"], featured: true },
        { id: "full-day", category: "The extended", title: "The Full Day Care", duration: "8 jam pendampingan", description: "Perhatian lebih lengkap untuk rangkaian hari yang lebih panjang.", inclusions: ["Seluruh Essential Bridal Care", "Dukungan transisi antarprosesi", "Pendampingan pergantian busana"], featured: false },
      ],
      promotions: [{ id: "welcome-care", title: "A little more care for your moment", description: "A published seasonal offer for a considered bridal companion.", value: "10%", endsOn: "31 Desember 2026" }],
    },
  },
  "public.catalogue-error": {
    state: { kind: "error", message: "The package fixture could not be prepared.", nextReviewAction: "Review the error state." },
    readModel: { surface: "public", title: "Package review unavailable", description: "No package data is displayed for this review state.", publishedContent: [], packages: [], promotions: [] },
  },
  "customer.booking-loading": {
    state: { kind: "loading", message: "Booking fixture data is loading.", nextReviewAction: "Wait for the fixture state." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Customer booking data is loading.", bookings: [], availability: [] },
  },
  "customer.bookings-empty": {
    state: { kind: "empty", message: "No customer bookings are available in this fixture.", nextReviewAction: "Review the empty Booking Saya state." },
    readModel: { surface: "customer", title: "No bookings yet", description: "No booking records are shown in this fixture.", bookings: [], availability: [] },
  },
  "customer.booking-success": {
    state: { kind: "success", message: "A booking fixture is ready for review.", nextReviewAction: "Review the non-authoritative booking state." },
    readModel: { surface: "customer", title: "Booking Saya", description: "A fixture booking remains non-authoritative.", bookings: [{ id: "booking-review-01", status: "Menunggu Konfirmasi" }], availability: [{ date: "2026-12-12", state: "available" }] },
  },
  "customer.availability-success": {
    state: { kind: "success", message: "Availability is ready for review.", nextReviewAction: "Review availability without customer details." },
    readModel: { surface: "customer", title: "Availability", description: "Customer availability exposes only date state.", bookings: [], availability: [{ date: "2026-12-12", state: "unavailable" }] },
  },
  "customer.whatsapp-unavailable": {
    state: { kind: "unavailable", message: "WhatsApp handoff is unavailable in this fixture.", nextReviewAction: "Review the unavailable handoff state." },
    readModel: { surface: "customer", title: "WhatsApp unavailable", description: "The fixture does not open a live WhatsApp handoff.", bookings: [{ id: "booking-review-02", status: "Menunggu Konfirmasi" }], availability: [] },
  },
  "customer.command-result": {
    state: { kind: "success", message: "The fixture command result is visible for review.", nextReviewAction: "Review the non-authoritative result." },
    readModel: { surface: "customer", title: "Booking request review", description: "This result does not create an official booking transition.", bookings: [{ id: "booking-review-03", status: "Menunggu Konfirmasi" }], availability: [] },
  },
  "customer.booking-error": {
    state: { kind: "error", message: "The booking fixture could not be prepared.", nextReviewAction: "Review the error state." },
    readModel: { surface: "customer", title: "Booking review unavailable", description: "No customer details are shown for this review state.", bookings: [], availability: [] },
  },
  "customer.register-validation": {
    state: { kind: "error", message: "Periksa kembali data yang ditandai sebelum melanjutkan review.", nextReviewAction: "Review the registration validation fixture." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"], feedback: "Nama lengkap, nomor WhatsApp, dan konfirmasi kata sandi perlu diperiksa. Ini hanya hasil validasi fixture." },
  },
  "customer.register-loading": {
    state: { kind: "loading", message: "Fixture pendaftaran sedang disiapkan untuk review.", nextReviewAction: "Review the registration loading state." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"] },
  },
  "customer.register-error": {
    state: { kind: "error", message: "Fixture pendaftaran belum dapat ditampilkan.", nextReviewAction: "Review the registration error state." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"], feedback: "Pendaftaran tidak diproses. Tidak ada akun atau data yang dibuat." },
  },
  "customer.register-success": {
    state: { kind: "success", message: "Hasil pendaftaran fixture siap ditinjau.", nextReviewAction: "Review the non-authoritative registration result." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"], feedback: "Hasil fixture: pendaftaran tidak membuat akun, sesi, atau data customer." },
  },
  "customer.signin-validation": {
    state: { kind: "error", message: "Masukkan alamat email dan kata sandi untuk meninjau validasi fixture.", nextReviewAction: "Review the sign-in validation fixture." },
    readModel: { surface: "customer-auth", mode: "sign-in", title: "Masuk Akun", description: "Masukkan email dan kata sandimu untuk melanjutkan.", fields: ["email"], feedback: "Email atau kata sandi perlu diperiksa. Tidak ada sesi yang dibuat." },
  },
  "customer.signin-loading": {
    state: { kind: "loading", message: "Fixture masuk sedang disiapkan untuk review.", nextReviewAction: "Review the sign-in loading state." },
    readModel: { surface: "customer-auth", mode: "sign-in", title: "Masuk Akun", description: "Masukkan email dan kata sandimu untuk melanjutkan.", fields: ["email"] },
  },
  "customer.signin-error": {
    state: { kind: "error", message: "Fixture masuk belum dapat ditampilkan.", nextReviewAction: "Review the sign-in error state." },
    readModel: { surface: "customer-auth", mode: "sign-in", title: "Masuk Akun", description: "Masukkan email dan kata sandimu untuk melanjutkan.", fields: ["email"], feedback: "Masuk tidak diproses. Tidak ada akun, sesi, atau pengalihan yang dibuat." },
  },
  "customer.signin-success": {
    state: { kind: "success", message: "Hasil masuk fixture siap ditinjau.", nextReviewAction: "Review the non-authoritative sign-in result." },
    readModel: { surface: "customer-auth", mode: "sign-in", title: "Masuk Akun", description: "Masukkan email dan kata sandimu untuk melanjutkan.", fields: ["email"], feedback: "Hasil fixture: masuk tidak membuat sesi atau mengalihkan customer." },
  },
  "admin.catalogue-empty": {
    state: { kind: "empty", message: "No catalogue entries are available in this fixture.", nextReviewAction: "Review the empty admin catalogue state." },
    readModel: { surface: "admin", title: "Empty catalogue", description: "No durable catalogue data is created.", content: [], bookingStatuses: [] },
  },
  "admin.booking-success": {
    state: { kind: "success", message: "Admin booking fixture data is ready for review.", nextReviewAction: "Review canonical lifecycle labels." },
    readModel: { surface: "admin", title: "Booking review", description: "Administrative fixture data is not an authority decision.", content: [], bookingStatuses: ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil", "Menunggu Pembatalan Booking", "Dibatalkan", "Menunggu Reschedule Booking"] },
  },
  "admin.content-draft-success": {
    state: { kind: "success", message: "Draft and published content are ready for admin review.", nextReviewAction: "Review publication distinctions." },
    readModel: { surface: "admin", title: "Content publication review", description: "Admin fixtures may distinguish draft from published content.", content: [{ id: "draft-rose", title: "Draft consultation", publication: "draft" }, { id: "published-rose", title: "Published consultation", publication: "published" }], bookingStatuses: [] },
  },
  "admin.command-result": {
    state: { kind: "success", message: "The admin fixture command result is visible for review.", nextReviewAction: "Review the non-authoritative result." },
    readModel: { surface: "admin", title: "Admin command review", description: "This fixture cannot apply an official transition.", content: [], bookingStatuses: ["Menunggu Konfirmasi"] },
  },
} as const satisfies Record<string, Omit<ScenarioResult, "version" | "scenarioId" | "provenance" | "interaction">>;
