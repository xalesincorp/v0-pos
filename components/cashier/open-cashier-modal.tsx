"use client"

import { useState, useEffect } from "react"
import { X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/stores/authStore"
import { useShiftStore } from "@/lib/stores/shiftStore"
import { toast } from "sonner"

interface OpenCashierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function OpenCashierModal({ isOpen, onClose, onSuccess }: OpenCashierModalProps) {
  const { user } = useAuthStore()
  const [openingBalance, setOpeningBalance] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setOpeningBalance("")
      setError("")
    }
  }, [isOpen])

  const validateOpeningBalance = (value: string): boolean => {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) {
      setError("Saldo awal harus berupa angka positif")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      setError("User tidak ditemukan")
      return
    }

    if (!validateOpeningBalance(openingBalance)) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const balance = parseFloat(openingBalance)
      await useShiftStore.getState().openShift(user.id, balance)

      toast.success("Kasir berhasil dibuka")
      onClose()
      onSuccess?.()
    } catch (err: any) {
      console.error("Error opening cashier shift:", err)
      setError(err.message || "Gagal membuka kasir")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOpeningBalance(value)

    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-md rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Buka Kasir</h2>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Masukkan saldo awal kasir untuk memulai shift Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="opening-balance" className="text-sm font-medium text-foreground">Saldo Awal (Rp)</label>
              <Input
                id="opening-balance"
                type="number"
                placeholder="0"
                value={openingBalance}
                onChange={handleInputChange}
                disabled={isLoading}
                className="text-right"
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await useAuthStore.getState().logout();
                    window.location.href = "/";
                  } catch (error) {
                    console.error('Logout error:', error);
                    // Even if logout fails, clear local session
                    window.location.href = "/";
                  }
                }}
                disabled={isLoading}
                className="flex-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Log Out
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !openingBalance.trim()}
                className="flex-1"
              >
                {isLoading ? "Membuka Kasir..." : "Buka Kasir"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
