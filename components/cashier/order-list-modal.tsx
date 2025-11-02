"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useCashierStore } from "@/lib/stores/cashierStore"

interface OrderListModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Order {
  id: string
  orderNumber: string
  date: string
  quantity: number
  amount: number
  status: "lunas" | "pending" | "cicilan"
}

export default function OrderListModal({ isOpen, onClose }: OrderListModalProps) {
  const { savedOrders, initializeCashier, loadSavedOrder } = useCashierStore()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [loading, setLoading] = useState(false)

  // Load saved orders when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      initializeCashier().finally(() => setLoading(false))
    }
  }, [isOpen, initializeCashier])

  // Convert saved orders to display format
  const orders: Order[] = savedOrders.map(order => ({
    id: order.id,
    orderNumber: order.transactionNumber,
    date: order.savedAt ? new Date(order.savedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    quantity: order.items.reduce((sum, item) => sum + item.qty, 0),
    amount: order.total,
    status: order.status === 'paid' ? 'lunas' : order.status === 'saved' ? 'pending' : 'cicilan'
  }))

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      lunas: { label: "Lunas", color: "bg-green-100 text-green-800" },
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      cicilan: { label: "Cicilan", color: "bg-blue-100 text-blue-800" },
    }
    const statusInfo = statusMap[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" }
    return <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
  }

  const filteredOrders = orders.filter((order) => {
    if (paymentStatus !== "all" && order.status !== paymentStatus) return false
    if (startDate && order.date < startDate) return false
    if (endDate && order.date > endDate) return false
    return true
  })

  const handleLoadOrder = async (orderId: string) => {
    try {
      await loadSavedOrder(orderId)
      onClose()
    } catch (error) {
      console.error('Failed to load saved order:', error)
      // TODO: Show error notification
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background w-full h-full max-w-full max-h-full rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">Daftar Order</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="border-b border-border p-4 flex-shrink-0 space-y-3">
          <div className="flex gap-4 items-end flex-wrap">
            {/* Sort by Tanggal */}
            <div className="flex gap-2 items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                />
              </div>
            </div>

            {/* Sort by Status Pembayaran */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Status Pembayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="all">Semua Status</option>
                <option value="lunas">Lunas</option>
                <option value="pending">Pending</option>
                <option value="cicilan">Cicilan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm">Loading saved orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Belum ada order tersimpan</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">No Order</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Tanggal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Jumlah QTY</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">Jumlah Nominal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Status Pembayaran</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-sm">{new Date(order.date).toLocaleDateString("id-ID")}</td>
                    <td className="px-4 py-3 text-sm text-right">{order.quantity}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      Rp {order.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadOrder(order.id)}
                        className="text-xs"
                      >
                        Load
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
