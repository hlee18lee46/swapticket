// app/api/loyalfan/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Tusky } from "@tusky-io/ts-sdk";

const ARTIST_COIN: Record<string, string> = {
  SABR: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::sabr::SABR`,
  BILL: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bill::BILL`,
  BTS:  `${process.env.NEXT_PUBLIC_PACKAGE_ID}::bts::BTS`,
  MARO: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::maro::MARO`,
};

// u64 bounds
const U64_MAX = 18446744073709551615n;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const seller  = form.get("seller");
    const title   = form.get("title");
    const desc    = form.get("description");
    const artist  = form.get("artist");                  // SABR | BILL | BTS | MARO
    const priceS  = form.get("priceMist") ?? form.get("priceUnits"); // accept either field name
    const image   = form.get("image");

    // --- auth: only configured seller can post
    const allowed = (process.env.NEXT_PUBLIC_SELLER_ADDRESS || "").toLowerCase();
    if (typeof seller !== "string" || seller.toLowerCase() !== allowed) {
      return NextResponse.json({ error: "Unauthorized seller wallet" }, { status: 403 });
    }

    // --- required fields
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }
    if (typeof desc !== "string" || !desc.trim()) {
      return NextResponse.json({ error: "Missing description" }, { status: 400 });
    }
    if (typeof artist !== "string" || !ARTIST_COIN[artist]) {
      return NextResponse.json({ error: "Invalid artist symbol" }, { status: 400 });
    }

    // --- price must be a u64 decimal string
    if (typeof priceS !== "string" || !/^\d+$/.test(priceS)) {
      return NextResponse.json({ error: "priceMist must be u64 (MIST)" }, { status: 400 });
    }
    const price = BigInt(priceS);
    if (price > U64_MAX) {
      return NextResponse.json({ error: "price exceeds u64 max" }, { status: 400 });
    }

    // --- Tusky init
    const apiKey  = process.env.TUSKY_API_KEY!;
    const vaultId = process.env.TUSKY_VAULT_ID!;
    if (!apiKey || !vaultId) {
      return NextResponse.json({ error: "Tusky env missing" }, { status: 500 });
    }
    const tusky = await Tusky.init({ apiKey });

    // (1) Optional image upload
    let imageUploadId: string | null = null;
    let imageBlobId: string | null = null;
    if (image instanceof File) {
      const buf = Buffer.from(await image.arrayBuffer());
      const up = await tusky.file.upload(vaultId, buf, {
        name: image.name || "image",
        mimeType: image.type || "application/octet-stream",
      });
      imageUploadId = up.id;
      imageBlobId   = up.blobId ?? null;
    }

    // (2) JSON doc (the actual LoyalFan post)
    const doc = {
      kind: "loyalfan",
      seller,
      artist,
      coinType: ARTIST_COIN[artist],  // pay with artist coin, not SUI
      priceUnits: price.toString(),    // u64 in *smallest units* of that coin (9 dp like SUI)
      title,
      description: desc,
      image: imageUploadId ? { uploadId: imageUploadId, blobId: imageBlobId } : null,
      createdAt: new Date().toISOString(),
      network: process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet",
    };

    const jsonBuf = Buffer.from(JSON.stringify(doc));
    const listing = await tusky.file.upload(vaultId, jsonBuf, {
      name: `loyalfan-${artist}-${Date.now()}.json`,
      mimeType: "application/json",
    });

    return NextResponse.json(
      {
        uploadId: listing.id,
        blobId: listing.blobId ?? null,
        blobObjectId: listing.blobObjectId ?? null,
        name: listing.name,
        mimeType: listing.mimeType,
        size: listing.size,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("LoyalFan POST error:", err);
    const msg = err?.message || "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}