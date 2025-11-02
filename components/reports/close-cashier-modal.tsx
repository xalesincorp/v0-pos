"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Printer, CheckCircle2, X } from "lucide-react";
import { CashierShiftService } from "@/lib/services/cashierShiftService";
import { ReportService } from "@/lib/services/reportService";
import { useAuthStore } from "@/lib/stores/authStore";
import { useShiftStore } from "@/lib/stores/shiftStore";
import { toast } from "react-hot-toast";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { escposService } from "@/lib/services/escposService";
import { Transaction } from "@/lib/db";

interface CloseCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CloseCashierModal({ isOpen, onClose }: CloseCashierModalProps) {
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [shiftData, setShiftData] = useState<any>(null);
  const [summary, setSummary] = useState({
    openingBalance: 0,
    totalCash: 0,
    totalNonCash: 0,
    totalSales: 0,
    expectedCash: 0
  });
  const [printAllProducts, setPrintAllProducts] = useState(false);
  const [printSimplifiedSummary, setPrintSimplifiedSummary] = useState(false);
  const { user } = useAuthStore();

  // Fetch current shift data
  useEffect(() => {
    const fetchShiftData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Use the shift store to get current shift status
        await useShiftStore.getState().checkShiftStatus(user.id);
        const currentShift = await useShiftStore.getState().getCurrentShift();
        if (currentShift) {
          const report = await ReportService.getCloseCashierReport(currentShift.id);
          setShiftData(report.shift);
          setSummary(report.summary);
        } else {
          // If no active shift found, create a minimal shift summary
          setShiftData({
            id: '',
            openedBy: user.name || user.email || 'Unknown',
            openedAt: new Date(),
            closingBalance: 0,
            actualCash: 0,
            variance: 0,
            totalTransactions: 0,
            totalSales: 0,
            totalCash: 0,
            totalNonCash: 0,
            status: 'open'
          });
          setSummary({
            openingBalance: 0,
            totalCash: 0,
            totalNonCash: 0,
            totalSales: 0,
            expectedCash: 0
          });
          toast("No active shift found, creating summary with no sales");
        }
      } catch (error) {
        console.error("Error fetching shift data:", error);
        toast.error("Failed to load shift data");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user?.id) {
      fetchShiftData();
    }
  }, [user?.id, isOpen]);

  const expectedCash = summary.openingBalance + summary.totalCash;
  const variance = actualCash ? Number(actualCash) - expectedCash : 0;
  const variancePercent = actualCash ? ((variance / expectedCash) * 100).toFixed(2) : 0;

  const handlePrintAllProducts = async () => {
    if (!shiftData) {
      toast.error("No shift data available to print");
      return;
    }

    try {
      // Get all transactions for this shift
      const shiftReport = await CashierShiftService.getShiftReport(shiftData.id);
      if (!shiftReport) {
        toast.error("No transactions found for this shift");
        return;
      }

      // Print detailed report of all sold products
      const transactions = shiftReport.transactions as Transaction[];
      const soldProducts: { [key: string]: { name: string; totalQty: number; totalAmount: number } } = {};

      // Aggregate all sold products
      transactions.forEach(transaction => {
        transaction.items.forEach(item => {
          if (soldProducts[item.productId]) {
            soldProducts[item.productId].totalQty += item.qty;
            soldProducts[item.productId].totalAmount += item.subtotal;
          } else {
            soldProducts[item.productId] = {
              name: item.name,
              totalQty: item.qty,
              totalAmount: item.subtotal
            };
          }
        });
      });

      // Format for printing
      const productReport = {
        businessName: "Tutup Kasir - Produk Terjual",
        transactionDate: new Date().toLocaleString('id-ID'),
        cashierName: shiftData.openedBy,
        items: Object.values(soldProducts).map(product => ({
          name: product.name,
          qty: product.totalQty,
          price: product.totalAmount / product.totalQty, // average price
          subtotal: product.totalAmount
        })),
        totalProducts: Object.keys(soldProducts).length,
        totalQtySold: Object.values(soldProducts).reduce((sum, product) => sum + product.totalQty, 0),
        totalAmount: Object.values(soldProducts).reduce((sum, product) => sum + product.totalAmount, 0),
      };

      // Print the report
      await printDetailedProductReport(productReport);
      toast.success("All sold products report printed successfully");
    } catch (error) {
      console.error("Error printing all products report:", error);
      toast.error("Failed to print all sold products report");
    }
  };

  const handlePrintSimplifiedSummary = async () => {
    if (!shiftData) {
      toast.error("No shift data available to print");
      return;
    }

    try {
      // Format simplified summary for printing
      const simplifiedReport = {
        businessName: "Tutup Kasir - Ringkasan",
        date: new Date(shiftData.openedAt).toLocaleDateString('id-ID'),
        cashierName: shiftData.openedBy,
        totalTransactionCount: shiftData.totalTransactions,
        totalCash: shiftData.totalCash,
        totalNonCash: shiftData.totalNonCash,
        totalSales: shiftData.totalSales,
        openingBalance: shiftData.openingBalance,
        expectedCash: shiftData.closingBalance || expectedCash,
        actualCash: Number(actualCash) || 0,
        variance: Number(actualCash) ? Number(actualCash) - (shiftData.openingBalance + shiftData.totalCash) : 0,
      };

      // Print the simplified summary
      await printSimplifiedSummaryReport(simplifiedReport);
      toast.success("Simplified summary report printed successfully");
    } catch (error) {
      console.error("Error printing simplified summary:", error);
      toast.error("Failed to print simplified summary report");
    }
  };

  // Function to print detailed product report
  const printDetailedProductReport = async (reportData: any) => {
    try {
      // This is a simplified implementation - in a real app, you would format the data
      // for printing using the actual printer service
      console.log("Printing detailed product report:", reportData);
      
      // In a real implementation, you would send the report to the printer
      const commands = [
        { command: 'INIT' },
        { command: 'TEXT', data: { text: reportData.businessName, bold: true, align: 'center' } },
        { command: 'TEXT', data: { text: reportData.transactionDate, align: 'center' } },
        { command: 'TEXT', data: { text: `Kasir: ${reportData.cashierName}`, align: 'left' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: 'Daftar Produk Terjual', bold: true, align: 'left' } },
        { command: 'LINE' },
      ];

      // Add sold products
      reportData.items.forEach((item: any) => {
        commands.push({ command: 'TEXT', data: { text: `${item.name} (${item.qty}x)`, align: 'left' } });
        commands.push({ command: 'TEXT', data: { text: `Rp ${item.subtotal.toLocaleString('id-ID')}`, align: 'right' } });
      });

      commands.push({ command: 'LINE' });
      commands.push({ command: 'TEXT', data: { text: `Total Produk: ${reportData.totalProducts}`, align: 'right' } });
      commands.push({ command: 'TEXT', data: { text: `Total Qty: ${reportData.totalQtySold}`, align: 'right' } });
      commands.push({ command: 'TEXT', data: { text: `Total: Rp ${reportData.totalAmount.toLocaleString('id-ID')}`, bold: true, align: 'right' } });
      commands.push({ command: 'CUT' });

      // Send to printer
      await escposService.sendToPrinter(commands);
    } catch (error) {
      console.error("Error in printDetailedProductReport:", error);
      throw error;
    }
  };

  // Function to print simplified summary report
  const printSimplifiedSummaryReport = async (reportData: any) => {
    try {
      // This is a simplified implementation - in a real app, you would format the data
      // for printing using the actual printer service
      console.log("Printing simplified summary report:", reportData);
      
      // In a real implementation, you would send the report to the printer
      const commands = [
        { command: 'INIT' },
        { command: 'TEXT', data: { text: reportData.businessName, bold: true, align: 'center' } },
        { command: 'TEXT', data: { text: reportData.date, align: 'center' } },
        { command: 'TEXT', data: { text: `Kasir: ${reportData.cashierName}`, align: 'left' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: 'Ringkasan Transaksi', bold: true, align: 'left' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: `Total Transaksi: ${reportData.totalTransactionCount}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Total Tunai: Rp ${reportData.totalCash.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Total Non-Tunai: Rp ${reportData.totalNonCash.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Total Penjualan: Rp ${reportData.totalSales.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: 'Perhitungan Kas', bold: true, align: 'left' } },
        { command: 'LINE' },
        { command: 'TEXT', data: { text: `Saldo Awal: Rp ${reportData.openingBalance.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Kas Harusnya: Rp ${reportData.expectedCash.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Kas Aktual: Rp ${reportData.actualCash.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'TEXT', data: { text: `Selisih: Rp ${reportData.variance.toLocaleString('id-ID')}`, align: 'left' } },
        { command: 'CUT' },
      ];

      // Send to printer
      await escposService.sendToPrinter(commands);
    } catch (error) {
      console.error("Error in printSimplifiedSummaryReport:", error);
      throw error;
    }
  };

  const handleSelesai = async () => {
    setLoading(true);
    try {
      // Print reports if checkboxes are checked
      if (printAllProducts) {
        await handlePrintAllProducts();
      }
      
      if (printSimplifiedSummary) {
        await handlePrintSimplifiedSummary();
      }

      // Close the shift with actual cash if provided
      if (shiftData && actualCash) {
        await useShiftStore.getState().closeShift(shiftData.id, Number(actualCash));
        toast.success("Cashier closed successfully");
      } else if (shiftData) {
        // Close shift even if no actual cash provided (for cases with no sales)
        await useShiftStore.getState().closeShift(shiftData.id, 0);
        toast.success("Cashier closed successfully");
      }
      
      // Logout the user and redirect to login page
      try {
        await useAuthStore.getState().logout();
        window.location.href = "/";
      } catch (logoutError) {
        console.error('Logout error after closing cashier:', logoutError);
        // Even if logout fails, redirect to login page
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error in handleSelesai:", error);
      toast.error("Failed to close cashier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex justify-between items-center">
            <span>Tutup Kasir Summary</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTitle>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Opening Balance</p>
              <p className="text-2xl font-bold text-foreground">Rp {summary.openingBalance.toLocaleString("id-ID")}</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Cash Sales</p>
              <p className="text-2xl font-bold text-primary">Rp {summary.totalCash.toLocaleString("id-ID")}</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Non-Cash</p>
              <p className="text-2xl font-bold text-foreground">Rp {summary.totalNonCash.toLocaleString("id-ID")}</p>
            </Card>

            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-foreground">Rp {summary.totalSales.toLocaleString("id-ID")}</p>
            </Card>
          </div>

          {/* Print Options */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg">Pilihan Cetak</h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="printAllProducts"
                  checked={printAllProducts}
                  onChange={(e) => setPrintAllProducts(e.target.checked)}
                  className="h-4 w-4"
                  disabled={loading}
                />
                <label htmlFor="printAllProducts" className="text-sm font-medium">
                  Print semua Produk terjual
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="printSimplifiedSummary"
                  checked={printSimplifiedSummary}
                  onChange={(e) => setPrintSimplifiedSummary(e.target.checked)}
                  className="h-4 w-4"
                  disabled={loading}
                />
                <label htmlFor="printSimplifiedSummary" className="text-sm font-medium">
                  Print Simplified Summary
                </label>
              </div>
            </div>
          </div>

          {/* Close Form */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Expected Cash</label>
                  <Input value={`Rp ${expectedCash.toLocaleString("id-ID")}`} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Actual Cash Count *</label>
                  <Input
                    type="number"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="Enter actual cash amount"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Variance Display */}
              {actualCash && (
                <div
                  className={`p-4 rounded-lg border-2 ${variance >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 ${variance >= 0 ? "text-green-600" : "text-red-600"}`} />
                    <div>
                      <p className={`font-semibold ${variance >= 0 ? "text-green-900" : "text-red-900"}`}>
                        Variance: {variance >= 0 ? "+" : ""}Rp {Math.abs(variance).toLocaleString("id-ID")} (
                        {variancePercent}%)
                      </p>
                      <p className={`text-sm ${variance >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {variance >= 0 ? "Cash surplus" : "Cash shortage"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this close cashier..."
                  className="w-full h-24 p-3 border border-border rounded-lg bg-background text-foreground"
                  disabled={loading}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-between pt-4 border-t border-border">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                disabled={loading || !printAllProducts}
                onClick={handlePrintAllProducts}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Products
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                disabled={loading || !printSimplifiedSummary}
                onClick={handlePrintSimplifiedSummary}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Summary
              </Button>
            </div>
            
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSelesai}
              disabled={loading}
            >
              {loading ? "Processing..." : "Selesai"}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
