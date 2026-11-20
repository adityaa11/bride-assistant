import { scenarioCatalogue } from "@/shared/scenarios/catalogue";
import {
  SCENARIO_ADAPTER_VERSION,
  type NonAuthoritativeInteraction,
  type NonAuthoritativeProvenance,
  type ScenarioResult,
} from "@/shared/scenarios/contracts";

export type ScenarioId = keyof typeof scenarioCatalogue;

const provenance: NonAuthoritativeProvenance = {
  kind: "fixture",
  label: "Non-authoritative fixture — no session, persistence, or official transition.",
};

const interaction: NonAuthoritativeInteraction = {
  kind: "not-authoritative",
  summary: "This review result performs no account, data, WhatsApp, or service operation.",
};

export function getScenario(scenarioId: ScenarioId): ScenarioResult;
export function getScenario(scenarioId: string): ScenarioResult;
export function getScenario(scenarioId: string): ScenarioResult {
  const scenario = scenarioCatalogue[scenarioId as ScenarioId];

  if (!scenario) {
    return {
      version: SCENARIO_ADAPTER_VERSION,
      scenarioId,
      state: { kind: "error", message: "The requested review scenario was not found.", nextReviewAction: "Choose a declared fixture scenario." },
      readModel: { surface: "system", title: "Scenario unavailable", description: "No fixture data is available for this scenario.", requestedScenarioId: scenarioId },
      provenance,
      interaction,
    };
  }

  return { version: SCENARIO_ADAPTER_VERSION, scenarioId, ...scenario, provenance, interaction };
}
