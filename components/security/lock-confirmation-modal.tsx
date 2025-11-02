"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, AlertTriangle, X } from "lucide-react"
import { LockScreenService } from "@/lib/services/lockScreenService"
import { useLockScreenStore } from "@/lib/services/lockScreenService"

interface LockConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onLock: () => void
}

export default function LockConfirmationModal({ isOpen, onClose, onLock }: LockConfirmationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { isLocked } = useLockScreenStore()

  if (!isOpen) return null

  const handleLockConfirm = async () => {
    setIsLoading(true)
    try {
      LockScreenService.lockScreen()
      onLock()
      onClose()
    } catch (error) {
      console.error("Error locking screen:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLockCancel = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold">Konfirmasi Lock Kasir</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Apakah Anda yakin ingin mengunci kasir?
          </p>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Kasir akan terkunci dan memerlukan PIN untuk membuka kembali.
            </AlertDescription>
          </Alert>
        </div>

        {/* Status Info */}
        {isLocked && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              Kasir sedang terkunci
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleLockCancel}
            disabled={isLoading}
            className="flex-1"
          >
            TIDAK
          </Button>
          <Button
            onClick={handleLockConfirm}
            disabled={isLoading || isLocked}
            className="flex-1 bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Mengunci...
              </>
            ) : (
              "IYA"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}