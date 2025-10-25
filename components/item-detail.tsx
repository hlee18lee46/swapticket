"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Clock,
  Eye,
  Calendar,
  MapPin,
  Ticket,
  CreditCard,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { TransactionModal } from "@/components/transaction-modal"

interface ListingData {
  id: string
  title: string
  type: "ticket" | "giftcard"
  price: string
  originalValue?: string
  image: string
  seller: string
  sellerReputation: number
  verified: boolean
  timeLeft?: string
  swapEnabled: boolean
  description: string
  eventDate?: string
  venue?: string
  section?: string
  brand?: string
  cardValue?: string
  listingDate: string
  views: number
}

export function ItemDetail({ listing }: { listing: ListingData }) {
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionType, setTransactionType] = useState<"buy" | "swap">("buy")

  const handleBuy = () => {
    setTransactionType("buy")
    setShowTransactionModal(true)
  }

  const handleSwap = () => {
    setTransactionType("swap")
    setShowTransactionModal(true)
  }

  const discount = listing.originalValue
    ? Math.round(
        ((Number.parseFloat(listing.originalValue) - Number.parseFloat(listing.price)) /
          Number.parseFloat(listing.originalValue)) *
          100,
      )
    : 0

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={listing.image || "/placeholder.svg"}
                alt={listing.title}
                fill
                className="object-cover"
                priority
              />
              {listing.verified && (
                <div className="absolute right-4 top-4">
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seller Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {listing.seller.slice(2, 4).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-mono text-sm">
                        {listing.seller.slice(0, 10)}...{listing.seller.slice(-4)}
                      </div>
                      <div className="text-xs text-muted-foreground">Member since Jan 2024</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{listing.sellerReputation}%</div>
                    <div className="text-xs text-muted-foreground">Reputation</div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">47</div>
                    <div className="text-xs text-muted-foreground">Sales</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">52</div>
                    <div className="text-xs text-muted-foreground">Listings</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">4.9</div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary">
                  {listing.type === "ticket" ? (
                    <>
                      <Ticket className="mr-1 h-3 w-3" />
                      Event Ticket
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-1 h-3 w-3" />
                      Gift Card
                    </>
                  )}
                </Badge>
                {listing.timeLeft && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {listing.timeLeft} left
                  </Badge>
                )}
              </div>

              <h1 className="mb-4 text-3xl font-bold text-balance">{listing.title}</h1>

              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-bold">{listing.price} ETH</div>
                {listing.originalValue && (
                  <div className="flex items-center gap-2">
                    <div className="text-lg text-muted-foreground line-through">{listing.originalValue} ETH</div>
                    <Badge variant="destructive">{discount}% off</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={handleBuy}>
                Buy Now
              </Button>
              {listing.swapEnabled && (
                <Button size="lg" variant="outline" className="flex-1 gap-2 bg-transparent" onClick={handleSwap}>
                  <ArrowLeftRight className="h-4 w-4" />
                  Propose Swap
                </Button>
              )}
            </div>

            {/* Escrow Protection Notice */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4">
                <Shield className="mt-0.5 h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">Escrow Protected Transaction</div>
                  <div className="text-sm text-muted-foreground">
                    Your payment is held in a smart contract until you confirm receipt of the item
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Tabs */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="terms" className="flex-1">
                  Terms
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
                  </CardContent>
                </Card>

                {listing.type === "ticket" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Event Date</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(listing.eventDate!).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Venue</div>
                          <div className="text-sm text-muted-foreground">{listing.venue}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Ticket className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Seat Details</div>
                          <div className="text-sm text-muted-foreground">{listing.section}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {listing.type === "giftcard" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gift Card Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Brand</div>
                          <div className="text-sm text-muted-foreground">{listing.brand}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCard className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Card Value</div>
                          <div className="text-sm text-muted-foreground">${listing.cardValue} USD</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Listing Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Views
                      </div>
                      <div className="font-medium">{listing.views}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Listed
                      </div>
                      <div className="font-medium">
                        {new Date(listing.listingDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Escrow Protection</div>
                        <div className="text-sm text-muted-foreground">
                          Payment held in smart contract until delivery confirmed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Dispute Resolution</div>
                        <div className="text-sm text-muted-foreground">24-hour dispute window after delivery</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <div className="text-sm font-medium">Verified Transfer</div>
                        <div className="text-sm text-muted-foreground">All transfers verified on-chain</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">No Refunds</div>
                        <div className="text-sm text-muted-foreground">All sales are final unless dispute is filed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <div className="text-sm">Listing created</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(listing.listingDate).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm">Price updated</div>
                        <div className="text-xs text-muted-foreground">2 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm">Verification completed</div>
                        <div className="text-xs text-muted-foreground">3 days ago</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        listing={listing}
        type={transactionType}
      />
    </>
  )
}
