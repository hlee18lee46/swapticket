"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Upload, Info } from "lucide-react"

export function ListingForm() {
  const [listingType, setListingType] = useState<"ticket" | "giftcard">("ticket")
  const [swapEnabled, setSwapEnabled] = useState(false)

  return (
    <form className="space-y-6">
      {/* Listing Type */}
      <Card>
        <CardHeader>
          <CardTitle>Listing Type</CardTitle>
          <CardDescription>What are you selling?</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={listingType} onValueChange={(value) => setListingType(value as "ticket" | "giftcard")}>
            <div className="flex items-center space-x-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
              <RadioGroupItem value="ticket" id="ticket" />
              <Label htmlFor="ticket" className="flex-1 cursor-pointer">
                <div className="font-medium">Event Ticket</div>
                <div className="text-sm text-muted-foreground">Concert, sports, theater, or other event tickets</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
              <RadioGroupItem value="giftcard" id="giftcard" />
              <Label htmlFor="giftcard" className="flex-1 cursor-pointer">
                <div className="font-medium">Gift Card</div>
                <div className="text-sm text-muted-foreground">Store credit, vouchers, or prepaid cards</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Provide details about your listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={
                listingType === "ticket" ? "Taylor Swift Eras Tour - 2 Floor Seats" : "Amazon Gift Card - $500"
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the item, including any restrictions or special conditions..."
              rows={4}
            />
          </div>

          {listingType === "ticket" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Event Date</Label>
                  <Input id="event-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input id="venue" placeholder="Madison Square Garden" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section/Seat Details</Label>
                <Input id="section" placeholder="Floor Section A, Row 5, Seats 12-13" />
              </div>
            </>
          )}

          {listingType === "giftcard" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand/Store</Label>
                <Input id="brand" placeholder="Amazon, Starbucks, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-value">Card Value (USD)</Label>
                <Input id="card-value" type="number" placeholder="500" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>Set your asking price in ETH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Asking Price (ETH)</Label>
              <Input id="price" type="number" step="0.01" placeholder="0.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="original-value">Original Value (ETH)</Label>
              <Input id="original-value" type="number" step="0.01" placeholder="0.8" />
              <p className="text-xs text-muted-foreground">Optional: Show buyers the discount</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Enable Swap Option</div>
                <div className="text-sm text-muted-foreground">
                  Allow buyers to propose trades with their own listings
                </div>
              </div>
            </div>
            <Switch checked={swapEnabled} onCheckedChange={setSwapEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Upload Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>Upload photos of your {listingType === "ticket" ? "tickets" : "gift card"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 transition-colors hover:bg-muted/50">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            <Button variant="outline" size="sm" className="mt-4 bg-transparent">
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1 bg-transparent">
          Preview
        </Button>
        <Button type="submit" className="flex-1">
          Create Listing
        </Button>
      </div>
    </form>
  )
}
