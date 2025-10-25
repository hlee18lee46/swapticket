"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Loader2, CheckCircle2 } from "lucide-react"

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: {
    title: string
    price: string
    type: "ticket" | "giftcard"
  }
  type: "buy" | "swap"
}

export function TransactionModal({ open, onOpenChange, listing, type }: TransactionModalProps) {
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm")

  const handleConfirm = () => {
    setStep("processing")
    // Simulate transaction processing
    setTimeout(() => {
      setStep("success")
    }, 3000)
  }

  const handleClose = () => {
    setStep("confirm")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>{type === "buy" ? "Confirm Purchase" : "Propose Swap"}</DialogTitle>
              <DialogDescription>
                {type === "buy"
                  ? "Review your purchase details before confirming"
                  : "Select an item to swap and submit your proposal"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 text-sm text-muted-foreground">
                  {type === "buy" ? "You're buying" : "You're offering"}
                </div>
                <div className="font-medium text-balance">{listing.title}</div>
                <div className="mt-2 text-2xl font-bold">{listing.price} ETH</div>
              </div>

              {type === "swap" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="swap-item">Your Item to Swap</Label>
                    <Input id="swap-item" placeholder="Select from your listings..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swap-message">Message to Seller (Optional)</Label>
                    <Input id="swap-message" placeholder="Add a note about your swap proposal..." />
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Item Price</span>
                  <span className="font-medium">{listing.price} ETH</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee (2%)</span>
                  <span className="font-medium">{(Number.parseFloat(listing.price) * 0.02).toFixed(4)} ETH</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gas Fee (est.)</span>
                  <span className="font-medium">0.0015 ETH</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold">
                    {(Number.parseFloat(listing.price) * 1.02 + 0.0015).toFixed(4)} ETH
                  </span>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Your payment will be held in escrow until you confirm receipt of the item
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  {type === "buy" ? "Confirm Purchase" : "Send Proposal"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
            <DialogTitle className="mb-2">Processing Transaction</DialogTitle>
            <DialogDescription className="text-center">
              Please confirm the transaction in your wallet and wait for blockchain confirmation
            </DialogDescription>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="mb-2">Transaction Successful!</DialogTitle>
              <DialogDescription className="text-center">
                {type === "buy"
                  ? "Your payment is in escrow. The seller will be notified to deliver the item."
                  : "Your swap proposal has been sent to the seller for review."}
              </DialogDescription>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
