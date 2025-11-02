"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Search, Filter, Calendar, AlertTriangle, Download, Plus } from "lucide-react";
import { db, StockWaste } from "@/lib/db";
import { useProductStore } from "@/lib/stores/productStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface WasteWithProduct extends StockWaste {
  product: { name: string; sku: string | null; cost: number } | null;
}

interface StockWasteHistoryProps {
  onNewWaste?: () => void;
}

export default function StockWasteHistory({ onNewWaste }: StockWasteHistoryProps) {
  const { products } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [wasteRecords, setWasteRecords] = useState<WasteWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedWaste, setSelectedWaste] = useState<WasteWithProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchWasteHistory();
  }, []);

  const fetchWasteHistory = async () => {
    setLoading(true);
    try {
      const wasteRecords = await db.stockWastes.orderBy('createdAt').reverse().toArray();
      
      // Enrich with product details
      const wasteWithProducts: WasteWithProduct[] = wasteRecords.map(waste => {
        const product = products.find(p => p.id === waste.productId);
        return {
          ...waste,
          product: product ? {
            name: product.name,
            sku: product.sku,
            cost: product.cost
          } : null
        };
      });
      
      setWasteRecords(wasteWithProducts);
    } catch (error) {
      console.error('Error fetching waste history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter waste records
  const filteredWasteRecords = wasteRecords.filter(waste => {
    const matchesSearch = searchQuery === "" || 
      waste.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      waste.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      waste.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = dateFilter === "" || 
      format(waste.createdAt, 'yyyy-MM-dd') === dateFilter;
    
    const matchesReason = reasonFilter === "" || 
      waste.reason.toLowerCase().includes(reasonFilter.toLowerCase());
    
    return matchesSearch && matchesDate && matchesReason;
  });

const handleViewDetails = (waste: WasteWithProduct) => {
    setSelectedWaste(waste);
    setShowDetails(true);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvData = await exportWasteToCSV(filteredWasteRecords);
      
      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `buang-stok-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification({
        type: 'saved_order',
        title: "Berhasil",
        message: "Data buang stok berhasil diekspor",
        data: null,
      });
    } catch (error) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Gagal mengekspor data buang stok",
        data: null,
      });
    } finally {
      setExporting(false);
    }
  };

  const exportWasteToCSV = async (wasteRecords: WasteWithProduct[]): Promise<string> => {
    const headers = [
      'Tanggal',
      'Produk',
      'SKU',
      'Quantity',
      'Satuan',
      'Unit Cost',
      'Total Value (Rp)',
      'Alasan'
    ];

    const csvRows = [headers.join(',')];

    for (const waste of wasteRecords) {
      const product = waste.product;
      if (!product) continue;
      
      const row = [
        format(waste.createdAt, 'dd/MM/yyyy HH:mm', { locale: idLocale }),
        `"${product.name}"`,
        product.sku || '',
        waste.qty.toString(),
        waste.unit,
        product.cost.toString(),
        Math.round(waste.qty * product.cost).toString(),
        `"${waste.reason}"`
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  };

  const calculateTotalWasteValue = () => {
    return filteredWasteRecords.reduce((total, waste) => {
      const product = waste.product;
      if (!product) return total;
      return total + (waste.qty * product.cost);
    }, 0);
  };

  const getWasteByReason = () => {
    const reasonCount: { [key: string]: number } = {};
    filteredWasteRecords.forEach(waste => {
      const reason = waste.reason || 'Unknown';
      reasonCount[reason] = (reasonCount[reason] || 0) + 1;
    });
    return reasonCount;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Memuat data buang stok...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const wasteByReason = getWasteByReason();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter & Search</CardTitle>
            <Button onClick={onNewWaste} className="gap-2">
              <Plus className="w-4 h-4" />
              Catat Buang Stok
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan produk atau alasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Alasan</label>
              <Input
                placeholder="Filter berdasarkan alasan..."
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  onClick={fetchWasteHistory}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  onClick={handleExportCSV}
                  variant="default"
                  disabled={exporting}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{filteredWasteRecords.length}</div>
            <p className="text-sm text-muted-foreground">Total Buang Stok</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {Math.round(calculateTotalWasteValue()).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-muted-foreground">Total Nilai (Rp)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredWasteRecords.reduce((sum, w) => sum + w.qty, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Quantity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(wasteByReason).length}</div>
            <p className="text-sm text-muted-foreground">Jenis Alasan</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alasan Pembuangan Terbanyak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(wasteByReason)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([reason, count]) => (
                <div key={reason} className="p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{reason}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{count} kali</p>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>

      {/* Waste History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Buang Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Nilai (Rp)</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWasteRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data buang stok
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWasteRecords.map((waste) => (
                    <TableRow key={waste.id}>
                      <TableCell className="font-medium">
                        {format(waste.createdAt, 'dd MMM yyyy HH:mm', { locale: idLocale })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{waste.product?.name || 'Unknown Product'}</p>
                          {waste.product?.sku && (
                            <p className="text-sm text-muted-foreground">SKU: {waste.product.sku}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {waste.qty}
                      </TableCell>
                      <TableCell>{waste.unit}</TableCell>
                      <TableCell className="text-right">
                        {Math.round((waste.qty * (waste.product?.cost || 0))).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={waste.reason}>
                          {waste.reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(waste)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Buang Stok</DialogTitle>
          </DialogHeader>
          {selectedWaste && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                  <p className="font-medium">
                    {format(selectedWaste.createdAt, 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Produk</label>
                  <p className="font-medium">{selectedWaste.product?.name || 'Unknown Product'}</p>
                  {selectedWaste.product?.sku && (
                    <p className="text-sm text-muted-foreground">SKU: {selectedWaste.product.sku}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p className="font-medium">{selectedWaste.qty} {selectedWaste.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nilai</label>
                  <p className="font-medium text-red-600">
                    Rp {Math.round(selectedWaste.qty * (selectedWaste.product?.cost || 0)).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                  <p className="font-medium">
                    Rp {Math.round(selectedWaste.product?.cost || 0).toLocaleString('id-ID')} per {selectedWaste.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Alasan Pembuangan</label>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p>{selectedWaste.reason}</p>
                </div>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">Dampak Keuangan</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Pembuangan ini mengurangi nilai inventaris sebesar Rp {' '}
                      <strong>{Math.round(selectedWaste.qty * (selectedWaste.product?.cost || 0)).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}