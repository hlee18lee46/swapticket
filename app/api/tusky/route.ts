import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { payload, contentType } = await req.json();

    const base = process.env.NEXT_PUBLIC_TUSKY_BASE!;
    const vaultId = process.env.TUSKY_VAULT_ID!;
    const apiKey  = process.env.TUSKY_API_KEY!;

    if (!base)   return NextResponse.json({ error: "Missing NEXT_PUBLIC_TUSKY_BASE" }, { status: 400 });
    if (!vaultId)return NextResponse.json({ error: "Missing TUSKY_VAULT_ID" }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "Missing TUSKY_API_KEY" }, { status: 400 });

    // Tusky vault asset upload endpoint
    const url = new URL(`/api/v1/vaults/${vaultId}/assets`, base).toString();

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": contentType ?? "application/json",
        "x-api-key": apiKey,                 // <- Tusky expects API key header
      },
      body:
        contentType === "application/json" || !contentType
          ? JSON.stringify(payload)
          : (payload as any),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: `Tusky upstream ${res.status}: ${text || res.statusText}` },
        { status: 502 },
      );
    }

    // Typical response: { id, url, ... }
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ data: text });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}