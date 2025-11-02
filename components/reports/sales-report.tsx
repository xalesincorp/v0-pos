"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"
import { ReportService } from "@/lib/services/reportService";
import { ExportService } from "@/lib/services/exportService";
import { toast } from "react-hot-toast";

export default function SalesReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [salesItems, setSalesItems] = useState<Array<{
    id: string;
    productName: string;
    category: string;
    quantitySold: number;
    revenue: number;
    avgPrice: number;
  }>>([]);
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalRevenue: 0,
    topProduct: null as string | null
  });

  // Fetch sales report data
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const dateFrom = new Date(startDate);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(endDate);
        dateTo.setHours(23, 59, 999);
        
        const report = await ReportService.getSalesReport(dateFrom, dateTo);
        setSalesItems(report.salesItems);
        setSummary(report.summary);
      } catch (error) {
        console.error("Error fetching sales report:", error);
        toast.error("Failed to load sales report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [startDate, endDate]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await ExportService.exportSalesReportToExcel(salesItems, summary, new Date(startDate), new Date(endDate));
      } else {
        await ExportService.exportSalesReportToPDF(salesItems, summary, new Date(startDate), new Date(endDate));
      }
      toast.success(`Sales report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error(`Error exporting sales report as ${format}:`, error);
      toast.error(`Failed to export sales report as ${format}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Start Date</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">End Date</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              disabled={loading}
            />
          </div>

          <div className="space-y-2 flex items-end justify-end">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => handleExport('excel')} disabled={loading}>
              <Download className="w-4 h-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => handleExport('pdf')} disabled={loading}>
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Items Sold</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalQuantity}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-primary">Rp {summary.totalRevenue.toLocaleString("id-ID")}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Top Product</p>
          <p className="text-lg font-bold text-foreground">{summary.topProduct || 'N/A'}</p>
          <p className="text-xs text-muted-foreground mt-1">Most revenue generating product</p>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Product Sales</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading sales data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-right">{item.quantitySold}</TableCell>
                    <TableCell className="text-right">Rp {item.avgPrice.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-medium">Rp {item.revenue.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {salesItems.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No sales data found for the selected date range</p>
          </div>
        )}
      </Card>
    </div>
  )
}
