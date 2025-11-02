"use client"

import type React from "react"
import { useState } from "react"
import { useProductStore } from "@/lib/stores/productStore"
import { useNotificationStore } from "@/lib/stores/notificationStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface CategoryFormProps {
  category?: any
  onClose: () => void
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const { addCategory, updateCategory, loading } = useProductStore()
  const { showNotification } = useNotificationStore()
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!formData.name.trim()) {
        throw new Error("Category name is required")
      }

      if (category) {
        // Update existing category
        await updateCategory(category.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        })
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Category updated successfully",
          data: null,
        })
      } else {
        // Add new category
        await addCategory({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          createdBy: 'current-user-id', // TODO: Get from authStore
        })
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Category added successfully",
          data: null,
        })
      }

      onClose()
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to save category",
        data: null,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border">
          <CardTitle>{category ? "Edit Category" : "Add New Category"}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Beverages"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.name.trim()}>
                {loading ? "Saving..." : (category ? "Update Category" : "Add Category")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}