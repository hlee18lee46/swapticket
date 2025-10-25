"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet, User } from "lucide-react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { useMounted } from "@/hooks/use-mounted";

function shortAddr(addr?: string, head = 6, tail = 4) {
  if (!addr) return "";
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function MarketplaceHeader() {
  const mounted = useMounted();
  const account = useCurrentAccount(); // null until connected (and sometimes on first client frame)

  const label = !mounted
    ? "Connect Wallet"
    : account
    ? shortAddr(account.address)
    : "Connect Wallet";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <div className="h-4 w-4 rounded-sm bg-primary" />
            </div>
            <span className="text-xl font-bold">SwapChain</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Marketplace
            </Link>
            <Link
              href="/create"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Create Listing
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Modal picker, but our trigger displays address if connected */}
          <ConnectModal
            trigger={
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" disabled={!mounted}>
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline" suppressHydrationWarning>
                  {label}
                </span>
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            title={account?.address ?? "Not connected"}
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}