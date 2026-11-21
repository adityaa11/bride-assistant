import { CustomerHome } from "@/shared/customer-home";

export default async function CustomerHomeStateFixturePage({
  params,
}: Readonly<{ params: Promise<{ state: string }> }>) {
  const { state } = await params;
  return (
    <CustomerHome
      scenarioId={
        state === "empty" ? "customer.home-empty" : "customer.home-success"
      }
    />
  );
}
