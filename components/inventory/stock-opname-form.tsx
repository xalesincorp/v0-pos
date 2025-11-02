"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";

interface OpnameItem {
  id: string;
  productId: string;
  productName: string;
  systemStock: number;
  actualStock: number;
  variance: number;
}

export default function StockOpnameForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, addStockOpname, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [opnameItems, setOpnameItems] = useState<OpnameItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [actualStock, setActualStock] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addOpnameItem = () => {
    if (!selectedProduct || !actualStock) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Please select a product and enter actual stock",
        data: null,
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const systemStock = product.currentStock || 0;
    const variance = Number(actualStock) - systemStock;

    const item: OpnameItem = {
      id: Date.now().toString(),
      productId: selectedProduct,
      productName: product.name,
      systemStock,
      actualStock: Number(actualStock),
      variance,
    };

    // Check if item already exists
    const exists = opnameItems.some(item => item.productId === selectedProduct);
    if (exists) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "This product is already in the list",
        data: null,
      });
      return;
    }

    setOpnameItems([...opnameItems, item]);
    setSelectedProduct("");
    setActualStock("");
  };

  const removeOpnameItem = (id: string) => {
    setOpnameItems(opnameItems.filter(item => item.id !== id));
  };

const handleSubmit = async () => {
    if (opnameItems.length === 0) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Tambahkan minimal satu item untuk opname",
        data: null,
      });
      return;
    }

    if (!user?.id) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "User ID tidak ditemukan",
        data: null,
      });
      return;
    }

    setLoading(true);
    try {
      await addStockOpname({
        items: opnameItems.map(item => ({
          productId: item.productId,
          systemStock: item.systemStock,
          actualStock: item.actualStock,
          variance: item.variance,
        })),
        notes: notes || null,
        createdBy: user.id,
      });

      showNotification({
        type: 'saved_order',
        title: "Berhasil",
        message: "Stok opname berhasil disimpan",
        data: null,
      });

      // Reset form and close
      setNotes("");
      setOpnameItems([]);
      setSelectedProduct("");
      setActualStock("");
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Gagal menyimpan stok opname",
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stok Opname Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Date and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tanggal Opname</label>
              <Input
                type="date"
                value={opnameDate}
                onChange={(e) => setOpnameDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Catatan (Opsional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
              />
            </div>
          </div>

          {/* Add Item */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Produk</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter(p => !p.deletedAt && p.id && p.id.trim() !== '' && p.name && p.name.trim() !== '')
                    .map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.sku || 'No SKU'} (Sistem: {product.currentStock || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Stok Aktual</label>
              <Input
                type="number"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2 pb-2.5">
              <Button type="button" onClick={addOpnameItem} className="w-full gap-2" variant="outline">
                <Plus className="w-4 h-4" />
                Tambah Item
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border rounded-lg border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Stok Sistem</TableHead>
                  <TableHead className="text-right">Stok Aktual</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opnameItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada item</TableCell>
                  </TableRow>
                ) : (
                  opnameItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell className="text-right">{item.systemStock}</TableCell>
                      <TableCell className="text-right">{item.actualStock}</TableCell>
                      <TableCell className={`text-right font-medium ${item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-foreground'}`}>
                        {item.variance > 0 ? '+' : ''}{item.variance}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeOpnameItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading || opnameItems.length === 0} className="gap-2">
              {loading ? "Menyimpan..." : "Simpan Opname"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
