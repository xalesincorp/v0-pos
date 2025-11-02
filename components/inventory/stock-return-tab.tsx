"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, FileText } from "lucide-react";
import { StockReturnService, StockReturnWithItems } from "@/lib/services/stockReturnService";
import StockReturnModal from "./stock-return-modal";
import ReconciliationModal from "./reconciliation-modal";

export default function StockReturnTab() {
  const [stockReturns, setStockReturns] = useState<StockReturnWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);

  // Fetch stock returns
  const fetchStockReturns = async () => {
    try {
      setLoading(true);
      const data = await StockReturnService.getStockReturns();
      setStockReturns(data);
    } catch (error) {
      console.error("Error fetching stock returns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockReturns();
  }, []);

  // Filter stock returns based on search and status
  const filteredReturns = stockReturns.filter((returnData) => {
    const matchesSearch = !searchQuery || 
      returnData.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (returnData.supplierName && returnData.supplierName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (returnData.originalInvoiceNumber && returnData.originalInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === "all" || returnData.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

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

  const handleReturnCreated = () => {
    setShowReturnModal(false);
    fetchStockReturns();
  };

  const handleReconciliationUpdated = () => {
    setShowReconciliationModal(false);
    fetchStockReturns();
  };

  return (
    <Card className="p-0 border-0">
      {/* Header with actions */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nomor retur, supplier, atau faktur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-input bg-background rounded-md px-3 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">Semua Status</option>
              <option value="belum_selesai">Belum Selesai</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReconciliationModal(true)}
              className="h-9"
            >
              <FileText className="w-4 h-4 mr-2" />
              Rekonsiliasi Retur
            </Button>
            <Button
              size="sm"
              onClick={() => setShowReturnModal(true)}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              + Retur Stok
            </Button>
          </div>
        </div>
      </div>

      {/* Returns table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Nomor Retur</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Supplier</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Faktur Asli</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Tanggal Retur</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold text-right">Total Jumlah</TableHead>
              <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {stockReturns.length === 0 ? "Belum ada retur stok" : "Tidak ada retur yang ditemukan"}
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((returnData) => {
                const statusBadge = getStatusBadge(returnData.status);
                
                return (
                  <TableRow key={returnData.id} className="hover:bg-muted/30 border-b border-border/50 h-12">
                    <TableCell className="px-3 py-1 font-medium text-foreground">
                      {returnData.returnNumber}
                    </TableCell>
                    <TableCell className="px-3 py-1 text-muted-foreground">
                      {returnData.supplierName || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-1 text-muted-foreground">
                      {returnData.originalInvoiceNumber || "-"}
                    </TableCell>
                    <TableCell className="px-3 py-1 text-muted-foreground">
                      {new Date(returnData.returnDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="px-3 py-1 text-right font-medium">
                      Rp {returnData.totalAmount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="px-3 py-1">
                      <Badge className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stock Return Creation Modal */}
      <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Retur Stok</DialogTitle>
          </DialogHeader>
          <StockReturnModal
            onClose={() => setShowReturnModal(false)}
            onReturnCreated={handleReturnCreated}
          />
        </DialogContent>
      </Dialog>

      {/* Reconciliation Modal */}
      <Dialog open={showReconciliationModal} onOpenChange={setShowReconciliationModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rekonsiliasi Retur Stok</DialogTitle>
          </DialogHeader>
          <ReconciliationModal
            onClose={() => setShowReconciliationModal(false)}
            onReconciliationUpdated={handleReconciliationUpdated}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}