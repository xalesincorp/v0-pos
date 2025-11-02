"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Save } from "lucide-react"

interface BusinessSettingsConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export default function BusinessSettingsConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: BusinessSettingsConfirmationModalProps) {
  const [isConfirmLoading, setIsConfirmLoading] = useState(false)

  const handleConfirm = async () => {
    if (isConfirmLoading || isLoading) return
    
    setIsConfirmLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Error saving business settings:", error)
      // Error handling is done in the parent component
    } finally {
      setIsConfirmLoading(false)
    }
  }

  const handleClose = () => {
    if (isConfirmLoading || isLoading) return
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Save className="w-4 h-4 text-primary" />
            </div>
            Konfirmasi Simpan Pengaturan
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menyimpan perubahan pengaturan bisnis?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isConfirmLoading || isLoading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmLoading || isLoading}
            className="gap-2"
          >
            {(isConfirmLoading || isLoading) ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Menyimpan...
              </>
            ) : (
              "Ya, Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}