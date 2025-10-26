import { MarketplaceHeader } from "@/components/marketplace-header"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, TrendingUp, Shield, Zap } from "lucide-react"

// Mock data for listings
const listings = [
  {
    id: "1",
    title: "Taylor Swift Eras Tour - 2 Floor Seats",
    type: "ticket" as const,
    price: "0.5 ETH",
    originalValue: "0.8 ETH",
    image: "/concert-tickets.jpg",
    seller: "0x742d...35a3",
    verified: true,
    timeLeft: "2d 5h",
    swapEnabled: true,
  },
  {
    id: "2",
    title: "Amazon Gift Card - $500",
    type: "giftcard" as const,
    price: "0.15 ETH",
    originalValue: "0.18 ETH",
    image: "/amazon-gift-card.png",
    seller: "0x8f3c...92b1",
    verified: true,
    timeLeft: "1d 12h",
    swapEnabled: false,
  },
  {
    id: "3",
    title: "NBA Finals Game 7 - Courtside",
    type: "ticket" as const,
    price: "1.2 ETH",
    image: "/lively-basketball-game.png",
    seller: "0x1a2b...4c5d",
    verified: true,
    timeLeft: "5h 30m",
    swapEnabled: true,
  },
  {
    id: "4",
    title: "Starbucks Gift Card - $100",
    type: "giftcard" as const,
    price: "0.03 ETH",
    originalValue: "0.035 ETH",
    image: "/starbucks-gift-card.jpg",
    seller: "0x9e8d...7f6a",
    verified: false,
    swapEnabled: false,
  },
  {
    id: "5",
    title: "Coachella 2025 - VIP Weekend Pass",
    type: "ticket" as const,
    price: "0.75 ETH",
    image: "/vibrant-music-festival.png",
    seller: "0x3c4d...5e6f",
    verified: true,
    timeLeft: "3d 8h",
    swapEnabled: true,
  },
  {
    id: "6",
    title: "Apple Store Gift Card - $250",
    type: "giftcard" as const,
    price: "0.08 ETH",
    image: "/apple-gift-card.png",
    seller: "0x6g7h...8i9j",
    verified: true,
    swapEnabled: false,
  },
]

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-balance md:text-5xl lg:text-6xl">
              Loyal Platform bridging fans and their <span className="text-primary">Artists</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground text-balance md:text-xl">
              Loyalty platform Powered by Artist custom coins, collect BILL, BTS, MARO, SABR
            </p>

            {/* Search Bar */}
            <div className="mx-auto mb-8 flex max-w-2xl gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search tickets, gift cards, events..." className="h-12 pl-10 pr-4" />
              </div>
              <Button size="lg" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-4">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Escrow Protected</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-4">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Instant Settlement</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Fair Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
