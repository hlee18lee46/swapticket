import { MarketplaceHeader } from "@/components/marketplace-header";
import { LoyalFanForm } from "@/components/loyalfan-form";

export default function LoyalFanPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold">LoyalFan Goods</h1>
        <p className="mb-8 text-muted-foreground">
          Post special goods or tickets tied to your artist coins (SABR, BILL, BTS, MARO).
        </p>
        <LoyalFanForm />
      </div>
    </div>
  );
}