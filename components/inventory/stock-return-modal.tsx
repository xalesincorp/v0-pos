"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, ArrowRight, Plus, Minus, Trash2 } from "lucide-react";
import { StockReturnService, CreateStockReturnData } from "@/lib/services/stockReturnService";
import { db, Supplier, Invoice, Product } from "@/lib/db";
import SupplierSelectionModal from "./supplier-selection-modal";
import InvoiceSelectionModal from "./invoice-selection-modal";
import ProductSelectionModal from "./product-selection-modal";

interface StockReturnModalProps {
  onClose: () => void;
  onReturnCreated: () => void;
}

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currentStock: number;
}

export default function StockReturnModal({ onClose, onReturnCreated }: StockReturnModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const steps = [
    { id: 1, title: "Pilih Supplier", description: "Pilih supplier untuk retur stok" },
    { id: 2, title: "Pilih Faktur", description: "Pilih faktur yang akan diretur" },
    { id: 3, title: "Pilih Produk", description: "Pilih produk yang akan diretur" },
    { id: 4, title: "Konfirmasi", description: "Review dan konfirmasi retur stok" }
  ];

  const totalAmount = returnItems.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSupplierSelected = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSelectedInvoice(null); // Reset invoice when supplier changes
    setShowSupplierModal(false);
    handleNext();
  };

  const handleInvoiceSelected = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(false);
    handleNext();
  };

  const handleProductsSelected = (products: Product[]) => {
    const newReturnItems: ReturnItem[] = products.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.cost || 0,
      totalPrice: product.cost || 0,
      currentStock: product.currentStock || 0
    }));
    
    setReturnItems(prev => [...prev, ...newReturnItems]);
    setShowProductModal(false);
    // Don't automatically move to next step - let user adjust quantities first
  };

  const updateReturnItemQuantity = (index: number, quantity: number) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newTotal = quantity * item.unitPrice;
        return { ...item, quantity, totalPrice: newTotal };
      }
      return item;
    }));
  };

  const updateReturnItemUnitPrice = (index: number, unitPrice: number) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newTotal = item.quantity * unitPrice;
        return { ...item, unitPrice, totalPrice: newTotal };
      }
      return item;
    }));
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmReturn = async () => {
    if (!selectedSupplier || !selectedInvoice || returnItems.length === 0) {
      return;
    }

    try {
      setLoading(true);
      
      const returnData: CreateStockReturnData = {
        supplierId: selectedSupplier.id,
        originalInvoiceId: selectedInvoice.id,
        returnDate: new Date(returnDate),
        totalAmount,
        status: 'belum_selesai',
        notes: notes || null,
        items: returnItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      };

      await StockReturnService.createStockReturn(returnData, "current-user-id"); // TODO: Get actual user ID
      
      setShowConfirmDialog(false);
      onReturnCreated();
      onClose();
    } catch (error) {
      console.error("Error creating stock return:", error);
      alert("Terjadi kesalahan saat membuat retur stok");
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return selectedSupplier !== null;
      case 2:
        return selectedInvoice !== null;
      case 3:
        return returnItems.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Supplier Terpilih</Label>
              <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                {selectedSupplier ? (
                  <div>
                    <div className="font-medium">{selectedSupplier.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedSupplier.phone || '-'}</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Belum ada supplier yang dipilih</div>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setShowSupplierModal(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Pilih Supplier
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Faktur Terpilih</Label>
              <div className="mt-2 p-3 border rounded-lg bg-muted/20">
                {selectedInvoice ? (
                  <div>
                    <div className="font-medium">{selectedInvoice.invoiceNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Tanggal: {new Date(selectedInvoice.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: Rp {selectedInvoice.total.toLocaleString('id-ID')}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Belum ada faktur yang dipilih</div>
                )}
              </div>
            </div>
            <Button 
              onClick={() => setShowInvoiceModal(true)}
              className="w-full"
              variant="outline"
              disabled={!selectedSupplier}
            >
              <Plus className="w-4 h-4 mr-2" />
              Pilih Faktur
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Produk untuk Diretur</Label>
              <Button
                onClick={() => setShowProductModal(true)}
                variant="outline"
                size="sm"
                disabled={!selectedInvoice}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Produk
              </Button>
            </div>
            
            {returnItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada produk yang dipilih untuk retur
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Stok Saat Ini</TableHead>
                      <TableHead className="text-right">Sisa Setelah Retur</TableHead>
                      <TableHead className="text-right">Harga/Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returnItems.map((item, index) => {
                      const remainingStock = Math.max(0, item.currentStock - item.quantity);
                      const stockWarning = item.quantity > item.currentStock;
                      
                      return (
                        <TableRow key={`${item.productId}-${index}`}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateReturnItemQuantity(index, Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateReturnItemQuantity(index, Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-6 w-16 text-center"
                                min="1"
                                max={item.currentStock}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updateReturnItemQuantity(index, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">{item.currentStock}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${stockWarning ? 'text-red-600' : 'text-green-600'}`}>
                              {remainingStock}
                              {stockWarning && <span className="text-xs block">⚠️ Melebihi stok</span>}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateReturnItemUnitPrice(index, Math.max(0, parseFloat(e.target.value) || 0))}
                              className="h-8 text-right"
                              step="0.01"
                              min="0"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rp {item.totalPrice.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeReturnItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Retur</Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Total Amount</Label>
                <div className="mt-1 p-2 bg-muted rounded-md font-medium">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
            
            <div>
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk retur stok..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Ringkasan Retur</Label>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Supplier:</span>
                  <span>{selectedSupplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Faktur Asli:</span>
                  <span>{selectedInvoice?.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Item:</span>
                  <span>{returnItems.length}</span>
                </div>
                <div className="flex justify-between font-medium text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <CardHeader className="p-0 border-b pb-4">
          <CardTitle className="text-xl">Retur Stok</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep > step.id 
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {step.id}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        {/* Step Content */}
        <CardContent className="p-0">
          {renderStepContent()}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sebelumnya
              </Button>
            )}
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext() || loading}
              >
                Selanjutnya
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!canProceedToNext() || loading}
              >
                Buat Retur
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SupplierSelectionModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSupplierSelected={handleSupplierSelected}
        excludedSupplierId={selectedSupplier?.id}
      />

      <InvoiceSelectionModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onInvoiceSelected={handleInvoiceSelected}
        supplierId={selectedSupplier?.id || ""}
        excludedInvoiceId={selectedInvoice?.id}
      />

      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelectProducts={handleProductsSelected}
        invoiceId={selectedInvoice?.id}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Retur Stok</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membuat retur stok dengan total Rp {totalAmount.toLocaleString('id-ID')}? 
              Tindakan ini akan mengurangi stok produk dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReturn}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Ya, Buat Retur"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}