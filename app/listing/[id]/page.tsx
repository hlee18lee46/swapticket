import { MarketplaceHeader } from "@/components/marketplace-header"
import { ItemDetail } from "@/components/item-detail"
import { notFound } from "next/navigation"

// Mock data - in production this would come from blockchain/database
const listings = {
  "1": {
    id: "1",
    title: "Taylor Swift Eras Tour - 2 Floor Seats",
    type: "ticket" as const,
    price: "0.5",
    originalValue: "0.8",
    image: "/concert-tickets.jpg",
    seller: "0x742d35a3f8b5c9e1d2a4b6c8e0f2a4b6c8e0f2a4",
    sellerReputation: 98,
    verified: true,
    timeLeft: "2d 5h",
    swapEnabled: true,
    description:
      "Two premium floor seats for Taylor Swift's Eras Tour. Section A, Row 5, Seats 12-13. These are authentic tickets with full transfer capability. Perfect view of the stage with no obstructions.",
    eventDate: "2025-08-15",
    venue: "MetLife Stadium, East Rutherford, NJ",
    section: "Floor Section A, Row 5, Seats 12-13",
    listingDate: "2025-01-15",
    views: 342,
  },
  "2": {
    id: "2",
    title: "Amazon Gift Card - $500",
    type: "giftcard" as const,
    price: "0.15",
    originalValue: "0.18",
    image: "/amazon-gift-card.png",
    seller: "0x8f3c92b1a5d7e9f3c5a7b9d1e3f5a7b9d1e3f5a7",
    sellerReputation: 95,
    verified: true,
    timeLeft: "1d 12h",
    swapEnabled: false,
    description:
      "Unused Amazon gift card with $500 balance. Code will be provided immediately after escrow confirmation. Can be used for any Amazon purchase.",
    brand: "Amazon",
    cardValue: "500",
    listingDate: "2025-01-18",
    views: 189,
  },
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = listings[params.id as keyof typeof listings]

  if (!listing) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />
      <ItemDetail listing={listing} />
    </div>
  )
}
