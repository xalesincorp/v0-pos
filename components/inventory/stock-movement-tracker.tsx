"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, TrendingUp, TrendingDown, Minus, Calendar, Eye } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { stockHistoryService, StockMovement } from "@/lib/services/stockHistoryService";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function StockMovementTracker() {
  const { products, fetchProducts } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [movementType, setMovementType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  useEffect(() => {
    fetchProducts();
    loadMovements();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, selectedProduct, movementType, dateRange, searchQuery]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const allMovements: StockMovement[] = [];
      
      // Get movements for all products
      for (const product of products) {
        const productMovements = await stockHistoryService.getStockMovements(product.id);
        allMovements.push(...productMovements);
      }

      // Sort by date (newest first)
      allMovements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setMovements(allMovements);
    } catch (error) {
      console.error('Error loading movements:', error);
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Gagal memuat data pergerakan stok",
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Filter by product
    if (selectedProduct && selectedProduct !== "all") {
      filtered = filtered.filter(m => m.productId === selectedProduct);
    }

    // Filter by movement type
    if (movementType && movementType !== "all") {
      filtered = filtered.filter(m => m.type === movementType);
    }

    // Filter by date range
    const daysAgo = parseInt(dateRange);
    if (!isNaN(daysAgo) && daysAgo > 0) {
      const startDate = subDays(new Date(), daysAgo);
      filtered = filtered.filter(m => m.createdAt >= startDate);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.productName.toLowerCase().includes(query) ||
        (m.productSku && m.productSku.toLowerCase().includes(query)) ||
        (m.reason && m.reason.toLowerCase().includes(query)) ||
        m.referenceId.toLowerCase().includes(query)
      );
    }

    setFilteredMovements(filtered);
  };

  const getDateRangeOptions = () => [
    { value: "7", label: "7 Hari Terakhir" },
    { value: "30", label: "30 Hari Terakhir" },
    { value: "90", label: "90 Hari Terakhir" },
    { value: "365", label: "1 Tahun Terakhir" },
    { value: "custom", label: "Custom Range" }
  ];

  const getMovementTypeOptions = () => [
    { value: "all", label: "Semua Tipe" },
    { value: "purchase", label: "Pembelian" },
    { value: "sale", label: "Penjualan" },
    { value: "opname", label: "Stok Opname" },
    { value: "waste", label: "Buang Stok" },
    { value: "adjustment", label: "Penyesuaian" }
  ];

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'sale':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'opname':
        return <Minus className="w-4 h-4 text-blue-600" />;
      case 'waste':
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: StockMovement['type']) => {
    switch (type) {
      case 'purchase':
        return "Pembelian";
      case 'sale':
        return "Penjualan";
      case 'opname':
        return "Stok Opname";
      case 'waste':
        return "Buang Stok";
      case 'adjustment':
        return "Penyesuaian";
      default:
        return type;
    }
  };

  const getReferenceTypeLabel = (referenceType: StockMovement['referenceType']) => {
    switch (referenceType) {
      case 'invoice':
        return "Faktur Pembelian";
      case 'transaction':
        return "Transaksi Penjualan";
      case 'opname':
        return "Stok Opname";
      case 'waste':
        return "Buang Stok";
      default:
        return referenceType;
    }
  };

  const handleViewDetails = (movement: StockMovement) => {
    setSelectedMovement(movement);
    setShowDetails(true);
  };

  const calculateSummary = () => {
    const totalMovements = filteredMovements.length;
    const totalPurchaseValue = filteredMovements
      .filter(m => m.type === 'purchase')
      .reduce((sum, m) => sum + m.totalValue, 0);
    const totalSaleValue = filteredMovements
      .filter(m => m.type === 'sale')
      .reduce((sum, m) => sum + m.totalValue, 0);
    const totalWasteValue = filteredMovements
      .filter(m => m.type === 'waste')
      .reduce((sum, m) => sum + m.totalValue, 0);
    const netStockChange = filteredMovements.reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalMovements,
      totalPurchaseValue,
      totalSaleValue,
      totalWasteValue,
      netStockChange
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Memuat data pergerakan stok...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = calculateSummary();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Produk</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {products
                    .filter(p => !p.deletedAt)
                    .map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.sku || 'No SKU'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Pergerakan</label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {getMovementTypeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Periode</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  {getDateRangeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cari</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari produk, SKU, atau alasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={loadMovements} variant="outline" className="w-full gap-2">
                <Filter className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{summary.totalMovements}</div>
            <p className="text-sm text-muted-foreground">Total Pergerakan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(summary.totalPurchaseValue).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-muted-foreground">Nilai Pembelian (Rp)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(summary.totalSaleValue).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-muted-foreground">Nilai Penjualan (Rp)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {Math.round(summary.totalWasteValue).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-muted-foreground">Nilai Buang (Rp)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${summary.netStockChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netStockChange >= 0 ? '+' : ''}{summary.netStockChange}
            </div>
            <p className="text-sm text-muted-foreground">Net Stock Change</p>
          </CardContent>
        </Card>
      </div>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Pergerakan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Stok Sebelum</TableHead>
                  <TableHead className="text-right">Stok Sesudah</TableHead>
                  <TableHead className="text-right">Nilai (Rp)</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pergerakan stok
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {format(movement.createdAt, 'dd MMM yyyy HH:mm', { locale: idLocale })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.type)}
                          <Badge variant="outline">{getMovementLabel(movement.type)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.productName}</p>
                          {movement.productSku && (
                            <p className="text-sm text-muted-foreground">SKU: {movement.productSku}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        movement.quantity > 0 ? 'text-green-600' : 
                        movement.quantity < 0 ? 'text-red-600' : 'text-foreground'
                      }`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </TableCell>
                      <TableCell className="text-right">{movement.previousStock}</TableCell>
                      <TableCell className="text-right">{movement.newStock}</TableCell>
                      <TableCell className="text-right">
                        {Math.round(movement.totalValue).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{getReferenceTypeLabel(movement.referenceType)}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {movement.referenceId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(movement)}
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

      {/* Movement Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pergerakan Stok</DialogTitle>
          </DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                  <p className="font-medium">
                    {format(selectedMovement.createdAt, 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipe Pergerakan</label>
                  <div className="flex items-center gap-2">
                    {getMovementIcon(selectedMovement.type)}
                    <p className="font-medium">{getMovementLabel(selectedMovement.type)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Produk</label>
                  <p className="font-medium">{selectedMovement.productName}</p>
                  {selectedMovement.productSku && (
                    <p className="text-sm text-muted-foreground">SKU: {selectedMovement.productSku}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referensi</label>
                  <p className="font-medium">{getReferenceTypeLabel(selectedMovement.referenceType)}</p>
                  <p className="text-sm text-muted-foreground">{selectedMovement.referenceId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <p className={`font-medium ${selectedMovement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMovement.quantity > 0 ? '+' : ''}{selectedMovement.quantity}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok</label>
                  <p className="font-medium">
                    {selectedMovement.previousStock} → {selectedMovement.newStock}
                  </p>
                </div>
                {selectedMovement.unitCost && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                    <p className="font-medium">Rp {Math.round(selectedMovement.unitCost).toLocaleString('id-ID')}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Total Value</label>
                  <p className="font-medium">Rp {Math.round(selectedMovement.totalValue).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {selectedMovement.reason && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Alasan</label>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <p>{selectedMovement.reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}