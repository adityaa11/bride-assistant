import type { ScenarioResult } from "@/shared/scenarios/contracts";

export const scenarioCatalogue = {
  "public.catalogue-loading": {
    state: { kind: "loading", message: "Packages are being prepared for review.", nextReviewAction: "Wait for the fixture state." },
    readModel: { surface: "public", title: "Package review", description: "Published package data is loading.", publishedContent: [] },
  },
  "public.catalogue-empty": {
    state: { kind: "empty", message: "No published packages are available in this fixture.", nextReviewAction: "Review the empty catalogue state." },
    readModel: { surface: "public", title: "No packages yet", description: "There are no published packages to show.", publishedContent: [] },
  },
  "public.published-content-empty": {
    state: { kind: "empty", message: "No published content is available in this fixture.", nextReviewAction: "Review the empty public-content state." },
    readModel: { surface: "public", title: "No published content", description: "Draft content is not included in public reads.", publishedContent: [] },
  },
  "public.published-content-success": {
    state: { kind: "success", message: "Published content is ready for review.", nextReviewAction: "Review the published-content state." },
    readModel: { surface: "public", title: "Ranur Bridal Care", description: "Published fixture content for public review.", publishedContent: [{ id: "content-rose", title: "Soft Rose Atelier" }] },
  },
  "public.catalogue-error": {
    state: { kind: "error", message: "The package fixture could not be prepared.", nextReviewAction: "Review the error state." },
    readModel: { surface: "public", title: "Package review unavailable", description: "No package data is displayed for this review state.", publishedContent: [] },
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
