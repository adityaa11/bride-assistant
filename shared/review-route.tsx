import { getScenario, type ScenarioId } from "@/shared/scenarios/adapter";

export function ReviewRoute({ scenarioId }: Readonly<{ scenarioId: ScenarioId }>) {
  const scenario = getScenario(scenarioId);

  return (
    <main data-scenario-id={scenario.scenarioId} data-scenario-version={scenario.version}>
      <h1>{scenario.readModel.title}</h1>
      <p>{scenario.readModel.description}</p>
      <p>Review state: {scenario.state.kind}</p>
      <p>{scenario.provenance.label}</p>
      <p>{scenario.interaction.summary}</p>
    </main>
  );
}
