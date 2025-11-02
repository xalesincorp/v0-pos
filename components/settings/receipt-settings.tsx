"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Eye } from "lucide-react";
import { useSettings } from "@/lib/contexts/settingsContext";
import { ReceiptSettings as ReceiptSettingsType } from "@/lib/types/settings";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNotificationStore } from "@/lib/stores/notificationStore";

// Create a custom Checkbox component that matches the UI library pattern
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={`h-4 w-4 rounded border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground ${className}`}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export default function ReceiptSettings() {
   const { receiptSettings, updateReceiptSettings, isLoading, error } = useSettings();
   const { showNotification } = useNotificationStore();
   const [localSettings, setLocalSettings] = useState<ReceiptSettingsType>(receiptSettings);
   const [showPreview, setShowPreview] = useState(false);
   const [saveError, setSaveError] = useState<string | null>(null);
   const [saveSuccess, setSaveSuccess] = useState(false);
   const [localLoading, setLocalLoading] = useState(false);

  // Sync local settings with global settings
  useEffect(() => {
    setLocalSettings(receiptSettings);
    setSaveError(null); // Clear any previous errors when settings are updated
    setSaveSuccess(false); // Clear success state when settings are updated
  }, [receiptSettings]);

  const handleToggle = (field: keyof ReceiptSettingsType) => {
    setLocalSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    setSaveError(null); // Clear error when user makes changes
  };

  const handleChange = (field: keyof ReceiptSettingsType, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
    setSaveError(null); // Clear error when user makes changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setLocalLoading(true);

    try {
      await updateReceiptSettings(localSettings);
      
      // Wait minimum 1 second after successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success feedback with notification store
      showNotification({
        type: 'saved_order',
        title: 'Berhasil',
        message: 'Pengaturan template struk berhasil disimpan!',
        data: null,
      });
      setSaveSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("❌ Failed to save receipt settings:", error);
      
      const errorMessage = error?.message || 'Gagal menyimpan pengaturan template struk!';
      setSaveError(errorMessage);
      setSaveSuccess(false);
      showNotification({
        type: 'low_stock',
        title: 'Error',
        message: 'Gagal menyimpan pengaturan template struk. Silakan coba lagi.',
        data: null,
      });
    } finally {
      // Wait minimum 1 second total and then clear loading state
      setTimeout(() => {
        setLocalLoading(false);
      }, 1000);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // Receipt Preview Component - Uses SAVED settings (not local edits)
  const ReceiptPreview = () => (
    <div className="p-4 bg-white text-black font-mono text-sm max-w-xs mx-auto border rounded">
      <div className="text-center space-y-1">
        {/* Business Header - Using SAVED settings */}
        {receiptSettings.showBusinessName && (
          <div className="font-bold">Warung Bakso Sapi</div>
        )}
        {receiptSettings.showAddress && (
          <div>Jl. Merdeka No. 123, Jakarta</div>
        )}
        {receiptSettings.showPhone && (
          <div>Telp: 0812-3456-7890</div>
        )}
        
        {receiptSettings.showLogo && (
          <div className="my-2">[LOGO]</div>
        )}
      </div>

      <div className="mt-3">
        {/* Transaction Info */}
        <div>No. Transaksi: TRX-001</div>
        <div>Tanggal: {new Date().toLocaleString('id-ID')}</div>
        
        {receiptSettings.showCashierName && (
          <div>Kasir: Demo User</div>
        )}
      </div>

      <div className="mt-3">
        {receiptSettings.showItemList && (
          <>
            <div className="border-t border-b py-1 font-bold">Bakso 1 Porsi</div>
            <div className="flex justify-between">
              <span>Bakso Urat (2x)</span>
              <span>Rp 30.000</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {/* Totals */}
        {receiptSettings.showSubtotal && (
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rp 30.000</span>
          </div>
        )}
        
        {receiptSettings.showDiscount && (
          <div className="flex justify-between">
            <span>Diskon (0%):</span>
            <span>-Rp 0</span>
          </div>
        )}
        
        {receiptSettings.showTax && (
          <div className="flex justify-between">
            <span>Pajak (10%):</span>
            <span>Rp 3.000</span>
          </div>
        )}
        
        {receiptSettings.showTotal && (
          <div className="flex justify-between font-bold border-t pt-1">
            <span>TOTAL:</span>
            <span>Rp 33.000</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {/* Payment */}
        {receiptSettings.showPaymentMethod && (
          <div className="flex justify-between">
            <span>Cash:</span>
            <span>Rp 50.000</span>
          </div>
        )}
        
        {receiptSettings.showChange && (
          <div className="flex justify-between">
            <span>Kembalian:</span>
            <span>Rp 17.000</span>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        {/* Footer */}
        {receiptSettings.customMessage && (
          <div className="font-bold">{receiptSettings.customMessage}</div>
        )}
        
        {receiptSettings.showBarcode && (
          <div className="mt-2">[BARCODE]</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Template Struk</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {(error || saveError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-red-800 text-sm">
                  <strong>Error:</strong> {error || saveError}
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 text-sm">
                  <strong>Status:</strong> Pengaturan template struk berhasil disimpan!
                </div>
              </div>
            )}
            
            {/* Loading Status */}
            {!error && !saveError && !saveSuccess && !localLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-blue-800 text-sm">
                  <strong>Status:</strong> Pengaturan siap untuk disimpan
                </div>
              </div>
            )}

            {/* Horizontal Layout Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Header Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Header</h3>
                <div className="space-y-2">
                  {[
                    { key: "showLogo", label: "Tampilkan Logo" },
                    { key: "showBusinessName", label: "Tampilkan Nama Bisnis" },
                    { key: "showAddress", label: "Tampilkan alamat" },
                    { key: "showPhone", label: "Tampilkan No Telpon" },
                    { key: "showCashierName", label: "Tampilkan Nama Kasir" },
                    { key: "showTransactionDate", label: "Tampilkan Waktu Transaksi" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={localSettings[item.key as keyof ReceiptSettingsType] as boolean}
                        onCheckedChange={() => handleToggle(item.key as keyof ReceiptSettingsType)}
                      />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Body Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Body</h3>
                <div className="space-y-2">
                  {[
                    { key: "showItemList", label: "Tampilkan List Barang" },
                    { key: "showSubtotal", label: "Tampilkan Subtotal" },
                    { key: "showDiscount", label: "Tampilkan Sub Diskon" },
                    { key: "showTax", label: "Tampilkan Pajak" },
                    { key: "showTotal", label: "Tampilkan Total" },
                    { key: "showPaymentMethod", label: "Tampilkan Metode Pembayaran" },
                    { key: "showChange", label: "Tampilkan Kembalian" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={localSettings[item.key as keyof ReceiptSettingsType] as boolean}
                        onCheckedChange={() => handleToggle(item.key as keyof ReceiptSettingsType)}
                      />
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Footer</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Pesan Custom</label>
                  <Input
                    value={localSettings.customMessage}
                    onChange={(e) => handleChange("customMessage", e.target.value)}
                    placeholder="Add custom message for receipt footer"
                    className="w-full p-3 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={localSettings.showBarcode} onCheckedChange={() => handleToggle("showBarcode")} />
                  <span className="text-sm font-medium text-foreground">Tampilkan Barcode/QR Transaksi</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="gap-2 bg-transparent"
                disabled={localLoading}
                onClick={handlePreview}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={localLoading}
              >
                <Save className="w-4 h-4" />
                {localLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
            
            {/* Loading State Indicator */}
            {localLoading && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Menyimpan pengaturan...</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Template Struk</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <ReceiptPreview />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
