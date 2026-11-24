import "server-only";
import type { DocumentStore } from "@/shared/document-store";

export const proofPolicyVersion = "H-M2-07-TECH/2.0" as const;
export const decisionIds = ["pdpBasisNoticeContact", "scannerProviderTerms", "holdCriteria", "neonRpoRtoBackupRestoreOwner", "indonesianTenYearRetentionDetermination"] as const;
export type DecisionId = typeof decisionIds[number];
export type Decision = Readonly<{ value: string; owner: string; date: string; evidence: string }> | null;
export type DecisionLedger = Readonly<Record<DecisionId, Decision>>;
export type Environment = "development" | "test" | "production";
export type Duration = Readonly<{ months: number; years: number }> | Readonly<{ minutes: number }>;
export type Profile = Readonly<{
  environment: Environment;
  duration: Duration;
  adapter: "local-disposable" | "neon-private";
  database: "local-disposable" | "neon-production";
  objectStore: "local-disposable" | "neon-production";
  credentials: "none" | "production";
  data: "synthetic" | "real";
  clock: "controlled" | "system";
}>;
const trustedIdentityBrand: unique symbol = Symbol("trusted deployment identity");
export type TrustedIdentity = Readonly<{ environment: Environment; [trustedIdentityBrand]: true }>;
// This constructor belongs at a trusted deployment boundary, never to request data.
export function identityFromDeployment(environment: Environment): TrustedIdentity {
  if (!["development", "test", "production"].includes(environment)) throw new Error("UNKNOWN_ENVIRONMENT");
  return Object.freeze({ environment, [trustedIdentityBrand]: true as const });
}
const runtimeBrand: unique symbol = Symbol("validated proof policy");
export type RuntimePolicy = Readonly<{ version: typeof proofPolicyVersion; duration: Duration; production: boolean; [runtimeBrand]: true }>;
export type Validation = Readonly<{ ok: true; runtime: RuntimePolicy }> | Readonly<{ ok: false; reasons: string[] }>;
const productionDuration: Duration = { months: 8, years: 0 };
export function validateProfile(identity: TrustedIdentity, profile: Profile, decisions: DecisionLedger): Validation {
  const reasons: string[] = [];
  if (!identity || !profile) return { ok: false, reasons: ["ENVIRONMENT_MISMATCH"] };
  if (!identity || identity[trustedIdentityBrand] !== true || !["development", "test", "production"].includes(identity.environment) || profile.environment !== identity.environment) reasons.push("ENVIRONMENT_MISMATCH");
  if (identity.environment === "production") {
    if (JSON.stringify(profile.duration) !== JSON.stringify(productionDuration)) reasons.push("PRODUCTION_DURATION");
    if (profile.adapter !== "neon-private" || profile.database !== "neon-production" || profile.objectStore !== "neon-production") reasons.push("PRODUCTION_ADAPTER");
    if (profile.credentials !== "production" || profile.data !== "real" || profile.clock !== "system") reasons.push("PRODUCTION_ISOLATION");
    for (const id of decisionIds) {
      const decision = decisions[id];
      if (!decision?.value || !decision.owner || !decision.date || !decision.evidence) reasons.push(`MISSING_${id}`);
    }
  } else if (identity.environment === "development" || identity.environment === "test") {
    if (profile.adapter !== "local-disposable" || profile.database !== "local-disposable" || profile.objectStore !== "local-disposable" || profile.credentials !== "none" || profile.data !== "synthetic") reasons.push("NONPRODUCTION_ISOLATION");
    if (profile.clock !== "controlled") reasons.push("NONPRODUCTION_CLOCK");
    if (!("minutes" in profile.duration && profile.duration.minutes > 0) && JSON.stringify(profile.duration) !== JSON.stringify(productionDuration)) reasons.push("INVALID_DURATION");
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, runtime: Object.freeze({ version: proofPolicyVersion, duration: profile.duration, production: identity.environment === "production", [runtimeBrand]: true as const }) };
}
export function readiness(input: { technicalReady: boolean; policyApproved: boolean; operationalReady: boolean; activationAuthorized: boolean; validation: Validation }) {
  const technicalReady = input.technicalReady;
  const policyApproved = technicalReady && input.policyApproved && input.validation.ok;
  const operationalReady = policyApproved && input.operationalReady;
  return { technicalReady, policyApproved, operationalReady, activationAuthorized: operationalReady && input.activationAuthorized };
}
export type ScannerOutcome = "clean" | "infected" | "unavailable" | "timeout";
export function scannerDisposition(outcome: ScannerOutcome): "eligible" | "quarantined" {
  return outcome === "clean" ? "eligible" : "quarantined";
}
export type Proof = Readonly<{ id: string; storageKey: string; uploadedAt: string; finalReviewedAt?: string; classification: "operational" | "statutory" | "unknown"; statutoryStartAt?: string; activeHold: boolean; scan: ScannerOutcome }>;
export type ProofPorts = Readonly<{
  bytes: Pick<DocumentStore, "read"> & { remove(storageKey: string, collection: "payment-proofs"): Promise<boolean> };
  list(): Promise<Proof[]>;
  removeMetadataAndAudit(id: string): Promise<void>;
  recordDeletion(id: string): Promise<void>;
}>;
function addCalendar(origin: string, duration: Duration): number {
  const date = new Date(origin);
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_START_EVENT");
  if ("minutes" in duration) return date.getTime() + duration.minutes * 60_000;
  const month = date.getUTCMonth() + duration.months + duration.years * 12;
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), month + 1, 0)).getUTCDate();
  return Date.UTC(date.getUTCFullYear(), month, Math.min(date.getUTCDate(), lastDay), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
}
export function expiryAt(proof: Proof, runtime: RuntimePolicy): number | null {
  if (proof.activeHold || scannerDisposition(proof.scan) !== "eligible" || proof.classification === "unknown") return null;
  if (proof.classification === "statutory") return proof.statutoryStartAt ? addCalendar(proof.statutoryStartAt, { months: 0, years: 10 }) : null;
  return addCalendar(proof.finalReviewedAt ?? proof.uploadedAt, runtime.duration);
}
export async function runProofLifecycle(runtime: RuntimePolicy, ports: ProofPorts, now: Date): Promise<string[]> {
  if (runtime?.[runtimeBrand] !== true) throw new Error("UNVALIDATED_PROOF_POLICY");
  const deleted: string[] = [];
  for (const proof of await ports.list()) {
    const expiry = expiryAt(proof, runtime);
    if (expiry === null || now.getTime() < expiry) continue;
    // A retry may find bytes already removed by an interrupted prior pass.
    if (!await ports.bytes.remove(proof.storageKey, "payment-proofs") && await ports.bytes.read(proof.storageKey)) throw new Error("BYTE_REMOVAL_FAILED");
    await ports.removeMetadataAndAudit(proof.id);
    await ports.recordDeletion(proof.id);
    deleted.push(proof.id);
  }
  return deleted;
}
