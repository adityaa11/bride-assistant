import type { ScenarioState } from "@/shared/scenarios/contracts";
import type { ReactNode } from "react";

export function StatusNotice({ state }: Readonly<{ state: ScenarioState }>) {
  const label = state.kind === "success" ? "Ready for review" : `${state.kind} review state`;

  return <div className={`status status-${state.kind}`} role={state.kind === "error" ? "alert" : "status"} aria-live="polite"><div><strong>{label}</strong><p>{state.message}</p></div></div>;
}

export function EmptyState({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="empty-copy">{children}</p>;
}

export function FixtureForm({ scenarioId }: Readonly<{ scenarioId: string }>) {
  return <form className="fixture-form" aria-label="Fixture review controls"><label htmlFor="scenario-id">Scenario identifier</label><input id="scenario-id" value={scenarioId} readOnly /><small>Fixture controls are presentation-only and cannot perform an operation.</small><div className="review-actions"><button className="button-primary" type="button" disabled>Fixture action only</button><button className="button-secondary" type="button">Review details</button></div></form>;
}
