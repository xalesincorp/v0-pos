"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Search } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import ProductSelectionModal from "./product-selection-modal";
import { Supplier } from "@/lib/db";

// Define the interface for invoice items since it's not exported from db
interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function PurchaseInvoiceForm({ onClose }: { onClose: () => void }) {
  const { products, suppliers, addPurchaseInvoice, fetchProducts, fetchSuppliers } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'non_cash'>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts, fetchSuppliers]);

  const handleSelectProducts = (selectedProducts: any[]) => {
    const newItems = selectedProducts.map(product => ({
      id: `${Date.now()}-${product.id}`,
      productId: product.id,
      productName: product.name,
      quantity: 1, // Default quantity
      unitPrice: product.cost || 0, // Default to cost price if available
    }));
    setInvoiceItems([...invoiceItems, ...newItems]);
    setShowProductModal(false);
  };

  const updateInvoiceItem = (id: string, field: 'quantity' | 'unitPrice', value: number) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Update total if needed
        return updatedItem;
      }
      return item;
    }));
 };

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async () => {
    if (invoiceItems.length === 0) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Please add at least one item to the invoice",
        data: null,
      });
      return;
    }

    if (!supplierId) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Please select a supplier",
        data: null,
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate payment status
      const totalAmount = calculateSubtotal();
      const paidAmount = Math.min(paymentAmount, totalAmount);
      const remainingDebt = totalAmount - paidAmount;
      let paymentStatus: 'lunas' | 'belum_lunas' | 'bayar_sebagian';
      
      if (paidAmount === 0) {
        paymentStatus = 'belum_lunas';
      } else if (paidAmount < totalAmount) {
        paymentStatus = 'bayar_sebagian';
      } else {
        paymentStatus = 'lunas';
      }

      await addPurchaseInvoice({
        supplierId: supplierId,
        items: invoiceItems.map(item => ({
          productId: item.productId,
          qty: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
        subtotal: totalAmount,
        total: totalAmount,
        paymentMethod: paymentMethod === 'cash' ? 'kas_outlet' : 'bank',
        paymentType: paymentMethod,
        paymentStatus,
        paidAmount: paidAmount,
        remainingDebt: remainingDebt,
        paymentDate: paidAmount > 0 ? new Date(paymentDate) : null,
        createdBy: 'current-user-id', // Will be replaced with actual user ID
      });

      showNotification({
        type: 'saved_order',
        title: "Success",
        message: "Purchase invoice added successfully",
        data: null,
      });

      // Reset form and close
      setSupplierId("");
      setInvoiceItems([]);
      setPaymentMethod('cash');
      setPaymentAmount(0);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      onClose(); // Close the form after successful submission
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to add purchase invoice",
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Supplier and Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Supplier</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter(s => !s.deletedAt && s.id && s.id.trim() !== '' && s.name && s.name.trim() !== '')
                  .map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Invoice Date</label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        {/* Select Products Button */}
        <div className="space-y-2">
          <Button type="button" onClick={() => setShowProductModal(true)} className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            Select Products
          </Button>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto border rounded-lg border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No items added</TableCell>
                </TableRow>
              ) : (
                invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(item.id, 'quantity', Number(e.target.value))}
                        className="w-20 text-right"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateInvoiceItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-32 text-right"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">Rp {(item.quantity * item.unitPrice).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeInvoiceItem(item.id)}
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

        {/* Summary */}
        <div className="flex justify-end border-t pt-4 border-border">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">Rp {calculateSubtotal().toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2 border-border">
              <span>Total:</span>
              <span>Rp {calculateSubtotal().toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
        
        {/* Payment Fields */}
        <div className="border-t pt-4 border-border space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Payment Information</h3>
          
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Payment Method</label>
            <Select value={paymentMethod} onValueChange={(value: 'cash' | 'non_cash') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash (Tunai)</SelectItem>
                <SelectItem value="non_cash">Non-Tunai (Non-Cash)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Payment Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Jumlah Bayar (Payment Amount)</label>
            <Input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
              className="w-full"
              min="0"
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Total: Rp {calculateSubtotal().toLocaleString("id-ID")} | Remaining: Rp {Math.max(0, calculateSubtotal() - paymentAmount).toLocaleString("id-ID")}
            </p>
          </div>
          
          {/* Payment Date - only show if payment amount > 0 */}
          {paymentAmount > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || invoiceItems.length === 0} className="gap-2">
            {loading ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </div>
      
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProducts={handleSelectProducts}
      />
    </>
  );
}
