"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { registerEnokiWallets } from "@mysten/enoki";
import "@mysten/dapp-kit/dist/index.css";

// 1) Networks
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  // mainnet: { url: getFullnodeUrl("mainnet") },
});

// 2) Registers Enoki Google wallet alongside Slush & other wallets
function RegisterEnoki({ network = "testnet" as const }) {
  useEffect(() => {
    // Require env vars (frontend-safe)
    const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!apiKey || !googleClientId) return;

    const client = new SuiClient({ url: getFullnodeUrl(network) });
    const { unregister } = registerEnokiWallets({
      client,
      network,                 // "testnet" or "mainnet"
      apiKey,                  // from Enoki portal (public key)
      providers: {
        google: { clientId: googleClientId }, // Google OAuth client id
      },
    });
    return unregister;
  }, []);

  return null;
}

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        {/* Register Enoki Google wallet */}
        <RegisterEnoki network="testnet" />

        {/* Enable Slush + autoConnect.
            Slush will appear next to Enoki in dapp-kit’s wallet picker. */}
        <WalletProvider
          autoConnect
          slushWallet={{ name: "SwapChain" }}  // shows Slush (extension/web)
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}