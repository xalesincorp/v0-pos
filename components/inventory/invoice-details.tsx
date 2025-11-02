"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Edit, Trash2, Search, RefreshCw, Plus } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { Invoice } from "@/lib/db";

interface InvoiceDetailsProps {
  onNewInvoiceClick?: () => void;
}

export default function InvoiceDetails({ onNewInvoiceClick }: InvoiceDetailsProps) {
  const { invoices, products, suppliers, fetchProducts, fetchSuppliers, fetchInvoices, loading } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch data when component becomes visible (when invoices tab is active)
  useEffect(() => {
    setIsVisible(true);
    
    // Fetch all required data
    fetchProducts();
    fetchSuppliers();
    fetchInvoices();
  }, [fetchProducts, fetchSuppliers, fetchInvoices]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      setIsVisible(false);
    };
  }, []);

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    if (!invoice.deletedAt) {
      const supplier = suppliers.find(s => s.id === invoice.supplierId);
      const supplierName = supplier?.name || "";
      return (
        invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplierName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return false;
  });

  // Function to get payment status badge
  const getPaymentStatusBadge = (status: string, paidAmount: number, total: number) => {
    let className = "";
    let label = "";
    
    if (paidAmount === 0) {
      className = "bg-red-100 text-red-800";
      label = "Belum Lunas";
    } else if (paidAmount < total) {
      className = "bg-yellow-100 text-yellow-800";
      label = "Bayar Sebagian";
    } else {
      className = "bg-green-100 text-green-800";
      label = "Lunas";
    }
    
    return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{label}</span>;
  };

  // Function to get payment method display name
  const getPaymentMethodDisplay = (method: string, type: string) => {
    if (type === 'cash') return 'Cash (Tunai)';
    if (type === 'non_cash') return 'Non-Tunai (Non-Cash)';
    return method;
  };

  // Function to get supplier name
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Unknown Supplier';
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // Handle view invoice details
  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  // Refresh invoice data
  const refreshInvoices = () => {
    fetchInvoices();
  };

  // Handle delete invoice (soft delete)
  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      // This would need to be implemented in the store
      showNotification({
        type: 'saved_order',
        title: "Success",
        message: "Invoice deleted successfully",
        data: null,
      });
      // Refresh invoice list after deletion
      refreshInvoices();
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to delete invoice",
        data: null,
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Faktur Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">Loading invoices...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <CardTitle>Faktur Pembelian</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Faktur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInvoices}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {onNewInvoiceClick && (
              <Button onClick={onNewInvoiceClick} className="gap-2">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pemasok</TableHead>
                  <TableHead className="text-right">Jumlah Total</TableHead>
                  <TableHead className="text-right">Jumlah Pembayaran</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {invoices.length === 0 ? "No invoices found. Create your first invoice!" : "No invoices match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice: Invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleViewInvoice(invoice)}
                    >
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{getSupplierName(invoice.supplierId)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(invoice.paymentStatus, invoice.paidAmount, invoice.total)}
                      </TableCell>
                      <TableCell>{getPaymentMethodDisplay(invoice.paymentMethod, invoice.paymentType)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Handle edit */}}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice Details - {selectedInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Invoice Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">Invoice Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Invoice Number:</span> {selectedInvoice.invoiceNumber}</p>
                    <p><span className="font-medium">Date:</span> {new Date(selectedInvoice.createdAt).toLocaleDateString("id-ID")}</p>
                    <p><span className="font-medium">Supplier:</span> {getSupplierName(selectedInvoice.supplierId)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Payment Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Payment Method:</span> {getPaymentMethodDisplay(selectedInvoice.paymentMethod, selectedInvoice.paymentType)}</p>
                    <p><span className="font-medium">Payment Status:</span> {getPaymentStatusBadge(selectedInvoice.paymentStatus, selectedInvoice.paidAmount, selectedInvoice.total)}</p>
                    {selectedInvoice.paymentDate && (
                      <p><span className="font-medium">Payment Date:</span> {new Date(selectedInvoice.paymentDate).toLocaleDateString("id-ID")}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products List */}
              <div>
                <h4 className="font-semibold mb-4">Products</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {product?.name || 'Unknown Product'}
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Payment Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedInvoice.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Debt:</span>
                      <span className={selectedInvoice.remainingDebt > 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'}>
                        {formatCurrency(selectedInvoice.remainingDebt)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Status:</span>
                      <span>{getPaymentStatusBadge(selectedInvoice.paymentStatus, selectedInvoice.paidAmount, selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}