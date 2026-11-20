export const SCENARIO_ADAPTER_VERSION = "m1-fixture-v1" as const;

export type Surface = "public" | "customer" | "admin" | "system";

export type CanonicalBookingStatus =
  | "Menunggu Konfirmasi"
  | "Menunggu Pembayaran"
  | "Booking Berhasil"
  | "Menunggu Pembatalan Booking"
  | "Dibatalkan"
  | "Menunggu Reschedule Booking";

export type ScenarioStateKind = "loading" | "empty" | "error" | "success" | "unavailable";

export type ScenarioState = Readonly<{
  kind: ScenarioStateKind;
  message: string;
  nextReviewAction: string;
}>;

export type NonAuthoritativeProvenance = Readonly<{
  kind: "fixture";
  label: "Non-authoritative fixture — no session, persistence, or official transition.";
}>;

export type NonAuthoritativeInteraction = Readonly<{
  kind: "not-authoritative";
  summary: string;
}>;

type BaseReadModel = Readonly<{
  surface: Surface;
  title: string;
  description: string;
}>;

export type PublicReadModel = BaseReadModel &
  Readonly<{
    surface: "public";
    publishedContent: readonly Readonly<{ id: string; title: string }> [];
  }>;

export type CustomerReadModel = BaseReadModel &
  Readonly<{
    surface: "customer";
    bookings: readonly Readonly<{ id: string; status: CanonicalBookingStatus }> [];
    availability: readonly Readonly<{ date: string; state: "available" | "unavailable" }> [];
  }>;

export type AdminReadModel = BaseReadModel &
  Readonly<{
    surface: "admin";
    content: readonly Readonly<{ id: string; title: string; publication: "draft" | "published" }> [];
    bookingStatuses: readonly CanonicalBookingStatus[];
  }>;

export type SystemReadModel = BaseReadModel &
  Readonly<{
    surface: "system";
    requestedScenarioId: string;
  }>;

export type ScenarioReadModel = PublicReadModel | CustomerReadModel | AdminReadModel | SystemReadModel;

export type ScenarioResult = Readonly<{
  version: typeof SCENARIO_ADAPTER_VERSION;
  scenarioId: string;
  state: ScenarioState;
  readModel: ScenarioReadModel;
  provenance: NonAuthoritativeProvenance;
  interaction: NonAuthoritativeInteraction;
}>;
