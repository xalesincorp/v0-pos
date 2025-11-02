"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Trash2, Plus } from "lucide-react"
import { useProductStore } from "@/lib/stores/productStore"
import { Category as CategoryType } from "@/lib/db"
import { useNotificationStore } from "@/lib/stores/notificationStore"
import CategoryForm from "./category-form"

export default function CategoryManager() {
  const { categories, products, loading, fetchCategories, deleteCategory } = useProductStore()
  const { showNotification } = useNotificationStore()
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null)

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = () => {
    setEditingCategory(null)
    setShowCategoryForm(true)
  }

  const handleEditCategory = (category: CategoryType) => {
    setEditingCategory(category)
    setShowCategoryForm(true)
  }

  const handleCloseForm = () => {
    setShowCategoryForm(false)
    setEditingCategory(null)
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await deleteCategory(id);
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Category deleted successfully",
          data: null,
        });
      } catch (error: any) {
        showNotification({
          type: 'low_stock',
          title: "Error",
          message: error.message || "Failed to delete category",
          data: null,
        });
      }
    }
  }

  // Fixed product count calculation
  const getCategoryProductCount = (categoryId: string) => {
    return products.filter(product =>
      product.categoryId === categoryId && !product.deletedAt
    ).length;
  }

  return (
    <div className="space-y-4">
      {/* Categories List */}
      <Card className="p-4">
        {/* Header with Add Category button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Category List</h2>
          <Button onClick={handleAddCategory} className="gap-2">
            <Plus className="w-4 h-4" />
            New Category
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Produk (count)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Kategori tidak ditemukan</TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{category.description || '-'}</TableCell>
                    <TableCell className="text-right">{getCategoryProductCount(category.id)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                          className="gap-1 bg-transparent"
                          disabled={loading}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="text-destructive hover:text-destructive"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
