import { MarketplaceHeader } from "@/components/marketplace-header"
import { DashboardTabs } from "@/components/dashboard-tabs"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your listings, transactions, and account</p>
        </div>

        <DashboardTabs />
      </div>
    </div>
  )
}
