"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Search, Phone, Download } from "lucide-react"
import { useCustomerStore } from "@/lib/stores/customerStore"
import { Customer } from "@/lib/db"
import { ExportService } from "@/lib/services/exportService";
import { toast } from "react-hot-toast"

interface CustomerListProps {
  onEdit: (customer: Customer) => void
}

export default function CustomerList({ onEdit }: CustomerListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { customers, deleteCustomer, loading, fetchCustomers, searchCustomers, getCustomerStats } = useCustomerStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  // Fetch customers when component mounts
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        await fetchCustomers()
      } catch (error) {
        console.error("Error loading customers:", error)
        toast.error("Failed to load customers")
      }
    }
    loadCustomers()
  }, [fetchCustomers])

  const filteredCustomers = searchQuery ? searchCustomers(searchQuery) : customers.filter(c => !c.deletedAt)

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setShowConfirmDialog(true)
  }

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    setDeletingId(customerToDelete.id)
    try {
      await deleteCustomer(customerToDelete.id)
      toast.success("Customer deleted successfully")
      setShowConfirmDialog(false)
      setCustomerToDelete(null)
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast.error("Failed to delete customer")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setCustomerToDelete(null)
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await ExportService.exportCustomerListToExcel(filteredCustomers);
      } else {
        await ExportService.exportCustomerListToPDF(filteredCustomers);
      }
      toast.success(`Customer list exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error(`Error exporting customer list as ${format}:`, error);
      toast.error(`Failed to export customer list as ${format}`);
    }
  }

  return (
    <div className="relative">
      <Card className="p-4">
        {/* Search and Export */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
          <div className="flex-1 relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
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

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {customer.phone || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.gender || "Not specified"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(customer)} className="gap-1" disabled={loading}>
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(customer)}
                        className="text-destructive hover:text-destructive"
                        disabled={loading || deletingId === customer.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        )}
        
        {loading && filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && customerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-lg mb-2">Confirm Delete</h3>
            <p className="text-foreground mb-6">
              Are you sure you want to delete customer <span className="font-medium">{customerToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelDelete} disabled={deletingId !== null}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteCustomer}
                disabled={deletingId !== null}
              >
                {deletingId === customerToDelete.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
