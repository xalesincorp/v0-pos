"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CustomerForm from "@/components/customers/customer-form"
import { useCustomerStore } from "@/lib/stores/customerStore"
import { useCashierStore } from "@/lib/stores/cashierStore"
import { useAuthStore } from "@/lib/stores/authStore"
import { Customer } from "@/lib/db"

interface CustomerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CustomerSelectionModal({ isOpen, onClose }: CustomerSelectionModalProps) {
  const { customers, loading, error, fetchCustomers, searchCustomers } = useCustomerStore()
  const { selectCustomer, selectedCustomer } = useCashierStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)

  // Load customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
    }
  }, [isOpen, fetchCustomers])

  const filteredCustomers = searchCustomers(searchQuery)

  const handleSelectCustomer = (customer: Customer) => {
    selectCustomer(customer)
    onClose()
  }

  const handleClearCustomer = () => {
    selectCustomer(null)
    onClose()
  }

  const handleCustomerAdded = () => {
    setShowAddCustomerModal(false)
    fetchCustomers() // Refresh the customer list
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan</DialogTitle>
          </DialogHeader>

          {/* Search and Add */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pelanggan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Tambah
              </Button>
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm">Loading customers...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <p className="text-destructive mb-2">Error loading customers</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* No customer option */}
                <div
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={handleClearCustomer}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">—</span>
                    </div>
                    <div>
                      <p className="font-medium">Tanpa Pelanggan</p>
                      <p className="text-sm text-muted-foreground">Transaksi tanpa data pelanggan</p>
                    </div>
                  </div>
                </div>

                {/* Customer list */}
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedCustomer?.id === customer.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {customer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        {customer.phone && (
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        )}
                      </div>
                      {selectedCustomer?.id === customer.id && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredCustomers.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Tidak ada pelanggan ditemukan</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <CustomerForm
        customer={null}
        onClose={() => setShowAddCustomerModal(false)}
        isOpen={showAddCustomerModal}
      />
    </>
  )
}