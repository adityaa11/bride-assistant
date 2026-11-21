import type { CustomerBookingRecord } from "./contracts";

/**
 * The default customer booking read model is shared by the dashboard preview
 * and the full Booking Saya workspace. Scenario-specific records remain in
 * the catalogue for their named review states.
 */
export const defaultCustomerBookingRecords = [
  {
    id: "BR-2026-001",
    status: "Menunggu Konfirmasi",
    packageName: "The Gentle Companion",
    duration: "5 jam pendampingan",
    packageDescription:
      "Dukungan personal mulai dari persiapan hingga prosesi utama.",
    inclusions: [
      "Seluruh Essential Bridal Care",
      "Pemeriksaan barang pribadi",
      "Pendampingan selama rangkaian utama",
    ],
    date: "2026-12-12",
    startTime: "09.00",
    endTime: "14.00",
    location: "The Garden Ballroom, Jakarta",
    submittedAt: "12 November 2026, 10.30",
    customerName: "Bride-to-be",
    customerWhatsapp: "+62 812 0000 0000",
    customerEmail: "bride@example.test",
    notes: "Mohon pendampingan saat persiapan dan prosesi utama.",
  },
  {
    id: "BR-2026-002",
    status: "Booking Berhasil",
    packageName: "The Intimate Care",
    duration: "3 jam pendampingan",
    packageDescription:
      "Pendampingan singkat untuk momen pernikahan yang intim dan berkesan.",
    inclusions: [
      "Personal Bridal Companion",
      "Bantuan gaun, veil, dan aksesori",
      "Pengingat touch-up & kebutuhan personal",
    ],
    date: "2026-11-22",
    startTime: "13.00",
    endTime: "16.00",
    location: "Rumah Kaca, Bandung",
    submittedAt: "4 November 2026, 09.15",
    customerName: "Bride-to-be",
    customerWhatsapp: "+62 812 0000 0000",
    customerEmail: "bride@example.test",
    notes: "Tidak ada catatan tambahan.",
  },
] as const satisfies readonly CustomerBookingRecord[];

export const defaultCustomerBookings = defaultCustomerBookingRecords.map(
  ({ id, status }) => ({ id, status }),
);
