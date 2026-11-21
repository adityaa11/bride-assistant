export const SCENARIO_ADAPTER_VERSION = "m1-fixture-v1" as const;

export type Surface = "public" | "customer" | "customer-auth" | "admin" | "system";

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
    publishedContent: readonly PublishedContent[];
    packages: readonly PublicPackage[];
    promotions: readonly PublishedPromotion[];
  }>;

export type PublishedContent = Readonly<{
  id: string;
  title: string;
  body: string;
  kind: "story" | "event";
}>;

export type PublicPackage = Readonly<{
  id: string;
  category: string;
  title: string;
  duration: string;
  description: string;
  inclusions: readonly string[];
  featured: boolean;
}>;

export type PublishedPromotion = Readonly<{
  id: string;
  title: string;
  description: string;
  value: string;
  endsOn: string;
}>;

export type CustomerReadModel = BaseReadModel &
  Readonly<{
    surface: "customer";
    bookings: readonly Readonly<{ id: string; status: CanonicalBookingStatus }> [];
    availability: readonly Readonly<{ date: string; state: "available" | "unavailable" }> [];
    bookingRequest?: Readonly<{
      packages: readonly Readonly<{ id: string; name: string; duration: string; description: string }> [];
      selectedDate?: string;
    }>;
    bookingHistory?: Readonly<{
      records: readonly CustomerBookingRecord[];
    }>;
  }>;

export type CustomerBookingRecord = Readonly<{
  id: string;
  status: CanonicalBookingStatus;
  packageName: string;
  duration: string;
  packageDescription: string;
  inclusions: readonly string[];
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  submittedAt: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  notes: string;
}>;

export type CustomerAuthReadModel = BaseReadModel &
  Readonly<{
    surface: "customer-auth";
    mode: "register" | "sign-in";
    fields: readonly ("name" | "email")[];
    feedback?: string;
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

export type ScenarioReadModel = PublicReadModel | CustomerReadModel | CustomerAuthReadModel | AdminReadModel | SystemReadModel;

export type ScenarioResult = Readonly<{
  version: typeof SCENARIO_ADAPTER_VERSION;
  scenarioId: string;
  state: ScenarioState;
  readModel: ScenarioReadModel;
  provenance: NonAuthoritativeProvenance;
  interaction: NonAuthoritativeInteraction;
}>;
