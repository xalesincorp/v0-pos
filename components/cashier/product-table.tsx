"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
  image: string
  stock: number
  category: string
  sku?: string
}

interface ProductTableProps {
  products: Product[]
}

export default function ProductTable({ products }: ProductTableProps) {
  const getStockBadgeColor = (stock: number) => {
    if (stock > 10) return "bg-green-100 text-green-800"
    if (stock > 5) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const handleAddToCart = (product: Product) => {
    // TODO: Add to cart logic - integrate with cashierStore
    console.log("Add to cart:", product.id)
  }

  return (
    <div className="w-full overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        {/* Table Header */}
        <thead className="bg-muted border-b border-border sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-foreground">Nama Produk</th>
            <th className="px-4 py-2 text-left font-semibold text-foreground">SKU</th>
            <th className="px-4 py-2 text-left font-semibold text-foreground">Kategori</th>
            <th className="px-4 py-2 text-right font-semibold text-foreground">Harga</th>
            <th className="px-4 py-2 text-center font-semibold text-foreground">Stok</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {products.map((product, index) => (
            <tr
              key={product.id}
              className={cn(
                "border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                index % 2 === 0 ? "bg-background" : "bg-muted/20",
              )}
              onClick={() => handleAddToCart(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleAddToCart(product)
                }
              }}
            >
              {/* Product Name with Image */}
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-muted">
                    <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  </div>
                  <span className="font-medium text-foreground truncate">{product.name}</span>
                </div>
              </td>

              {/* SKU */}
              <td className="px-4 py-2 text-muted-foreground">{product.sku || "-"}</td>

              {/* Kategori */}
              <td className="px-4 py-2 text-muted-foreground">{product.category || "-"}</td>

              {/* Price */}
              <td className="px-4 py-2 text-right font-semibold text-foreground">
                Rp {product.price.toLocaleString("id-ID")}
              </td>

              {/* Stock */}
              <td className="px-4 py-2 text-center">
                <Badge className={cn("text-xs", getStockBadgeColor(product.stock))}>{product.stock}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
