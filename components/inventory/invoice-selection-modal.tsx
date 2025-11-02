"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, X, FileText } from "lucide-react";
import { db, Invoice, Supplier } from "@/lib/db";

interface InvoiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceSelected: (invoice: Invoice) => void;
  supplierId: string;
  excludedInvoiceId?: string;
}

export default function InvoiceSelectionModal({
  isOpen,
  onClose,
  onInvoiceSelected,
  supplierId,
  excludedInvoiceId
}: InvoiceSelectionModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Map<string, Supplier>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch invoices for the supplier
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const supplierInvoices = await db.invoices
        .where('supplierId')
        .equals(supplierId)
        .filter(invoice => !invoice.deletedAt)
        .toArray();
      
      setInvoices(supplierInvoices);

      // Fetch suppliers for reference
      const allSuppliers = await db.suppliers.toArray();
      const supplierMap = new Map(allSuppliers.map(s => [s.id, s]));
      setSuppliers(supplierMap);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && supplierId) {
      fetchInvoices();
    }
  }, [isOpen, supplierId]);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const notExcluded = !excludedInvoiceId || invoice.id !== excludedInvoiceId;
    
    return matchesSearch && notExcluded;
  });

  // Get payment status badge configuration
  const getPaymentStatusBadge = (status: string, paidAmount?: number, total?: number) => {
    // Use dynamic calculation if paidAmount and total are provided
    if (paidAmount !== undefined && total !== undefined) {
      if (paidAmount === 0) {
        return { label: "Belum Lunas", className: "bg-red-100 text-red-800 hover:bg-red-100" };
      } else if (paidAmount < total) {
        return { label: "Bayar Sebagian", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-800" };
      } else {
        return { label: "Lunas", className: "bg-green-100 text-green-800 hover:bg-green-100" };
      }
    }
    
    // Fallback to stored status for backward compatibility
    switch (status) {
      case "lunas":
        return { label: "Lunas", className: "bg-green-100 text-green-800 hover:bg-green-100" };
      case "belum_lunas":
        return { label: "Belum Lunas", className: "bg-red-100 text-red-800 hover:bg-red-100" };
      case "bayar_sebagian":
        return { label: "Bayar Sebagian", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800 hover:bg-gray-100" };
    }
  };

  // Handle invoice selection
  const handleInvoiceSelect = (invoice: Invoice) => {
    onInvoiceSelected(invoice);
  };

  if (!isOpen) return null;

  const supplier = suppliers.get(supplierId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pilih Faktur</CardTitle>
              {supplier && (
                <p className="text-sm text-muted-foreground mt-1">
                  Supplier: {supplier.name}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 overflow-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari faktur berdasarkan nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Invoices table */}
          <div className="border rounded-lg overflow-auto max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Nomor Faktur</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead className="text-right">Sisa Hutang</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {invoices.length === 0 ? "Belum ada faktur untuk supplier ini" : "Tidak ada faktur yang ditemukan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const paymentStatusBadge = getPaymentStatusBadge(invoice.paymentStatus, invoice.paidAmount, invoice.total);
                    
                    return (
                      <TableRow 
                        key={invoice.id}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {invoice.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {invoice.total.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Badge className={paymentStatusBadge.className}>
                            {paymentStatusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {(invoice.remainingDebt || 0).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleInvoiceSelect(invoice)}
                            className="h-8 px-3"
                          >
                            Pilih
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}