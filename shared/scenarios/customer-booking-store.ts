"use client";

import type { CustomerBookingRecord } from "./contracts";
import { useEffect, useState } from "react";

const storageKey = "ranur.customer-booking-fixtures.v1";

export function readCreatedBookingFixtures(): CustomerBookingRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? (parsed as CustomerBookingRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveCreatedBookingFixture(record: CustomerBookingRecord) {
  const records = [...readCreatedBookingFixtures(), record];
  window.localStorage.setItem(storageKey, JSON.stringify(records));
  window.dispatchEvent(new Event("ranur-booking-fixtures-changed"));
}

export function bookingFixtureId(createdCount: number, defaultCount = 2) {
  return `BR-2026-${String(defaultCount + createdCount + 1).padStart(3, "0")}`;
}

export function useCustomerBookingRecords(
  baseRecords: readonly CustomerBookingRecord[],
) {
  const [createdRecords, setCreatedRecords] = useState<CustomerBookingRecord[]>(
    [],
  );

  useEffect(() => {
    const refresh = () => setCreatedRecords(readCreatedBookingFixtures());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("ranur-booking-fixtures-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("ranur-booking-fixtures-changed", refresh);
    };
  }, []);

  return [...baseRecords, ...createdRecords];
}
