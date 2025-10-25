// app/admin/page.tsx
"use client";

import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectButton } from "@mysten/dapp-kit";
import { AdminMintAll } from "@/components/admin-mint-all";

export default function AdminPage() {
  const account = useCurrentAccount();
  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();

  const isAdmin = account?.address
    ? account.address.toLowerCase() === adminAddress
    : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin – Mint Tickets</h1>
          <ConnectButton connectText="Connect admin wallet" />
        </div>

        {!account?.address && (
          <p className="text-muted-foreground">
            Connect a wallet to continue.
          </p>
        )}

        {account?.address && !isAdmin && (
          <div className="rounded-lg border p-4">
            <p className="font-medium mb-1">Not authorized</p>
            <p className="text-sm text-muted-foreground">
              Connected wallet:
              <br />
              <span className="font-mono">{account.address}</span>
              <br />
              doesn’t match <code>NEXT_PUBLIC_ADMIN_ADDRESS</code>.
            </p>
          </div>
        )}

        {account?.address && isAdmin && (
          <div className="rounded-xl border p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Mints 10 tickets for each of 4 artists to the seller wallet defined
              in <code>NEXT_PUBLIC_SELLER_ADDRESS</code>.
            </p>
            <AdminMintAll />
          </div>
        )}
      </div>
    </div>
  );
}