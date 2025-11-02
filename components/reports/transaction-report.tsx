"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { ReportService } from "@/lib/services/reportService";
import { ExportService } from "@/lib/services/exportService";
import { Transaction as TransactionType } from "@/lib/db";
import { useCustomerStore } from "@/lib/stores/customerStore";
import { toast } from "react-hot-toast";

export default function TransactionReport() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    paidCount: 0,
    unpaidCount: 0
  });
  const { fetchCustomers } = useCustomerStore();

  // Fetch customers to ensure data is available
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch transaction report data
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const dateFrom = new Date(startDate);
        dateFrom.setHours(0, 0, 0, 0);
        const dateTo = new Date(endDate);
        dateTo.setHours(23, 59, 59, 999);
        
        const status = statusFilter === "all" ? undefined : statusFilter as 'paid' | 'unpaid' | 'saved';
        const report = await ReportService.getTransactionReport(dateFrom, dateTo, status);
        setTransactions(report.transactions);
        setSummary(report.summary);
      } catch (error) {
        console.error("Error fetching transaction report:", error);
        toast.error("Failed to load transaction report");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [startDate, endDate, statusFilter]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await ExportService.exportTransactionReportToExcel(transactions, summary, new Date(startDate), new Date(endDate));
      } else {
        await ExportService.exportTransactionReportToPDF(transactions, summary, new Date(startDate), new Date(endDate));
      }
      toast.success(`Transaction report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error(`Error exporting transaction report as ${format}:`, error);
      toast.error(`Failed to export transaction report as ${format}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-red-100 text-red-800";
      case "saved":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTransactions = statusFilter === "all" 
    ? transactions 
    : transactions.filter(t => t.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v || "all")} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
              </SelectContent>
            </Select>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-foreground">{summary.totalTransactions}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-primary">Rp {summary.totalRevenue.toLocaleString("id-ID")}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{summary.paidCount}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-red-60">{summary.unpaidCount}</p>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Transaction Details</h3>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-sm">{transaction.transactionNumber}</TableCell>
                    <TableCell className="text-sm">{new Date(transaction.createdAt).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-sm">{transaction.customerId || 'Walk-in'}</TableCell>
                    <TableCell className="text-right">{transaction.items.length}</TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {transaction.total.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-sm">{transaction.payments.map(p => p.method).join(', ')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredTransactions.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found for the selected date range and filters</p>
          </div>
        )}
      </Card>
    </div>
  )
}
