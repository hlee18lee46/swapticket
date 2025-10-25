"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { registerEnokiWallets } from "@mysten/enoki";
import "@mysten/dapp-kit/dist/index.css";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
});

function RegisterEnoki({ network = "testnet" as const }) {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!apiKey || !googleClientId) return;

    const origin = window.location.origin; // e.g., http://localhost:3000
    const client = new SuiClient({ url: getFullnodeUrl(network) });

    const { unregister } = registerEnokiWallets({
      client,
      network,
      apiKey,
      providers: {
        google: {
          clientId: googleClientId,
          redirectUrl: `${origin}/auth`,  // must match Google Console URIs
        },
      },
    });
    return unregister;
  }, [network]);
  return null;
}

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <RegisterEnoki network="testnet" />
        <WalletProvider autoConnect slushWallet={{ name: "SwapChain" }}>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}