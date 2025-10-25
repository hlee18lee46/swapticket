// lib/sui.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const net = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";
export const sui = new SuiClient({ url: getFullnodeUrl(net as "testnet" | "mainnet" | "devnet") });