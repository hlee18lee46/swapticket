// components/TicketHub.tsx
"use client";

import { useEffect, useState } from "react";
import { mistToSui } from "@/utils/format";
import { BuyButton } from "@/components/BuyButton";

type ListingRow = {
  uploadId: string;
  blobId: string | null;
  name: string;
  createdAt: string;
  size: number;
  ticketId: string;
  priceMist: string;
};

export function TicketHub() {
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tusky/listings", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRows(data.items || []);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm">Loading ticket hub…</p>;
  if (err) return <p className="text-sm text-destructive">Error: {err}</p>;
  if (!rows.length) return <p className="text-sm">No listings yet.</p>;

  return (
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className