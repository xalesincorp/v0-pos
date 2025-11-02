"use client"
import { useEffect } from "react"
import ProductCard from "./product-card"
import ProductTable from "./product-table"
import { useProductStore } from "@/lib/stores/productStore"

interface ProductGridProps {
  searchQuery: string
  viewMode: "grid" | "list"
  selectedCategory: string | null
}

export default function ProductGrid({ searchQuery, viewMode, selectedCategory }: ProductGridProps) {
  const { products, categories, loading, error, fetchProducts, fetchCategories, searchProducts } = useProductStore()

  // Load products and categories on mount
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  // Filter products based on search and category
  const filteredProducts = searchProducts(searchQuery).filter((product) => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    return matchesCategory && !product.deletedAt
  })

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading products</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No products found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search</p>
        </div>
      </div>
    )
  }

  if (viewMode === "list") {
    return <ProductTable products={filteredProducts.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "/placeholder.svg",
      stock: product.currentStock || 0,
      category: categories.find(c => c.id === product.categoryId)?.name || "Uncategorized",
      sku: product.sku || undefined
    }))} />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 auto-rows-max">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || "/placeholder.svg",
            stock: product.currentStock || 0,
            category: categories.find(c => c.id === product.categoryId)?.name || "Uncategorized"
          }}
          viewMode={viewMode}
        />
      ))}
    </div>
  )
}
