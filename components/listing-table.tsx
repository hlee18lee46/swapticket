"use client";

import { useEffect, useState } from "react";

export function ListingTable() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/listings");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setListings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading listings…</p>;
  if (error) return <p className="text-destructive">Error: {error}</p>;
  if (!listings.length) return <p className="text-muted-foreground">No listings found.</p>;

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-muted text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Blob ID</th>
            <th className="p-3">Size</th>
            <th className="p-3">Created At</th>
          </tr>
        </thead>
        <tbody>
          {listings.map(l => (
            <tr key={l.id} className="border-t hover:bg-accent/20">
              <td className="p-3">{l.name}</td>
              <td className="p-3 font-mono text-xs break-all">{l.blobId ?? "pending…"}</td>
              <td className="p-3">{(l.size / 1024).toFixed(1)} KB</td>
              <td className="p-3">
                {l.createdAt ? new Date(Number(l.createdAt)).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}