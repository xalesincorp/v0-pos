"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { Product } from "@/lib/db";

export default function StockList() {
  const { products, fetchProducts, loading } = useProductStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const isNotDeleted = !product.deletedAt;
    
    return matchesSearch && matchesCategory && isNotDeleted;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.categoryId).filter(Boolean))) as string[];

  return (
    <Card className="p-0 border-0">
      {/* Filters */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="border border-input bg-background rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Semoga Kategori</option>
            {categories.map(categoryId => {
              // Find the category name from the product list
              const categoryProduct = products.find(p => p.categoryId === categoryId);
              return (
                <option key={categoryId} value={categoryId}>
                  {categoryProduct?.categoryId || categoryId}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Produk</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">SKU</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold text-right">Stok Saat Ini</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold text-right">Min Stok</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Unit</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Status</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold text-right">Update Terakhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const status = product.currentStock <= (product.minStock || 0)
                  ? { label: "Low Stock", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="w-4 h-4 text-red-600" /> }
                  : { label: "In Stock", color: "bg-green-100 text-green-800", icon: null };

                return (
                  <TableRow key={product.id} className="hover:bg-muted/30 border-b border-border/50 h-12">
                    <TableCell className="px-3 py-1">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.categoryId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-1 text-xs text-muted-foreground">{product.sku || '-'}</TableCell>
                    <TableCell className="px-3 py-1 text-right font-medium">{product.currentStock}</TableCell>
                    <TableCell className="px-3 py-1 text-right text-muted-foreground">{product.minStock || 0}</TableCell>
                    <TableCell className="px-3 py-1 text-xs text-muted-foreground">{product.uom?.base || 'unit'}</TableCell>
                    <TableCell className="px-3 py-1">
                      <div className="flex items-center gap-2">
                        {status.icon && <span>{status.icon}</span>}
                        <Badge className={status.color}>{status.label}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-1 text-right text-xs text-muted-foreground">
                      {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
