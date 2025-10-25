import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, ArrowLeftRight } from "lucide-react"

interface ListingCardProps {
  id: string
  title: string
  type: "ticket" | "giftcard"
  price: string
  originalValue?: string
  image: string
  seller: string
  verified: boolean
  timeLeft?: string
  swapEnabled: boolean
}

export function ListingCard({
  id,
  title,
  type,
  price,
  originalValue,
  image,
  seller,
  verified,
  timeLeft,
  swapEnabled,
}: ListingCardProps) {
  return (
    <Link href={`/listing/${id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          {verified && (
            <div className="absolute right-2 top-2">
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          )}
          {swapEnabled && (
            <div className="absolute left-2 top-2">
              <Badge variant="secondary" className="gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Swap
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {type === "ticket" ? "Ticket" : "Gift Card"}
            </Badge>
            {timeLeft && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {timeLeft}
              </Badge>
            )}
          </div>
          <h3 className="mb-2 line-clamp-2 font-semibold text-balance">{title}</h3>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold">{price} ETH</div>
            {originalValue && <div className="text-sm text-muted-foreground line-through">{originalValue} ETH</div>}
          </div>
          <div className="mt-2 font-mono text-xs text-muted-foreground">
            {seller.slice(0, 6)}...{seller.slice(-4)}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
