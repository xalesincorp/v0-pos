"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LockScreenService } from "@/lib/services/lockScreenService"
import { useAuthStore } from "@/lib/stores/authStore"
import { useLockScreenStore } from "@/lib/services/lockScreenService"
import { Lock, Shield, AlertTriangle, CheckCircle } from "lucide-react"

export default function CashierSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [timeoutValue, setTimeoutValue] = useState(15)
  
  const { user } = useAuthStore()
  const { isLocked } = useLockScreenStore()
  const [isPinEnabled, setIsPinEnabled] = useState(user?.pin ? true : false)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const validatePinFormat = (pin: string) => {
    if (!pin || pin.length < 4) {
      return "PIN harus minimal 4 digit"
    }
    if (!/^\d+$/.test(pin)) {
      return "PIN hanya boleh berisi angka"
    }
    return null
  }

  const handleEnablePin = async () => {
    if (!newPin.trim()) {
      showMessage('error', "Silakan masukkan PIN baru")
      return
    }

    const validation = validatePinFormat(newPin)
    if (validation) {
      showMessage('error', validation)
      return
    }

    if (newPin !== confirmPin) {
      showMessage('error', "Konfirmasi PIN tidak cocok")
      return
    }

    setIsLoading(true)
    try {
      if (user) {
        // Update the user's PIN using the store function
        const { updateUserPin } = useAuthStore.getState()
        await updateUserPin(newPin)
        setIsPinEnabled(true)
        setCurrentPin(newPin)
        setNewPin("")
        setConfirmPin("")
        showMessage('success', "PIN berhasil diaktifkan")
      }
    } catch (error) {
      console.error('Error enabling PIN:', error)
      showMessage('error', "Gagal mengaktifkan PIN")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePin = async () => {
    if (!currentPin.trim() || !newPin.trim()) {
      showMessage('error', "Silakan lengkapi semua field")
      return
    }

    const validation = validatePinFormat(newPin)
    if (validation) {
      showMessage('error', validation)
      return
    }

    if (newPin !== confirmPin) {
      showMessage('error', "Konfirmasi PIN tidak cocok")
      return
    }

    setIsLoading(true)
    try {
      if (user) {
        // Update the user's PIN using the store function
        const { updateUserPin } = useAuthStore.getState()
        await updateUserPin(newPin)
        setCurrentPin(newPin)
        setNewPin("")
        setConfirmPin("")
        showMessage('success', "PIN berhasil diubah")
      }
    } catch (error) {
      console.error('Error changing PIN:', error)
      showMessage('error', "Gagal mengubah PIN")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisablePin = () => {
    setIsPinEnabled(false)
    showMessage('success', "PIN berhasil dinonaktifkan")
  }

  const handleTimeoutChange = (newTimeout: number) => {
    setTimeoutValue(newTimeout)
    LockScreenService.setLockScreenTimeout(newTimeout)
    showMessage('success', "Timeout lock screen berhasil diperbarui")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pengaturan Kasir</h2>
        <p className="text-sm text-muted-foreground">
          Kelola pengaturan keamanan dan lock screen untuk kasir
        </p>
      </div>

      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Status Keamanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status Kunci Layar</p>
              <p className="text-sm text-muted-foreground">
                {isLocked ? "Layar terkunci" : "Layar tidak terkunci"}
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isLocked ? 'text-destructive' : 'text-green-500'}`}>
              {isLocked ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isLocked ? "Terkunci" : "Terbuka"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Perlindungan PIN</p>
              <p className="text-sm text-muted-foreground">
                {isPinEnabled ? "Aktif" : "Nonaktif"}
              </p>
            </div>
            <div className={`flex items-center gap-2 ${isPinEnabled ? 'text-green-500' : 'text-muted-foreground'}`}>
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isPinEnabled ? "Aktif" : "Non-Aktif"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Konfigurasi PIN
          </CardTitle>
          <CardDescription>
            Atur PIN untuk membuka lock screen kasir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPinEnabled ? (
            // Enable PIN Form
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPin" className="text-sm font-medium text-foreground">PIN Baru</label>
                <Input
                  id="newPin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru (minimal 4 digit)"
                  maxLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPin" className="text-sm font-medium text-foreground">Konfirmasi PIN</label>
                <Input
                  id="confirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Konfirmasi PIN baru"
                  maxLength={6}
                />
              </div>

              <Button 
                onClick={handleEnablePin}
                disabled={isLoading || !newPin.trim() || !confirmPin.trim()}
                className="w-full"
              >
                {isLoading ? "Mengaktifkan..." : "Aktifkan PIN"}
              </Button>
            </div>
          ) : (
            // Change PIN Form
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPin" className="text-sm font-medium text-foreground">PIN Saat Ini</label>
                <Input
                  id="currentPin"
                  type="password"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Masukkan PIN saat ini"
                  maxLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="changeNewPin" className="text-sm font-medium text-foreground">PIN Baru</label>
                <Input
                  id="changeNewPin"
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Masukkan PIN baru"
                  maxLength={6}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="changeConfirmPin" className="text-sm font-medium text-foreground">Konfirmasi PIN Baru</label>
                <Input
                  id="changeConfirmPin"
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Konfirmasi PIN baru"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleChangePin}
                  disabled={isLoading || !currentPin.trim() || !newPin.trim() || !confirmPin.trim()}
                  className="flex-1"
                >
                  {isLoading ? "Mengubah..." : "Ubah PIN"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDisablePin}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Nonaktifkan
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lock Screen Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Lock Screen</CardTitle>
          <CardDescription>
            Atur timeout dan perilaku lock screen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="timeout" className="text-sm font-medium text-foreground">Timeout Lock Screen (menit)</label>
            <select
              id="timeout"
              value={timeoutValue}
              onChange={(e) => handleTimeoutChange(Number(e.target.value))}
              className="w-full p-2 border border-input rounded-md bg-background"
            >
              <option value={5}>5 menit</option>
              <option value={10}>10 menit</option>
              <option value={15}>15 menit</option>
              <option value={30}>30 menit</option>
              <option value={60}>60 menit</option>
            </select>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Lock screen akan otomatis aktif setelah periode tidak ada aktivitas sesuai timeout yang diatur.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}