"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useProductStore } from "@/lib/stores/productStore"
import { useNotificationStore } from "@/lib/stores/notificationStore"
import { validateProductForm } from "@/lib/utils/validators"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface ProductFormProps {
  product: any
  onClose: () => void
}

interface UomConversion {
  unit: string;
  value: number;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, categories, fetchCategories } = useProductStore()
  const { showNotification } = useNotificationStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    categoryId: product?.categoryId || "",
    type: product?.type || "finish_goods",
    price: product?.price || 0,
    cost: product?.cost || 0,
    monitorStock: product?.monitorStock || false,
    minStock: product?.minStock || 0,
    currentStock: product?.currentStock || 0,
    uom: product?.uom || { base: "unit", conversions: [] },
    recipe: product?.recipe || [],
  })

  useEffect(() => {
    console.log("ProductForm: Fetching categories...")
    fetchCategories()
  }, [fetchCategories])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Prepare product data
      const productData = {
        name: formData.name,
        type: formData.type as 'finish_goods' | 'recipe_goods' | 'raw_material',
        categoryId: formData.categoryId,
        sku: formData.sku || null,
        price: Number(formData.price),
        cost: Number(formData.cost),
        image: null, // Will be implemented later
        monitorStock: formData.monitorStock,
        minStock: formData.monitorStock ? Number(formData.minStock) : null,
        currentStock: Number(formData.currentStock),
        calculatedStock: null, // Will be calculated for recipe goods
        uom: formData.uom,
        recipe: formData.type === 'recipe_goods' ? formData.recipe : [],
        createdBy: 'current-user-id', // TODO: Get from authStore
      }

      // Validate the data
      validateProductForm(productData)

      if (product) {
        // Update existing product
        await updateProduct(product.id, productData)
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Product updated successfully",
          data: null,
        })
      } else {
        // Add new product
        await addProduct(productData)
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Product added successfully",
          data: null,
        })
      }

      onClose()
    } catch (error: any) {
      console.error("Error saving product:", error)
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to save product",
        data: null,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <CardTitle>{product ? "Edit Product" : "Add New Product"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Basic Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Product Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Bakso Sapi"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="e.g., BSP-001"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category *</label>
                  <Select value={formData.categoryId} onValueChange={(value: string) => handleChange("categoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                       {categories
                         .filter(category => category.id && category.id.trim() !== '' && category.name && category.name.trim() !== '')
                         .map((category) => {
                         console.log("ProductForm: Rendering category", { id: category.id, name: category.name })
                         return (
                           <SelectItem key={category.id} value={category.id}>
                             {category.name}
                           </SelectItem>
                         )
                       })}
                     </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Product Type *</label>
                  <Select value={formData.type} onValueChange={(value: string) => handleChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finish_goods">Finish Goods</SelectItem>
                      <SelectItem value="recipe_goods">Recipe Goods</SelectItem>
                      <SelectItem value="raw_material">Raw Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Pricing</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Selling Price (Rp) *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange("price", Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cost/HPP (Rp) *</label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleChange("cost", Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Profit Display */}
              {formData.price > 0 && formData.cost > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Profit Margin:{" "}
                    <span className="font-semibold text-foreground">
                      Rp {(Number(formData.price) - Number(formData.cost)).toLocaleString("id-ID")} (
                      {(((Number(formData.price) - Number(formData.cost)) / Number(formData.price)) * 100).toFixed(1)}%)
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Stock Management */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Stock Management</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.monitorStock}
                    onChange={(e) => handleChange("monitorStock", e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">Monitor Stock</span>
                </label>

                {formData.monitorStock && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Current Stock</label>
                      <Input
                        type="number"
                        value={formData.currentStock}
                        onChange={(e) => handleChange("currentStock", Number(e.target.value))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Minimum Stock Level</label>
                      <Input
                        type="number"
                        value={formData.minStock}
                        onChange={(e) => handleChange("minStock", Number(e.target.value))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Unit of Measure */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Unit of Measure</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Base Unit *</label>
                  <Input
                    value={formData.uom.base}
                    onChange={(e) => handleChange("uom", { ...formData.uom, base: e.target.value })}
                    placeholder="e.g., unit, kg, liter"
                    required
                  />
                </div>
                
                {/* UOM Conversions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-foreground">Conversions</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleChange("uom", {
                        ...formData.uom,
                        conversions: [...formData.uom.conversions, { unit: "", value: 1 }]
                      })}
                      className="h-7 text-xs"
                    >
                      Add Conversion
                    </Button>
                  </div>
                  
                  {formData.uom.conversions.length > 0 ? (
                    <div className="space-y-2">
                      {formData.uom.conversions.map((conversion: UomConversion, index: number) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={conversion.unit}
                            onChange={(e) => {
                              const newConversions = [...formData.uom.conversions];
                              newConversions[index].unit = e.target.value;
                              handleChange("uom", { ...formData.uom, conversions: newConversions });
                            }}
                            placeholder="e.g., dozen, pack"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">=</span>
                          <Input
                            type="number"
                            value={conversion.value}
                            onChange={(e) => {
                              const newConversions = [...formData.uom.conversions];
                              newConversions[index].value = Number(e.target.value);
                              handleChange("uom", { ...formData.uom, conversions: newConversions });
                            }}
                            placeholder="1"
                            min="0.001"
                            step="0.001"
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {formData.uom.base}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newConversions = formData.uom.conversions.filter((_: any, i: number) => i !== index);
                              handleChange("uom", { ...formData.uom, conversions: newConversions });
                            }}
                            className="h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No conversions added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recipe (if recipe_goods) */}
            {formData.type === "recipe_goods" && (
              <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                <h3 className="font-semibold text-foreground">Recipe Ingredients</h3>
                <p className="text-sm text-muted-foreground">
                  Add ingredients and quantities. Stock will be calculated automatically.
                </p>
                <Button type="button" variant="outline" className="w-full bg-transparent" disabled>
                  Add Ingredient (Coming Soon)
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Saving..." : (product ? "Update Product" : "Add Product")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
