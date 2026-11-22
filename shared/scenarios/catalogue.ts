import type { ScenarioResult } from "@/shared/scenarios/contracts";
import {
  defaultCustomerBookingRecords,
  defaultCustomerBookings,
} from "@/shared/scenarios/customer-booking-fixtures";

// Typed M1-T12 presentation snapshots transcribed from the mapped admin reference.
const essentialServices = ["Personal Bridal Companion — Layanan pendampingan personal pengantin selama acara", "Bridal Attire Assistance — Merapikan gaun, veil, dan aksesori pengantin", "Makeup Touch-up Reminder — Mengingatkan pengantin untuk touch-up makeup", "Bride Mobility Assistance — Mendampingi mobilitas pengantin sepanjang acara", "Personal Care Assistance — Membantu kebutuhan personal pengantin"];
const intimatePackage = { durationHours: 3, price: 200000, includedServices: essentialServices };
const gentlePackage = { durationHours: 5, price: 300000, includedServices: [...essentialServices, "Personal Belongings Check — Mengecek dan menyerahkan kembali barang pribadi"] };
const fullDayPackage = { durationHours: 8, price: 400000, includedServices: [...essentialServices, "Ceremony Transition Support — Mendampingi pengantin saat transisi antarprosesi", "Personal Belongings Check — Mengecek dan menyerahkan kembali barang pribadi", "Outfit Change Assistance — Mendampingi pergantian busana pengantin"] };

// Presentation-only catalogue records transcribed from the mapped admin panels.
const catalogueItems = [
  { id: "attire", type: "Action", name: "Bridal Attire Assistance", description: "Merapikan gaun, veil, dan aksesori pengantin", bundleCount: 1, packageCount: 0 },
  { id: "makeup", type: "Action", name: "Makeup Touch-up Reminder", description: "Mengingatkan pengantin untuk touch-up makeup", bundleCount: 1, packageCount: 0 },
  { id: "mobility", type: "Action", name: "Bride Mobility Assistance", description: "Mendampingi mobilitas pengantin sepanjang acara", bundleCount: 1, packageCount: 0 },
  { id: "personal", type: "Action", name: "Personal Care Assistance", description: "Membantu kebutuhan personal pengantin", bundleCount: 1, packageCount: 0 },
  { id: "belongings", type: "Action", name: "Personal Belongings Check", description: "Mengecek dan menyerahkan kembali barang pribadi", bundleCount: 1, packageCount: 1 },
  { id: "outfit", type: "Action", name: "Outfit Change Assistance", description: "Mendampingi pergantian busana pengantin", bundleCount: 1, packageCount: 0 },
  { id: "service-companion", type: "Service", name: "Personal Bridal Companion", description: "Layanan pendampingan personal pengantin selama acara", bundleCount: 1, packageCount: 0 },
  { id: "service-transition", type: "Service", name: "Ceremony Transition Support", description: "Mendampingi pengantin saat transisi antarprosesi", bundleCount: 1, packageCount: 0 },
] as const;
const catalogueBundles = [
  { id: "bundle-essentials", name: "Essential Bridal Care", description: "Kebutuhan utama pendampingan pengantin.", itemIds: ["service-companion", "attire", "makeup", "mobility", "personal"], packageCount: 3 },
  { id: "bundle-extended", name: "Extended Day Support", description: "Dukungan tambahan untuk rangkaian acara yang lebih panjang.", itemIds: ["service-transition", "belongings", "outfit"], packageCount: 1 },
] as const;
const cataloguePackages = [
  { id: "p1", name: "The Intimate Care", hours: 3, price: 200000, description: "Pendampingan singkat untuk momen yang intim dan berkesan.", selections: [{ kind: "bundle", id: "bundle-essentials" }], active: true },
  { id: "p2", name: "The Gentle Companion", hours: 5, price: 300000, description: "Dukungan personal dari persiapan hingga prosesi utama.", selections: [{ kind: "bundle", id: "bundle-essentials" }, { kind: "item", id: "belongings" }], active: true },
  { id: "p3", name: "The Full Day Care", hours: 8, price: 400000, description: "Pendampingan lebih lengkap sepanjang rangkaian acara.", selections: [{ kind: "bundle", id: "bundle-essentials" }, { kind: "bundle", id: "bundle-extended" }], active: true },
] as const;
const catalogueFixture = { items: catalogueItems, bundles: catalogueBundles, packages: cataloguePackages };

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
  "customer.booking-history-success": {
    state: { kind: "success", message: "Booking fixture siap ditinjau.", nextReviewAction: "Tinjau daftar dan detail Booking Saya tanpa perubahan resmi." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Daftar booking fixture hanya untuk peninjauan.", bookings: defaultCustomerBookings, availability: [], bookingHistory: { records: defaultCustomerBookingRecords } },
  },
  "customer.booking-history-payment": {
    state: { kind: "success", message: "Status pembayaran fixture siap ditinjau.", nextReviewAction: "Tinjau status Menunggu Pembayaran tanpa transaksi." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Status fixture tidak menerima pembayaran.", bookings: [{ id: "BR-2026-003", status: "Menunggu Pembayaran" }], availability: [], bookingHistory: { records: [{ id: "BR-2026-003", status: "Menunggu Pembayaran", packageName: "The Full Day Care", duration: "8 jam pendampingan", packageDescription: "Perhatian lebih lengkap untuk rangkaian hari yang lebih panjang.", inclusions: ["Seluruh Essential Bridal Care", "Dukungan transisi antarprosesi", "Pendampingan pergantian busana"], date: "2026-12-20", startTime: "08.00", endTime: "16.00", location: "Cendana Hall, Jakarta", submittedAt: "15 November 2026, 14.00", customerName: "Bride-to-be", customerWhatsapp: "+62 812 0000 0000", customerEmail: "bride@example.test", notes: "Tidak ada catatan tambahan." }] } },
  },
  "customer.booking-history-cancellation": {
    state: { kind: "success", message: "Status pembatalan fixture siap ditinjau.", nextReviewAction: "Tinjau pengecualian tanpa mengajukan pembatalan." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Status fixture tidak menerima pembatalan.", bookings: [{ id: "BR-2026-004", status: "Menunggu Pembatalan Booking" }], availability: [], bookingHistory: { records: [{ id: "BR-2026-004", status: "Menunggu Pembatalan Booking", packageName: "The Gentle Companion", duration: "5 jam pendampingan", packageDescription: "Dukungan personal mulai dari persiapan hingga prosesi utama.", inclusions: ["Seluruh Essential Bridal Care"], date: "2026-12-28", startTime: "10.00", endTime: "15.00", location: "Taman Sari, Bogor", submittedAt: "16 November 2026, 11.00", customerName: "Bride-to-be", customerWhatsapp: "+62 812 0000 0000", customerEmail: "bride@example.test", notes: "Tidak ada catatan tambahan." }] } },
  },
  "customer.booking-history-cancelled": {
    state: { kind: "success", message: "Status pembatalan fixture siap ditinjau.", nextReviewAction: "Tinjau status Dibatalkan tanpa perubahan resmi." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Status fixture tidak menerima perubahan.", bookings: [{ id: "BR-2026-005", status: "Dibatalkan" }], availability: [], bookingHistory: { records: [{ id: "BR-2026-005", status: "Dibatalkan", packageName: "The Intimate Care", duration: "3 jam pendampingan", packageDescription: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan.", inclusions: ["Personal Bridal Companion"], date: "2026-12-30", startTime: "15.00", endTime: "18.00", location: "Seruni Venue, Jakarta", submittedAt: "17 November 2026, 09.00", customerName: "Bride-to-be", customerWhatsapp: "+62 812 0000 0000", customerEmail: "bride@example.test", notes: "Tidak ada catatan tambahan." }] } },
  },
  "customer.booking-history-reschedule": {
    state: { kind: "success", message: "Status reschedule fixture siap ditinjau.", nextReviewAction: "Tinjau pengecualian reschedule tanpa mengajukan perubahan." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Status fixture tidak menerima reschedule.", bookings: [{ id: "BR-2026-006", status: "Menunggu Reschedule Booking" }], availability: [], bookingHistory: { records: [{ id: "BR-2026-006", status: "Menunggu Reschedule Booking", packageName: "The Full Day Care", duration: "8 jam pendampingan", packageDescription: "Perhatian lebih lengkap untuk rangkaian hari yang lebih panjang.", inclusions: ["Seluruh Essential Bridal Care"], date: "2026-12-31", startTime: "08.00", endTime: "16.00", location: "Rosewood House, Bandung", submittedAt: "18 November 2026, 15.00", customerName: "Bride-to-be", customerWhatsapp: "+62 812 0000 0000", customerEmail: "bride@example.test", notes: "Tidak ada catatan tambahan." }] } },
  },
  "customer.booking-history-error": {
    state: { kind: "error", message: "Data Booking Saya belum dapat ditampilkan pada fixture ini.", nextReviewAction: "Tinjau error state tanpa data booking." },
    readModel: { surface: "customer", title: "Booking Saya", description: "Tidak ada detail booking yang ditampilkan.", bookings: [], availability: [], bookingHistory: { records: [] } },
  },
  "customer.availability-success": {
    state: { kind: "success", message: "Availability is ready for review.", nextReviewAction: "Review availability without customer details." },
    readModel: { surface: "customer", title: "Availability", description: "Customer availability exposes only date state.", bookings: [], availability: [{ date: "2026-12-12", state: "unavailable" }] },
  },
  "customer.whatsapp-unavailable": {
    state: { kind: "unavailable", message: "Kontak WhatsApp belum tersedia. Silakan coba kembali nanti.", nextReviewAction: "Review the unavailable handoff state." },
    readModel: { surface: "customer", title: "WhatsApp unavailable", description: "The fixture does not open a live WhatsApp handoff.", bookings: [{ id: "booking-review-02", status: "Menunggu Konfirmasi" }], availability: [] },
  },
  "customer.home-success": {
    state: { kind: "success", message: "Ringkasan customer fixture siap ditinjau.", nextReviewAction: "Tinjau beranda customer dan langkah berikutnya." },
    readModel: { surface: "customer", title: "Halo, Bride-to-be", description: "Ringkasan Bride Assistant ini hanya menggunakan data fixture.", bookings: defaultCustomerBookings, availability: [{ date: "2026-12-12", state: "available" }], bookingHistory: { records: defaultCustomerBookingRecords } },
  },
  "customer.home-empty": {
    state: { kind: "empty", message: "Belum ada booking pada fixture ini.", nextReviewAction: "Tinjau empty state customer tanpa data tersembunyi." },
    readModel: { surface: "customer", title: "Halo, Bride-to-be", description: "Belum ada booking yang ditampilkan pada fixture ini.", bookings: [], availability: [] },
  },
  "customer.command-result": {
    state: { kind: "success", message: "The fixture command result is visible for review.", nextReviewAction: "Review the non-authoritative result." },
    readModel: { surface: "customer", title: "Booking request review", description: "This result does not create an official booking transition.", bookings: [{ id: "booking-review-03", status: "Menunggu Konfirmasi" }], availability: [] },
  },
  "customer.booking-request-default": {
    state: { kind: "success", message: "Booking request fixture is ready for review.", nextReviewAction: "Review package, date, and detail entry without creating a booking." },
    readModel: { surface: "customer", title: "Booking Baru", description: "A fixture booking request remains non-authoritative.", bookings: [], availability: [{ date: "2026-12-12", state: "available" }, { date: "2026-12-13", state: "unavailable" }], bookingRequest: { packages: [{ id: "intimate", name: "The Intimate Care", duration: "3 jam pendampingan", description: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan." }, { id: "gentle", name: "The Gentle Companion", duration: "5 jam pendampingan", description: "Dukungan personal mulai dari persiapan hingga prosesi utama." }, { id: "full-day", name: "The Full Day Care", duration: "8 jam pendampingan", description: "Perhatian lebih lengkap untuk rangkaian hari yang lebih panjang." }] } },
  },
  "customer.booking-request-invalid": {
    state: { kind: "error", message: "Pilih paket dan lengkapi detail yang diperlukan sebelum meninjau hasil fixture.", nextReviewAction: "Review the required-field validation state." },
    readModel: { surface: "customer", title: "Booking Baru", description: "The fixture shows validation without submitting data.", bookings: [], availability: [{ date: "2026-12-12", state: "available" }], bookingRequest: { packages: [{ id: "intimate", name: "The Intimate Care", duration: "3 jam pendampingan", description: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan." }], selectedDate: "2026-12-12" } },
  },
  "customer.booking-request-unavailable": {
    state: { kind: "unavailable", message: "Tanggal yang dipilih tidak dapat diajukan. Silakan pilih tanggal lain.", nextReviewAction: "Review the unavailable-date fixture without customer information." },
    readModel: { surface: "customer", title: "Booking Baru", description: "Availability exposes only a date state.", bookings: [], availability: [{ date: "2026-12-12", state: "unavailable" }], bookingRequest: { packages: [{ id: "intimate", name: "The Intimate Care", duration: "3 jam pendampingan", description: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan." }], selectedDate: "2026-12-12" } },
  },
  "customer.booking-request-no-package": {
    state: { kind: "empty", message: "Belum ada paket pendampingan yang dapat dipilih pada fixture ini.", nextReviewAction: "Review the no-package state without an alternate action." },
    readModel: { surface: "customer", title: "Booking Baru", description: "No package is available in this fixture.", bookings: [], availability: [{ date: "2026-12-12", state: "available" }], bookingRequest: { packages: [], selectedDate: "2026-12-12" } },
  },
  "customer.booking-request-result": {
    state: { kind: "success", message: "Hasil pengajuan fixture siap ditinjau.", nextReviewAction: "Review the non-authoritative Menunggu Konfirmasi result." },
    readModel: { surface: "customer", title: "Booking Baru", description: "This result does not create an official booking transition.", bookings: [{ id: "booking-review-10", status: "Menunggu Konfirmasi" }], availability: [{ date: "2026-12-12", state: "available" }], bookingRequest: { packages: [{ id: "intimate", name: "The Intimate Care", duration: "3 jam pendampingan", description: "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan." }], selectedDate: "2026-12-12" } },
  },
  "customer.booking-error": {
    state: { kind: "error", message: "The booking fixture could not be prepared.", nextReviewAction: "Review the error state." },
    readModel: { surface: "customer", title: "Booking review unavailable", description: "No customer details are shown for this review state.", bookings: [], availability: [] },
  },
  "customer.register-validation": {
    state: { kind: "error", message: "Periksa kembali data yang ditandai sebelum melanjutkan review.", nextReviewAction: "Review the registration validation fixture." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"], feedback: "Nama lengkap, nomor WhatsApp, dan konfirmasi kata sandi perlu diperiksa. Ini hanya hasil validasi fixture." },
  },
  "customer.register-default": {
    state: { kind: "success", message: "Registration form fixture is ready for review.", nextReviewAction: "Review the default registration composition." },
    readModel: { surface: "customer-auth", mode: "register", title: "Daftar Akun", description: "Buat akun customer untuk mempersiapkan pengalaman bridal care yang lebih personal.", fields: ["name"] },
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
  "customer.signin-default": {
    state: { kind: "success", message: "Sign-in form fixture is ready for review.", nextReviewAction: "Review the default sign-in composition." },
    readModel: { surface: "customer-auth", mode: "sign-in", title: "Masuk Akun", description: "Masukkan email dan kata sandimu untuk melanjutkan.", fields: ["email"] },
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
    readModel: { surface: "admin", title: "Empty catalogue", description: "No durable catalogue data is created.", content: [], bookingStatuses: [], adminCatalogue: { mode: "services", items: [], bundles: [], packages: [] } },
  },
  "admin.catalogue-services": {
    state: { kind: "success", message: "Catalogue fixture siap ditinjau.", nextReviewAction: "Tinjau service, action, bundle, dan hasil kontrol tanpa perubahan data." },
    readModel: { surface: "admin", title: "Services & Actions", description: "Fixture catalogue only.", content: [], bookingStatuses: [], adminCatalogue: { mode: "services", ...catalogueFixture } },
  },
  "admin.catalogue-packages": {
    state: { kind: "success", message: "Master package fixture siap ditinjau.", nextReviewAction: "Tinjau harga dan komposisi tanpa perubahan data." },
    readModel: { surface: "admin", title: "Master Packages", description: "Fixture packages only.", content: [], bookingStatuses: [], adminCatalogue: { mode: "packages", ...catalogueFixture } },
  },
  "admin.catalogue-error": {
    state: { kind: "error", message: "The catalogue fixture could not be prepared.", nextReviewAction: "Review the error state." },
    readModel: { surface: "admin", title: "Services & Actions", description: "No catalogue data is displayed for this review state.", content: [], bookingStatuses: [], adminCatalogue: { mode: "services", items: [], bundles: [], packages: [] } },
  },
  "admin.catalogue-proposed-result": {
    state: { kind: "success", message: "Proposed edit result fixture siap ditinjau.", nextReviewAction: "Tinjau hasil non-authoritative tanpa menyimpan data." },
    readModel: { surface: "admin", title: "Services & Actions", description: "Proposed edit only.", content: [], bookingStatuses: [], adminCatalogue: { mode: "services", ...catalogueFixture } },
  },
  "admin.catalogue-packages-empty": {
    state: { kind: "empty", message: "No catalogue entries are available in this fixture.", nextReviewAction: "Review the empty admin package state." },
    readModel: { surface: "admin", title: "Master Packages", description: "No durable package data is created.", content: [], bookingStatuses: [], adminCatalogue: { mode: "packages", items: [], bundles: [], packages: [] } },
  },
  "admin.catalogue-packages-error": {
    state: { kind: "error", message: "The catalogue fixture could not be prepared.", nextReviewAction: "Review the package error state." },
    readModel: { surface: "admin", title: "Master Packages", description: "No package data is displayed for this review state.", content: [], bookingStatuses: [], adminCatalogue: { mode: "packages", items: [], bundles: [], packages: [] } },
  },
  "admin.catalogue-packages-proposed-result": {
    state: { kind: "success", message: "Proposed edit result fixture siap ditinjau.", nextReviewAction: "Tinjau hasil paket non-authoritative tanpa menyimpan data." },
    readModel: { surface: "admin", title: "Master Packages", description: "Proposed package edit only.", content: [], bookingStatuses: [], adminCatalogue: { mode: "packages", ...catalogueFixture } },
  },
  "admin.catalogue-packages-long": {
    state: { kind: "success", message: "Long package fixture siap ditinjau.", nextReviewAction: "Tinjau reflow nama dan komposisi paket." },
    readModel: { surface: "admin", title: "Master Packages", description: "Long-content fixture only.", content: [], bookingStatuses: [], adminCatalogue: { mode: "packages", ...catalogueFixture, packages: [{ ...cataloguePackages[2], name: "The Full Day Care — Pendampingan lebih lengkap sepanjang rangkaian acara." }] } },
  },
  "admin.booking-success": {
    state: { kind: "success", message: "Admin booking fixture data is ready for review.", nextReviewAction: "Review canonical lifecycle labels." },
    readModel: { surface: "admin", title: "Booking review", description: "Administrative fixture data is not an authority decision.", content: [], bookingStatuses: ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil", "Menunggu Pembatalan Booking", "Dibatalkan", "Menunggu Reschedule Booking"] },
  },
  "admin.booking-workspace": {
    state: { kind: "success", message: "Workspace booking fixture siap ditinjau.", nextReviewAction: "Tinjau kalender, filter, detail, dan hasil kontrol non-authoritative." },
    readModel: { surface: "admin", title: "Your bookings", description: "Tinjau jadwal bridal care dalam workspace fixture.", content: [], bookingStatuses: ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Booking Berhasil", "Menunggu Pembatalan Booking", "Dibatalkan", "Menunggu Reschedule Booking"], adminBooking: { mode: "bookings", blockedDates: ["2026-11-18", "2026-11-26"], records: [
      { id: "BA-001", customer: "Putri Amelia", phone: "0812-0000-1105", source: "BA", packageName: "The Gentle Companion", ...gentlePackage, notes: "Perhatikan aksesori saat prosesi.", date: "2026-11-05", start: "09:00", end: "14:00", location: "Serpong, Tangerang Selatan", status: "Booking Berhasil" },
      { id: "BA-002", customer: "Dinda Prameswari", phone: "0812-0000-1112", source: "BA", packageName: "The Intimate Care", ...intimatePackage, notes: "Tiba lebih awal untuk persiapan veil.", date: "2026-11-12", start: "08:00", end: "11:00", location: "Tangerang", status: "Booking Berhasil" },
      { id: "BA-003", customer: "Nabila Putri", phone: "0812-0000-1212", source: "Customer", packageName: "The Gentle Companion", ...gentlePackage, notes: "", date: "2026-11-12", start: "14:00", end: "19:00", location: "BSD City", status: "Menunggu Konfirmasi" },
      { id: "BA-004", customer: "Salsa Dewi", phone: "0812-0000-1114", source: "BA", packageName: "The Full Day Care", ...fullDayPackage, notes: "Menunggu konfirmasi DP.", date: "2026-11-14", start: "08:00", end: "16:00", location: "Jakarta Selatan", status: "Menunggu Pembayaran" },
      { id: "BA-005", customer: "Aulia Rahma", phone: "0812-0000-1120", source: "Customer", packageName: "The Gentle Companion", ...gentlePackage, notes: "", date: "2026-11-20", start: "07:00", end: "12:00", location: "Jakarta Barat", status: "Menunggu Konfirmasi" },
      { id: "BA-006", customer: "Rania Kamil", phone: "0812-0000-1124", source: "BA", packageName: "The Intimate Care", ...intimatePackage, notes: "", date: "2026-11-24", start: "08:00", end: "11:00", location: "Ciputat", status: "Booking Berhasil" }
    ] } },
  },
  "admin.booking-empty": {
    state: { kind: "empty", message: "Belum ada booking pada rentang fixture ini.", nextReviewAction: "Tinjau empty state tanpa membuat data booking." },
    readModel: { surface: "admin", title: "Your bookings", description: "Tidak ada hasil booking untuk ditampilkan.", content: [], bookingStatuses: [], adminBooking: { mode: "bookings", blockedDates: [], records: [] } },
  },
  "admin.availability-workspace": {
    state: { kind: "success", message: "Availability fixture siap ditinjau.", nextReviewAction: "Tinjau jam kerja, tanggal terblokir, dan hasil kontrol non-authoritative." },
    readModel: { surface: "admin", title: "Your availability", description: "Atur tampilan availability fixture tanpa mengubah jadwal operasional.", content: [], bookingStatuses: [], adminBooking: { mode: "availability", blockedDates: ["2026-11-18", "2026-11-26"], records: [] } },
  },
  "admin.content-draft-success": {
    state: { kind: "success", message: "Draft and published content are ready for admin review.", nextReviewAction: "Review publication distinctions." },
    readModel: { surface: "admin", title: "Content publication review", description: "Admin fixtures may distinguish draft from published content.", content: [{ id: "draft-rose", title: "Draft consultation", publication: "draft" }, { id: "published-rose", title: "Published consultation", publication: "published" }], bookingStatuses: [], adminContent: {
      portfolio: [
        { id: "portfolio-draft", title: "An intimate bridal morning", publication: "draft", category: "Our Moments", description: "A quiet preparation moment before the celebration." },
        { id: "portfolio-published", title: "A garden celebration", publication: "published", category: "Wedding moments", description: "A bridal care story from a garden wedding." },
      ],
      testimonials: [
        { id: "testimonial-draft", title: "A thoughtful morning", publication: "draft", quote: "The morning felt calm and thoughtfully arranged.", attribution: "Fictional customer A" },
        { id: "testimonial-published", title: "A special day", publication: "published", quote: "I felt supported throughout the day.", attribution: "Fictional customer B" },
      ],
      events: [
        { id: "event-draft", title: "Bridal Open House", publication: "draft", date: "2026-12-12", location: "Studio Ranur", description: "A fictional studio open house for fixture review.", theme: "✦" },
        { id: "event-published", title: "Bridal Care Preview", publication: "published", date: "2026-11-14", location: "Studio Ranur", description: "A fictional bridal care preview for fixture review.", theme: "✦" },
      ],
    } },
  },
  "admin.content-empty": {
    state: { kind: "empty", message: "No content records are available in this fixture.", nextReviewAction: "Review empty portfolio, testimonial, and event collections." },
    readModel: { surface: "admin", title: "Content publication review", description: "Empty content collections for review.", content: [], bookingStatuses: [], adminContent: { portfolio: [], testimonials: [], events: [] } },
  },
  "admin.content-error": {
    state: { kind: "error", message: "The content review fixture could not be prepared.", nextReviewAction: "Review the error state without changing content." },
    readModel: { surface: "admin", title: "Content publication review", description: "No content records are shown for this error fixture.", content: [], bookingStatuses: [], adminContent: { portfolio: [], testimonials: [], events: [] } },
  },
  "admin.content-proposed-result": {
    state: { kind: "success", message: "Proposed content action only; no content or publication state changed.", nextReviewAction: "Review the unchanged fixture record." },
    readModel: { surface: "admin", title: "Content publication review", description: "No mutation is applied in this fixture.", content: [], bookingStatuses: [], adminContent: { portfolio: [], testimonials: [], events: [] } },
  },
  "admin.command-result": {
    state: { kind: "success", message: "The admin fixture command result is visible for review.", nextReviewAction: "Review the non-authoritative result." },
    readModel: { surface: "admin", title: "Admin command review", description: "This fixture cannot apply an official transition.", content: [], bookingStatuses: ["Menunggu Konfirmasi"] },
  },
} as const satisfies Record<string, Omit<ScenarioResult, "version" | "scenarioId" | "provenance" | "interaction">>;
