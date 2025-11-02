"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { useShiftStore } from "@/lib/stores/shiftStore";
import { ReportService } from "@/lib/services/reportService";
import { ExportService } from "@/lib/services/exportService";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "react-hot-toast";

export default function CloseCashierReport() {
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
  const { user } = useAuthStore();

  // Fetch current shift data
  useEffect(() => {
    const fetchShiftData = async () => {
      setLoading(true);
      try {
        // Use the shift store to get current shift status
        await useShiftStore.getState().checkShiftStatus(user?.id || "");
        const currentShift = await useShiftStore.getState().getCurrentShift();
        if (currentShift) {
          const report = await ReportService.getCloseCashierReport(currentShift.id);
          setShiftData(report.shift);
          setSummary(report.summary);
        } else {
          toast.error("No active shift found");
        }
      } catch (error) {
        console.error("Error fetching shift data:", error);
        toast.error("Failed to load shift data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchShiftData();
    }
  }, [user?.id]);

 const expectedCash = summary.openingBalance + summary.totalCash;
  const variance = actualCash ? Number(actualCash) - expectedCash : 0;
  const variancePercent = actualCash ? ((variance / expectedCash) * 10).toFixed(2) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Close the shift with actual cash
      if (shiftData) {
        await useShiftStore.getState().closeShift(shiftData.id, Number(actualCash));
        toast.success("Cashier closed successfully");
        
        // After successfully closing cashier, log out the user
        try {
          await useAuthStore.getState().logout();
          window.location.href = "/";
        } catch (logoutError) {
          console.error('Logout error after closing cashier:', logoutError);
          // Even if logout fails, redirect to login page
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Error closing cashier:", error);
      toast.error("Failed to close cashier");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      if (shiftData && actualCash) {
        if (format === 'excel') {
          await ExportService.exportCloseCashierReportToExcel(shiftData, summary, Number(actualCash));
        } else {
          await ExportService.exportCloseCashierReportToPDF(shiftData, summary, Number(actualCash));
        }
        toast.success(`Close cashier report exported as ${format.toUpperCase()} successfully`);
      } else {
        toast.error("Please enter actual cash amount to export report");
      }
    } catch (error) {
      console.error(`Error exporting close cashier report as ${format}:`, error);
      toast.error(`Failed to export close cashier report as ${format}`);
    }
  };

  return (
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

      {/* Close Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                required
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => handleExport('pdf')} disabled={loading}>
              Export PDF
            </Button>
            <Button type="button" variant="outline" onClick={() => handleExport('excel')} disabled={loading}>
              Export Excel
            </Button>
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading || !actualCash}>
              {loading ? "Processing..." : "Close Cashier"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
