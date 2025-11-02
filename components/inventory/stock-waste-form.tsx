"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";

interface WasteItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  reason: string;
}

export default function StockWasteForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products, addStockWaste, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  const { showNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [wasteDate, setWasteDate] = useState(new Date().toISOString().split('T')[0]);
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unit");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addWasteItem = () => {
    if (!selectedProduct || !quantity) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Please select a product and enter quantity",
        data: null,
      });
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const item: WasteItem = {
      id: Date.now().toString(),
      productId: selectedProduct,
      productName: product.name,
      qty: Number(quantity),
      unit: unit || product.uom?.base || "unit",
      reason: reason || "Unspecified reason",
    };

    setWasteItems([...wasteItems, item]);
    setSelectedProduct("");
    setQuantity("");
    setUnit(product.uom?.base || "unit");
    setReason("");
  };

  const removeWasteItem = (id: string) => {
    setWasteItems(wasteItems.filter(item => item.id !== id));
  };

const handleSubmit = async () => {
    if (wasteItems.length === 0) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Tambahkan minimal satu item untuk buang stok",
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
      // Add each waste item individually
      for (const item of wasteItems) {
        await addStockWaste({
          productId: item.productId,
          qty: item.qty,
          unit: item.unit,
          reason: item.reason,
          createdBy: user.id,
        });
      }

      showNotification({
        type: 'saved_order',
        title: "Berhasil",
        message: "Buang stok berhasil dicatat",
        data: null,
      });

      // Reset form and close
      setWasteItems([]);
      setSelectedProduct("");
      setQuantity("");
      setUnit("unit");
      setReason("");
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Gagal mencatat buang stok",
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
          <DialogTitle>Catat Buang Stok</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tanggal Buang</label>
            <Input
              type="date"
              value={wasteDate}
              onChange={(e) => setWasteDate(e.target.value)}
            />
          </div>

          {/* Add Item */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
                      {product.name} - {product.sku || 'No SKU'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Jumlah</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Satuan</label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="contoh: unit, kg, liter"
              />
            </div>
            <div className="space-y-2 pb-2.5">
              <Button type="button" onClick={addWasteItem} className="w-full gap-2" variant="outline">
                <Plus className="w-4 h-4" />
                Tambah Item
              </Button>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Alasan (Opsional)</label>
            <Textarea
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              placeholder="Alasan buang stok..."
              rows={2}
            />
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Items Buang Stok</h3>
            {wasteItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Belum ada item</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {wasteItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg border-border bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span>{item.qty} {item.unit}</span>
                        <span>•</span>
                        <span className="truncate">{item.reason}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeWasteItem(item.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={loading || wasteItems.length === 0} className="gap-2">
              {loading ? "Menyimpan..." : "Simpan Buang Stok"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}