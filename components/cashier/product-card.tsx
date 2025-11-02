"use client"

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCashierStore } from "@/lib/stores/cashierStore"
import { useProductStore } from "@/lib/stores/productStore"

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    image: string
    stock: number
    category: string
  }
  viewMode: "grid" | "list"
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart } = useCashierStore()
  const { products } = useProductStore()

  const getStockBadgeColor = (stock: number) => {
    if (stock > 10) return "bg-green-100 text-green-800"
    if (stock > 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const handleAddToCart = () => {
    setIsAdding(true)

    // Find the full product from the store
    const fullProduct = products.find(p => p.id === product.id)
    if (fullProduct) {
      addToCart(fullProduct)
    }

    setTimeout(() => setIsAdding(false), 300)
  }

  if (viewMode === "list") {
    return null
  }

  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all cursor-pointer group p-0 leading-4",
        product.stock === 0 && "opacity-50",
      )}
      onClick={handleAddToCart}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-video bg-muted overflow-hidden">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
        />

        {/* Stock Badge */}
        <Badge className={cn("absolute top-0.5 right-0.5 text-xs", getStockBadgeColor(product.stock))}>
          {product.stock}
        </Badge>

        {/* Out of Stock Overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-1.5 pt-0.5 pb-1 space-y-0">
        <h3 className="font-medium text-foreground line-clamp-1 text-xs">{product.name}</h3>

        <div className="flex items-center justify-between gap-0.5">
          <p className="font-semibold text-primary text-xs">Rp {product.price.toLocaleString("id-ID")}</p>
          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 flex-shrink-0" disabled={product.stock === 0}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
