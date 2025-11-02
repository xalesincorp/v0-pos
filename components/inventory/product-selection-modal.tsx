"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "../ui/checkbox";
import { Search, X, Package } from "lucide-react";
import { db, Product, Invoice } from "@/lib/db";

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProducts: (products: Product[]) => void;
  invoiceId?: string;
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  onSelectProducts,
  invoiceId
}: ProductSelectionModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch products from invoice items if invoiceId is provided
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      if (invoiceId) {
        // Get products from the invoice
        const invoice = await db.invoices.get(invoiceId);
        if (invoice) {
          setInvoiceItems(invoice.items);
          
          // Get product details for each invoice item
          const invoiceProducts: Product[] = [];
          for (const item of invoice.items) {
            const product = await db.products.get(item.productId);
            if (product && !product.deletedAt) {
              invoiceProducts.push(product);
            }
          }
          setProducts(invoiceProducts);
        }
      } else {
        // Get all products if no invoiceId provided
        const allProducts = await db.products.filter(product => !product.deletedAt).toArray();
        setProducts(allProducts);
        setInvoiceItems([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, invoiceId]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [products, searchQuery]);

  // Get invoice quantity for a product
  const getInvoiceQuantity = (productId: string) => {
    const invoiceItem = invoiceItems.find(item => item.productId === productId);
    return invoiceItem ? invoiceItem.qty : 0;
  };

  // Get invoice unit price for a product
  const getInvoiceUnitPrice = (productId: string) => {
    const invoiceItem = invoiceItems.find(item => item.productId === productId);
    return invoiceItem ? invoiceItem.unitPrice : 0;
  };

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    const selectedProducts = products.filter(p => 
      selectedProductIds.has(p.id) && !p.deletedAt
    );
    onSelectProducts(selectedProducts);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {invoiceId ? "Pilih Produk dari Faktur" : "Pilih Produk"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {invoiceId ? "Produk yang tersedia dalam faktur" : "Pilih produk untuk diretur"}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 overflow-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products table */}
          <div className="border rounded-lg overflow-auto max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>SKU</TableHead>
                  {invoiceId ? (
                    <>
                      <TableHead className="text-right">Qty Faktur</TableHead>
                      <TableHead className="text-right">Harga/Unit</TableHead>
                    </>
                  ) : (
                    <TableHead className="text-right">Stok Saat Ini</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={invoiceId ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={invoiceId ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      {products.length === 0 ? "Tidak ada produk tersedia" : "Tidak ada produk yang ditemukan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={selectedProductIds.has(product.id) ? "bg-muted/30" : "hover:bg-muted/50"}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedProductIds.has(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>{product.sku || "-"}</TableCell>
                      {invoiceId ? (
                        <>
                          <TableCell className="text-right">
                            <span className="font-medium">{getInvoiceQuantity(product.id)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            Rp {getInvoiceUnitPrice(product.id).toLocaleString('id-ID')}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell className="text-right">
                          {product.currentStock || 0}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {selectedProductIds.size} produk dipilih
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Tutup
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedProductIds.size === 0}
              >
                Pilih ({selectedProductIds.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}