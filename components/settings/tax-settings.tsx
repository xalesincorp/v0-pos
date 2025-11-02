"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Label } from "@radix-ui/react-label";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { TaxSettings as TaxSettingsType } from "@/lib/types/settings";

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

export default function TaxSettings() {
  const { getSetting, updateSetting, isLoading } = useSettingsStore();
  const { user } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);
  const [settings, setSettings] = useState<TaxSettingsType>({
    taxEnabled: true,
    taxRate: 10,
    taxTiming: "after_discount", // 'before_discount' | 'after_discount' | 'included'
  });

  // Load initial settings
 useEffect(() => {
    const initialSettings = getSetting('tax');
    if (initialSettings) {
      // Ensure taxTiming has a valid value
      const validSettings = {
        ...initialSettings,
        taxTiming: initialSettings.taxTiming && ['before_discount', 'after_discount', 'included'].includes(initialSettings.taxTiming)
          ? initialSettings.taxTiming
          : 'after_discount'
      };
      setSettings(validSettings);
    }
  }, [getSetting]);

  const handleChange = (field: keyof TaxSettingsType, value: any) => {
    // For taxTiming, ensure only valid enum values are accepted
    if (field === 'taxTiming') {
      if (!value || !['before_discount', 'after_discount', 'included'].includes(value)) {
        value = 'after_discount'; // Default to a valid value
      }
    }
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLocalLoading(true);
    
    try {
      await updateSetting('tax', settings, user.id);
      
      // Wait minimum 1 second after successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Pengaturan pajak berhasil disimpan!", {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      console.error("Failed to save tax settings:", error);
      
      toast.error("Gagal menyimpan pengaturan pajak. Silakan coba lagi.", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      // Wait minimum 1 second total and then clear loading state
      setTimeout(() => {
        setLocalLoading(false);
      }, 1000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Pajak</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enable Tax */}
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={settings.taxEnabled}
              onCheckedChange={(checked: boolean) => handleChange("taxEnabled", checked)}
            />
            <span className="text-sm font-medium text-foreground">Aktifkan Pajak pada Transaksi</span>
          </label>

          {settings.taxEnabled && (
            <>
              {/* Tax Rate */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tarif Pajak (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => handleChange("taxRate", Number(e.target.value))}
                />
              </div>

              {/* Tax Timing */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Waktu Perhitungan Pajak</label>
                <Select value={settings.taxTiming} onValueChange={(value) => handleChange("taxTiming", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before_discount">Pajak SEBELUM Diskon</SelectItem>
                    <SelectItem value="after_discount">Pajak SETELAH Diskon</SelectItem>
                    <SelectItem value="included">Harga SUDAH termasuk Pajak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Example Calculation */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-semibold text-foreground">Contoh Perhitungan:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {settings.taxTiming === "before_discount" && (
                    <>
                      <p>Subtotal: Rp 100.000</p>
                      <p>Pajak (10%): Rp 10.000</p>
                      <p>Subtotal dengan Pajak: Rp 110.000</p>
                      <p>Diskon (10%): Rp 11.000</p>
                      <p className="font-semibold text-foreground">Total: Rp 99.000</p>
                    </>
                  )}
                  {settings.taxTiming === "after_discount" && (
                    <>
                      <p>Subtotal: Rp 100.000</p>
                      <p>Diskon (10%): Rp 10.000</p>
                      <p>Subtotal setelah Diskon: Rp 90.000</p>
                      <p>Pajak (10%): Rp 9.000</p>
                      <p className="font-semibold text-foreground">Total: Rp 99.000</p>
                    </>
                  )}
                  {settings.taxTiming === "included" && (
                    <>
                      <p>Harga Tampilan: Rp 110.000 (sudah termasuk pajak 10%)</p>
                      <p>Harga Sebenarnya: Rp 100.000</p>
                      <p>Pajak: Rp 10.000 (sudah termasuk)</p>
                      <p className="font-semibold text-foreground">Total: Rp 110.000</p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90" disabled={localLoading}>
              <Save className="w-4 h-4" />
              {localLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
