"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReportService } from "@/lib/services/reportService";
import { Transaction } from "@/lib/db";

interface CustomerTransactionHistoryProps {
  customerId: string;
}

export default function CustomerTransactionHistory({ customerId }: CustomerTransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!customerId) return;
      
      setLoading(true);
      try {
        // Get transactions for the last 30 days as default
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        const history = await ReportService.getCustomerTransactionHistory(customerId, dateFrom);
        setTransactions(history);
      } catch (error) {
        console.error("Error fetching customer transaction history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionHistory();
  }, [customerId]);

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

  return (
    <Card className="p-4 mt-4">
      <h3 className="font-semibold text-foreground mb-4">Transaction History</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading transaction history...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No transaction history found for this customer</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium text-sm">{transaction.transactionNumber}</TableCell>
                  <TableCell className="text-sm">{new Date(transaction.createdAt).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right font-medium">Rp {transaction.total.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">{transaction.items.length}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}