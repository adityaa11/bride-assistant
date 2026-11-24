"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const client = createAuthClient();

export function SignOutButton({ destination, className, role }: { destination: string; className?: string; role?: "menuitem" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return <button className={className} disabled={busy} role={role} onClick={async () => {
    setBusy(true);
    try {
      const result = await client.signOut();
      if (!result.error) {
        router.replace(destination);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }} type="button">{busy ? "Keluar…" : "Keluar"}</button>;
}
