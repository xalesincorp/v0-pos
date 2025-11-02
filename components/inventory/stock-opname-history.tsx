 "use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Filter, Download, Calendar, Plus } from "lucide-react";
import { db, StockOpname } from "@/lib/db";
import { useProductStore } from "@/lib/stores/productStore";
import { stockHistoryService } from "@/lib/services/stockHistoryService";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface OpnameWithProducts extends StockOpname {
  products: { name: string; sku: string | null }[];
}

interface StockOpnameHistoryProps {
  onNewOpname?: () => void;
}

export default function StockOpnameHistory({ onNewOpname }: StockOpnameHistoryProps) {
  const { products } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [opnames, setOpnames] = useState<OpnameWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState<OpnameWithProducts | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOpnameHistory();
  }, []);

  const fetchOpnameHistory = async () => {
    setLoading(true);
    try {
      const opnameRecords = await db.stockOpnames.orderBy('createdAt').reverse().toArray();
      
      // Enrich with product names
      const opnameWithProducts: OpnameWithProducts[] = await Promise.all(
        opnameRecords.map(async (opname) => {
          const enrichedItems = await Promise.all(
            opname.items.map(async (item) => {
              const product = products.find(p => p.id === item.productId);
              return {
                name: product?.name || 'Unknown Product',
                sku: product?.sku || null
              };
            })
          );
          
          return {
            ...opname,
            products: enrichedItems
          };
        })
      );
      
      setOpnames(opnameWithProducts);
    } catch (error) {
      console.error('Error fetching opname history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter opnames based on search and date
  const filteredOpnames = opnames.filter(opname => {
    const matchesSearch = searchQuery === "" || 
      opname.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opname.products.some(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesDate = dateFilter === "" || 
      format(opname.createdAt, 'yyyy-MM-dd') === dateFilter;
    
    return matchesSearch && matchesDate;
  });

const handleViewDetails = (opname: OpnameWithProducts) => {
    setSelectedOpname(opname);
    setShowDetails(true);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const csvData = await exportOpnameToCSV(filteredOpnames);
      
      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `stok-opname-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification({
        type: 'saved_order',
        title: "Berhasil",
        message: "Data stok opname berhasil diekspor",
        data: null,
      });
    } catch (error) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Gagal mengekspor data stok opname",
        data: null,
      });
    } finally {
      setExporting(false);
    }
  };

  const exportOpnameToCSV = async (opnames: OpnameWithProducts[]): Promise<string> => {
    const headers = [
      'Tanggal Opname',
      'Produk',
      'SKU',
      'Stok Sistem',
      'Stok Aktual',
      'Selisih',
      'Catatan',
      'Total Items'
    ];

    const csvRows = [headers.join(',')];

    for (const opname of opnames) {
      for (let i = 0; i < opname.items.length; i++) {
        const item = opname.items[i];
        const product = opname.products[i];
        
        const row = [
          format(opname.createdAt, 'dd/MM/yyyy HH:mm', { locale: idLocale }),
          `"${product?.name || 'Unknown Product'}"`,
          product?.sku || '',
          item.systemStock.toString(),
          item.actualStock.toString(),
          item.variance.toString(),
          `"${opname.notes || ''}"`,
          opname.items.length.toString()
        ];
        csvRows.push(row.join(','));
      }
    }

    return csvRows.join('\n');
  };

  const calculateTotalVariance = (items: StockOpname['items']) => {
    return items.reduce((total, item) => total + Math.abs(item.variance), 0);
  };

  const getVarianceStatus = (totalVariance: number) => {
    if (totalVariance === 0) return { label: "Sempurna", variant: "secondary" as const };
    if (totalVariance <= 5) return { label: "Minor", variant: "default" as const };
    return { label: "Mayor", variant: "destructive" as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Memuat data stok opname...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filter & Search</CardTitle>
            <Button onClick={onNewOpname} className="gap-2">
              <Plus className="w-4 h-4" />
              Stok Opname Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan produk atau catatan..."
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
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  onClick={fetchOpnameHistory}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{filteredOpnames.length}</div>
            <p className="text-sm text-muted-foreground">Total Opname</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredOpnames.filter(op => 
                calculateTotalVariance(op.items) === 0
              ).length}
            </div>
            <p className="text-sm text-muted-foreground">Perfect Match</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredOpnames.filter(op => 
                calculateTotalVariance(op.items) > 5
              ).length}
            </div>
            <p className="text-sm text-muted-foreground">Major Variance</p>
          </CardContent>
        </Card>
      </div>

      {/* Opname History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Stok Opname</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpnames.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data stok opname
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOpnames.map((opname) => {
                    const totalVariance = calculateTotalVariance(opname.items);
                    const status = getVarianceStatus(totalVariance);
                    
                    return (
                      <TableRow key={opname.id}>
                        <TableCell className="font-medium">
                          {format(opname.createdAt, 'dd MMM yyyy HH:mm', { locale: idLocale })}
                        </TableCell>
                        <TableCell>{opname.items.length} items</TableCell>
                        <TableCell className={
                          totalVariance === 0 ? 'text-green-600' : 
                          totalVariance <= 5 ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {totalVariance === 0 ? 'Perfect' : `±${totalVariance}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {opname.notes || 'Tidak ada catatan'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(opname)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Stok Opname</DialogTitle>
          </DialogHeader>
          {selectedOpname && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                  <p className="font-medium">
                    {format(selectedOpname.createdAt, 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Items</label>
                  <p className="font-medium">{selectedOpname.items.length} produk</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Variance</label>
                  <p className="font-medium">
                    {calculateTotalVariance(selectedOpname.items) === 0 ? 
                      'Perfect Match' : 
                      `±${calculateTotalVariance(selectedOpname.items)}`
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                  <p className="font-medium">{selectedOpname.notes || 'Tidak ada catatan'}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Stok Sistem</TableHead>
                      <TableHead className="text-right">Stok Aktual</TableHead>
                      <TableHead className="text-right">Selisih</TableHead>
                      <TableHead className="text-right">Nilai (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOpname.items.map((item, index) => {
                      const product = selectedOpname.products[index];
                      const varianceValue = Math.abs(item.variance);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product?.name || 'Unknown Product'}</p>
                              {product?.sku && (
                                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.systemStock}</TableCell>
                          <TableCell className="text-right">{item.actualStock}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            item.variance > 0 ? 'text-green-600' : 
                            item.variance < 0 ? 'text-red-600' : 'text-foreground'
                          }`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </TableCell>
                          <TableCell className="text-right">
                            {varianceValue * 1000} {/* Assuming average cost of 1000, should be dynamic */}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}