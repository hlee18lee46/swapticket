"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Wallet,
  Edit,
  Trash2,
  Eye,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

// Mock data
const userStats = {
  totalSales: 47,
  activeListing: 8,
  totalEarnings: "12.4",
  reputation: 98,
}

const activeListings = [
  {
    id: "1",
    title: "Taylor Swift Eras Tour - 2 Floor Seats",
    price: "0.5",
    image: "/concert-tickets.jpg",
    views: 342,
    status: "active",
    timeLeft: "2d 5h",
  },
  {
    id: "2",
    title: "Amazon Gift Card - $500",
    price: "0.15",
    image: "/amazon-gift-card.png",
    views: 189,
    status: "active",
    timeLeft: "1d 12h",
  },
]

const transactions = [
  {
    id: "tx1",
    type: "sale",
    item: "NBA Finals Game 7 - Courtside",
    amount: "1.2",
    buyer: "0x1a2b...4c5d",
    status: "completed",
    date: "2025-01-20",
  },
  {
    id: "tx2",
    type: "purchase",
    item: "Starbucks Gift Card - $100",
    amount: "0.03",
    seller: "0x9e8d...7f6a",
    status: "in-escrow",
    date: "2025-01-19",
  },
  {
    id: "tx3",
    type: "sale",
    item: "Coachella 2025 - VIP Weekend Pass",
    amount: "0.75",
    buyer: "0x3c4d...5e6f",
    status: "pending",
    date: "2025-01-18",
  },
]

const swapProposals = [
  {
    id: "swap1",
    from: "0x8f3c...92b1",
    offering: "Super Bowl Tickets - 2 Seats",
    requesting: "Taylor Swift Eras Tour - 2 Floor Seats",
    status: "pending",
    date: "2025-01-21",
  },
  {
    id: "swap2",
    from: "0x6g7h...8i9j",
    offering: "Apple Store Gift Card - $250",
    requesting: "Amazon Gift Card - $500",
    status: "rejected",
    date: "2025-01-19",
  },
]

export function DashboardTabs() {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalSales}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.activeListing}</div>
            <p className="text-xs text-muted-foreground">Across marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalEarnings} ETH</div>
            <p className="text-xs text-muted-foreground">≈ $24,800 USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reputation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.reputation}%</div>
            <p className="text-xs text-muted-foreground">Excellent standing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="swaps">Swap Proposals</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* My Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Active Listings</h2>
              <p className="text-sm text-muted-foreground">{activeListings.length} items currently listed</p>
            </div>
            <Button asChild>
              <Link href="/create">Create New Listing</Link>
            </Button>
          </div>

          <div className="space-y-4">
            {activeListings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={listing.image || "/placeholder.svg"}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="mb-1 flex items-start justify-between">
                          <h3 className="font-semibold text-balance">{listing.title}</h3>
                          <Badge variant="secondary">{listing.status}</Badge>
                        </div>
                        <div className="mb-2 text-xl font-bold">{listing.price} ETH</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {listing.views} views
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {listing.timeLeft} left
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 bg-transparent text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">View all your purchases and sales</p>
          </div>

          <div className="space-y-4">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.type === "sale" ? "bg-primary/10" : "bg-secondary"
                        }`}
                      >
                        {tx.type === "sale" ? (
                          <ArrowUpRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ShoppingCart className="h-5 w-5 text-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{tx.item}</div>
                        <div className="text-sm text-muted-foreground">
                          {tx.type === "sale" ? `Buyer: ${tx.buyer}` : `Seller: ${tx.seller}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{tx.amount} ETH</div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tx.status === "completed" ? "default" : tx.status === "in-escrow" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {tx.status === "completed" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {tx.status === "in-escrow" && <Clock className="mr-1 h-3 w-3" />}
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(tx.date).toLocaleDateString()}</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Swap Proposals Tab */}
        <TabsContent value="swaps" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Swap Proposals</h2>
            <p className="text-sm text-muted-foreground">Manage incoming and outgoing swap requests</p>
          </div>

          <div className="space-y-4">
            {swapProposals.map((swap) => (
              <Card key={swap.id}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From:</span>
                        <span className="font-mono text-sm">{swap.from}</span>
                      </div>
                      <Badge variant={swap.status === "pending" ? "secondary" : "outline"} className="text-xs">
                        {swap.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(swap.date).toLocaleDateString()}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-1 text-xs text-muted-foreground">They're offering:</div>
                      <div className="font-medium">{swap.offering}</div>
                    </div>
                    <div className="flex justify-center">
                      <div className="rounded-full bg-muted p-2">
                        <ArrowUpRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="mb-1 text-xs text-muted-foreground">For your:</div>
                      <div className="font-medium">{swap.requesting}</div>
                    </div>
                  </div>

                  {swap.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline
                      </Button>
                      <Button className="flex-1">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
              <CardDescription>Your connected wallet and reputation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-2xl text-primary-foreground">0x</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="mb-1 font-mono text-sm">0x742d35a3f8b5c9e1d2a4b6c8e0f2a4b6c8e0f2a4</div>
                  <div className="text-sm text-muted-foreground">Member since January 2024</div>
                </div>
                <Button variant="outline" className="bg-transparent">
                  Disconnect
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{userStats.totalSales}</div>
                  <div className="text-sm text-muted-foreground">Total Sales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">52</div>
                  <div className="text-sm text-muted-foreground">Total Listings</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">4.9</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reputation Score</CardTitle>
              <CardDescription>Your marketplace standing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-primary">{userStats.reputation}%</div>
                  <div className="text-sm text-muted-foreground">Excellent standing</div>
                </div>
                <Badge variant="secondary" className="text-lg">
                  Verified Seller
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Successful transactions</span>
                  <span className="font-medium">47/48</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response time</span>
                  <span className="font-medium">{"< 2 hours"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dispute rate</span>
                  <span className="font-medium">0.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">New offers on your listings</div>
                  <div className="text-sm text-muted-foreground">Get notified when someone makes an offer</div>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Enabled
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Transaction updates</div>
                  <div className="text-sm text-muted-foreground">Updates on your purchases and sales</div>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Enabled
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Swap proposals</div>
                  <div className="text-sm text-muted-foreground">When someone proposes a swap</div>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent">
                  Enabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
