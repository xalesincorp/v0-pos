"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductStore } from "@/lib/stores/productStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { Invoice } from "@/lib/db";

interface UpdatePaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdatePaymentModal({ invoice, isOpen, onClose }: UpdatePaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { updateInvoicePayment } = useProductStore();
  const { showNotification } = useNotificationStore();

  if (!invoice) return null;

  // Calculate values
  const currentPaid = invoice.paidAmount || 0;
  const totalAmount = invoice.total;
  const remainingDebt = totalAmount - currentPaid;
  const additionalAmount = Math.max(0, parseFloat(paymentAmount) || 0);
  const newTotalPaid = currentPaid + additionalAmount;
  const newRemainingDebt = Math.max(0, totalAmount - newTotalPaid);

  // Determine new status
  const getNewStatus = () => {
    if (newTotalPaid === 0) return "Belum Lunas";
    if (newTotalPaid < totalAmount) return "Bayar Sebagian";
    return "Lunas";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (additionalAmount <= 0) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Jumlah pembayaran harus lebih dari 0",
        data: null,
      });
      return;
    }

    if (additionalAmount > remainingDebt) {
      showNotification({
        type: 'low_stock',
        title: "Error", 
        message: "Jumlah pembayaran tidak boleh melebihi hutang yang tersisa",
        data: null,
      });
      return;
    }

    setIsProcessing(true);

    try {
      await updateInvoicePayment(
        invoice.id,
        additionalAmount,
        new Date(paymentDate)
      );

      showNotification({
        type: 'saved_order',
        title: "Success",
        message: `Pembayaran berhasil ditambahkan sebesar Rp ${additionalAmount.toLocaleString("id-ID")}`,
        data: null,
      });

      // Reset form and close modal
      setPaymentAmount("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Gagal memperbarui pembayaran",
        data: null,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Pembayaran - {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Invoice Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Informasi Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">No Invoice:</span> {invoice.invoiceNumber}
                </div>
                <div>
                  <span className="font-medium">Tanggal:</span> {new Date(invoice.createdAt).toLocaleDateString("id-ID")}
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span> {formatCurrency(totalAmount)}
                </div>
                <div>
                  <span className="font-medium">Status Saat Ini:</span> 
                  <span className="ml-2">
                    {getPaymentStatusBadge(invoice.paymentStatus, currentPaid, totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Tagihan:</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sudah Dibayar:</span>
                    <span className="font-medium text-green-600">{formatCurrency(currentPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hutang Tersisa:</span>
                    <span className="font-medium text-red-600">{formatCurrency(remainingDebt)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Pembayaran Baru:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(additionalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Dibayar Baru:</span>
                    <span className="font-medium">{formatCurrency(newTotalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sisa Hutang Baru:</span>
                    <span className={newRemainingDebt > 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {formatCurrency(newRemainingDebt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Status Setelah Pembayaran:</span>
                  <span>{getNewStatus()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-amount">
                  Jumlah Pembayaran <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  max={remainingDebt}
                  step="0.01"
                  placeholder={`Max: ${formatCurrency(remainingDebt)}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={isProcessing}
                  className="text-right"
                  required
                />
                <div className="text-xs text-muted-foreground">
                  Maksimal: {formatCurrency(remainingDebt)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">
                  Tanggal Pembayaran <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isProcessing}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isProcessing || additionalAmount <= 0 || additionalAmount > remainingDebt}
              >
                {isProcessing ? "Memproses..." : "Update Pembayaran"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get payment status badge
function getPaymentStatusBadge(status: string, paidAmount: number, total: number) {
  let className = "";
  let label = "";
  
  if (paidAmount === 0) {
    className = "bg-red-100 text-red-800";
    label = "Belum Lunas";
  } else if (paidAmount < total) {
    className = "bg-yellow-100 text-yellow-800";
    label = "Bayar Sebagian";
  } else {
    className = "bg-green-100 text-green-800";
    label = "Lunas";
  }
  
  return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>;
}