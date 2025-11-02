"use client"

import { useState } from "react"
import { X, CreditCard, Smartphone, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCashierStore } from "@/lib/stores/cashierStore"
import { PaymentService } from "@/lib/services/paymentService"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

type PaymentMethod = 'cash' | 'ewallet' | 'qris'

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, selectedCustomer, calculateTotal, checkout } = useCashierStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentAmount, setPaymentAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const total = calculateTotal()
  const paymentAmountNum = parseFloat(paymentAmount) || 0
  const change = Math.max(paymentAmountNum - total, 0)

  const handlePayment = async () => {
    if (paymentAmountNum < total) {
      setError("Jumlah pembayaran kurang dari total")
      return
    }

    setIsProcessing(true)
    setError("")

    try {
      await checkout({
        method: paymentMethod,
        amount: paymentAmountNum
      })

      // Success - close modal
      onClose()
      // Reset form
      setPaymentAmount("")
      setPaymentMethod('cash')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <CreditCard className="w-5 h-5" />
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />
      case 'qris':
        return <QrCode className="w-5 h-5" />
    }
  }

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'Tunai'
      case 'ewallet':
        return 'E-Wallet'
      case 'qris':
        return 'QRIS'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background w-full max-w-md rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Checkout</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Customer Info */}
          {selectedCustomer && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Pelanggan: {selectedCustomer.name}</p>
              {selectedCustomer.phone && (
                <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
              )}
            </div>
          )}

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Ringkasan Pesanan</h3>
            <div className="space-y-1 text-sm">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span>{item.name} x{item.qty}</span>
                  <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'ewallet', 'qris'] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? "default" : "outline"}
                  onClick={() => setPaymentMethod(method)}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  disabled={isProcessing}
                >
                  {getPaymentMethodIcon(method)}
                  <span className="text-xs">{getPaymentMethodLabel(method)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <label htmlFor="payment-amount" className="text-sm font-medium">
              Jumlah Bayar
            </label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={isProcessing}
              className="text-right"
            />
          </div>

          {/* Change */}
          {paymentAmountNum > 0 && paymentAmountNum >= total && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Kembalian</span>
                <span className="font-semibold text-green-700 dark:text-green-300">
                  Rp {change.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || paymentAmountNum < total || cart.length === 0}
              className="flex-1"
            >
              {isProcessing ? "Memproses..." : "Bayar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}