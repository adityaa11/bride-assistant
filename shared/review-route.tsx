type ReviewAudience = "public" | "customer" | "admin";

const labels: Record<ReviewAudience, string> = {
  public: "Public",
  customer: "Customer",
  admin: "Admin",
};

export function ReviewRoute({ audience }: Readonly<{ audience: ReviewAudience }>) {
  return (
    <main>
      <h1>{labels[audience]} fixture review route</h1>
      <p>Fixture UI composition will be added in later M1 tickets.</p>
      <p>This review build is non-authoritative and performs no account, data, or service operation.</p>
    </main>
  );
}
