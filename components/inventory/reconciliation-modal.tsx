"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, X, FileText, Calendar, DollarSign } from "lucide-react";
import { StockReturnService, StockReturnWithItems } from "@/lib/services/stockReturnService";

interface ReconciliationModalProps {
  onClose: () => void;
  onReconciliationUpdated: () => void;
}

export default function ReconciliationModal({ onClose, onReconciliationUpdated }: ReconciliationModalProps) {
  const [stockReturns, setStockReturns] = useState<StockReturnWithItems[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<StockReturnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [editingReturn, setEditingReturn] = useState<StockReturnWithItems | null>(null);
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmedAmount, setConfirmedAmount] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch stock returns
  const fetchStockReturns = async () => {
    try {
      setLoading(true);
      const data = await StockReturnService.getStockReturns();
      setStockReturns(data);
      setFilteredReturns(data);
    } catch (error) {
      console.error("Error fetching stock returns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockReturns();
  }, []);

  // Filter returns
  useEffect(() => {
    let filtered = stockReturns;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(returnData => 
        returnData.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (returnData.supplierName && returnData.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (returnData.originalInvoiceNumber && returnData.originalInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(returnData => returnData.status === selectedStatus);
    }

    // Filter by supplier
    if (selectedSupplier !== "all") {
      filtered = filtered.filter(returnData => returnData.supplierId === selectedSupplier);
    }

    setFilteredReturns(filtered);
  }, [stockReturns, searchQuery, selectedStatus, selectedSupplier]);

  // Get unique suppliers for filter
  const uniqueSuppliers = Array.from(new Set(stockReturns.map(r => ({
    id: r.supplierId,
    name: r.supplierName || 'Unknown'
  }))));

  // Get status badge configuration
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "belum_selesai":
        return {
          label: "Belum Selesai",
          className: "bg-orange-100 text-orange-800 hover:bg-orange-100"
        };
      case "selesai":
        return {
          label: "Selesai", 
          className: "bg-green-100 text-green-800 hover:bg-green-100"
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 hover:bg-gray-100"
        };
    }
  };

  // Handle edit reconciliation
  const handleEditReconciliation = (returnData: StockReturnWithItems) => {
    setEditingReturn(returnData);
    setConfirmDate(returnData.confirmationDate ? new Date(returnData.confirmationDate).toISOString().split('T')[0] : "");
    setConfirmedAmount(returnData.confirmedAmount?.toString() || returnData.totalAmount.toString());
  };

  // Handle save reconciliation
  const handleSaveReconciliation = async () => {
    if (!editingReturn) return;

    try {
      setLoading(true);
      
      const confirmationDate = confirmDate ? new Date(confirmDate) : undefined;
      const confirmedAmountValue = parseFloat(confirmedAmount) || editingReturn.totalAmount;
      
      await StockReturnService.updateReturnStatus(
        editingReturn.id,
        'selesai',
        confirmationDate
      );
      
      setShowConfirmDialog(false);
      setEditingReturn(null);
      fetchStockReturns();
      onReconciliationUpdated();
    } catch (error) {
      console.error("Error updating return status:", error);
      alert("Terjadi kesalahan saat memperbarui status retur");
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation
  const handleConfirmSave = () => {
    setShowConfirmDialog(true);
  };

  const getStatusActions = (returnData: StockReturnWithItems) => {
    const statusBadge = getStatusBadge(returnData.status);
    
    if (returnData.status === "selesai") {
      return (
        <Badge className={statusBadge.className}>
          {statusBadge.label}
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleEditReconciliation(returnData)}
        className="h-7 px-2 text-xs"
      >
        Edit Konfirmasi
      </Button>
    );
  };

  const canSaveReconciliation = () => {
    if (!editingReturn) return false;
    
    const hasDate = !!confirmDate;
    const hasAmount = !!confirmedAmount && parseFloat(confirmedAmount) > 0;
    
    return hasDate && hasAmount;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CardHeader className="p-0 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Rekonsiliasi Retur Stok</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola dan konfirmasi retur stok yang belum selesai
        </p>
      </CardHeader>

      {/* Filters */}
      <CardContent className="p-0 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari retur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Semua Status</option>
            <option value="belum_selesai">Belum Selesai</option>
            <option value="selesai">Selesai</option>
          </select>

          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="all">Semua Supplier</option>
            {uniqueSuppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>

          <div className="text-sm text-muted-foreground flex items-center">
            Total: {filteredReturns.length} retur
          </div>
        </div>

        {/* Returns table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nomor Retur</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Faktur Asli</TableHead>
                <TableHead>Tanggal Retur</TableHead>
                <TableHead className="text-right">Total Jumlah</TableHead>
                <TableHead>Konfirmasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {stockReturns.length === 0 ? "Belum ada retur stok" : "Tidak ada retur yang ditemukan"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((returnData) => (
                  <TableRow key={returnData.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{returnData.returnNumber}</TableCell>
                    <TableCell>{returnData.supplierName || "-"}</TableCell>
                    <TableCell>{returnData.originalInvoiceNumber || "-"}</TableCell>
                    <TableCell>
                      {new Date(returnData.returnDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {returnData.totalAmount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {returnData.confirmationDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(returnData.confirmationDate).toLocaleDateString('id-ID')}
                          </div>
                        )}
                        {returnData.confirmedAmount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Rp {returnData.confirmedAmount.toLocaleString('id-ID')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusActions(returnData)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditReconciliation(returnData)}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Reconciliation Form */}
        {editingReturn && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">
                Edit Konfirmasi - {editingReturn.returnNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="confirmDate">Tanggal Konfirmasi</Label>
                  <Input
                    id="confirmDate"
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmedAmount">Jumlah Dikonfirmasi (Rp)</Label>
                  <Input
                    id="confirmedAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={confirmedAmount}
                    onChange={(e) => setConfirmedAmount(e.target.value)}
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingReturn(null)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleConfirmSave}
                  disabled={!canSaveReconciliation() || loading}
                >
                  Simpan Konfirmasi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Rekonsiliasi</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyimpan konfirmasi retur ini? 
              Status akan diubah menjadi "Selesai" dan tidak dapat diubah kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveReconciliation}
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Ya, Simpan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}