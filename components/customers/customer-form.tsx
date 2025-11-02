"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCustomerStore } from "@/lib/stores/customerStore"
import { useAuthStore } from "@/lib/stores/authStore"
import { Customer } from "@/lib/db"
import CustomerTransactionHistory from "./customer-transaction-history";

interface CustomerFormProps {
  customer: Customer | null
  onClose: () => void
  isOpen?: boolean
}

export default function CustomerForm({ customer, onClose, isOpen }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    gender: customer?.gender || "",
  })
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalSpent: 0,
    lastTransaction: null as Date | null,
    avgTransactionValue: 0
  });
  const { addCustomer, updateCustomer, getCustomerStats } = useCustomerStore()
  const { user } = useAuthStore()

  useEffect(() => {
    setFormData({
      name: customer?.name || "",
      phone: customer?.phone || "",
      gender: customer?.gender || "",
    })
  }, [customer])

  // Load customer stats if editing existing customer
  useEffect(() => {
    const loadStats = async () => {
      if (customer?.id) {
        try {
          const statsData = await getCustomerStats(customer.id);
          setStats({
            totalTransactions: statsData.totalTransactions,
            totalSpent: statsData.totalSpent,
            lastTransaction: statsData.lastTransaction,
            avgTransactionValue: statsData.avgTransactionValue
          });
        } catch (error) {
          console.error("Error loading customer stats:", error);
        }
      }
    };

    if (customer?.id) {
      loadStats();
    }
  }, [customer?.id, getCustomerStats]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (customer) {
        // Update existing customer
        await updateCustomer(customer.id, {
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender as 'male' | 'female' | null,
        })
      } else {
        // Create new customer
        if (!user) {
          throw new Error("User not authenticated");
        }
        if (!user.id) {
          throw new Error("User ID is not available");
        }
        await addCustomer({
          name: formData.name,
          phone: formData.phone,
          gender: formData.gender as 'male' | 'female' | null,
          createdBy: user.id
        })
      }
      onClose()
    } catch (error) {
      console.error("Error saving customer:", error)
      // Show error message to user
      alert(`Error saving customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen ?? true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto p-6">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Budi Santoso"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0812-3456-7890"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Saving..." : (customer ? "Update Customer" : "Add Customer")}
              </Button>
            </div>
          </form>

          {/* Customer Stats - Only show if editing existing customer */}
          {customer?.id && (
            <div className="border-t border-border pt-4 space-y-4">
              <h3 className="font-semibold text-foreground">Customer Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-xl font-bold">{stats.totalTransactions}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-xl font-bold">Rp {stats.totalSpent.toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Transaction</p>
                  <p className="text-xl font-bold">Rp {stats.avgTransactionValue.toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Transaction</p>
                  <p className="text-xl font-bold">{stats.lastTransaction ? new Date(stats.lastTransaction).toLocaleDateString('id-ID') : 'N/A'}</p>
                </div>
              </div>

              {/* Transaction History */}
              <CustomerTransactionHistory customerId={customer.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
