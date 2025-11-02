"use client"

import { useState } from "react"
import MainLayout from "@/components/layout/main-layout"
import ProductList from "@/components/products/product-list"
import ProductForm from "@/components/products/product-form"
import CategoryManager from "@/components/products/category-manager"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

export default function ProductsPage() {
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleCloseForm = () => {
    setShowProductForm(false)
    setEditingProduct(null)
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pengelolaan Produk</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Produk</TabsTrigger>
            <TabsTrigger value="categories">Kategori</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            {/* Products tab header with Add Product button */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">List Produk</h2>
              <Button onClick={handleAddProduct} className="gap-2">
                <Plus className="w-4 h-4" />
                Tambah Produk
              </Button>
            </div>
            <ProductList onEdit={handleEditProduct} />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryManager />
          </TabsContent>
        </Tabs>

        {/* Product Form Modal */}
        {showProductForm && <ProductForm product={editingProduct} onClose={handleCloseForm} />}
      </div>
    </MainLayout>
  )
}
