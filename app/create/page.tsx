import { MarketplaceHeader } from "@/components/marketplace-header"
import { ListingForm } from "@/components/listing-form"

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Create New Listing</h1>
            <p className="text-muted-foreground">List your tickets or gift cards on the blockchain marketplace</p>
          </div>

          <ListingForm />
        </div>
      </div>
    </div>
  )
}
