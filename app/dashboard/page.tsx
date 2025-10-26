import { MarketplaceHeader } from "@/components/marketplace-header";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { ListingTable } from "@/components/listing-table";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <div className="container mx-auto px-4 py-8 space-y-10">
        <header>
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Marketplace for tickets
          </p>
        </header>

        <section>
          <h2 className="text-xl font-semibold mb-3">Ticket Hub</h2>
          <ListingTable />
        </section>
      </div>
    </div>
  );
}