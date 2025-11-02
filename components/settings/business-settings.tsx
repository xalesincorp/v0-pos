"use client"

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { BusinessSettings as BusinessSettingsType } from "@/lib/types/settings";
import BusinessSettingsConfirmationModal from "./business-settings-modal";

export default function BusinessSettings() {
  const { getSetting, updateSetting, isLoading } = useSettingsStore();
  const { user } = useAuthStore();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState<BusinessSettingsType>({
    businessName: "",
    businessPhone: "",
    businessAddress: "",
    businessEmail: "",
    businessWebsite: "",
  });

  // Load initial settings
  useEffect(() => {
    const initialSettings = getSetting('business');
    if (initialSettings) {
      setFormData(initialSettings);
    }
  }, [getSetting]);

  const handleChange = (field: keyof BusinessSettingsType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    // Show confirmation modal instead of directly saving
    setShowConfirmationModal(true);
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true; // Allow empty strings
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // If it doesn't start with protocol, try adding https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        try {
          const testUrl = `https://${url}`;
          new URL(testUrl);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  // Format URL helper
  const formatUrl = (url: string): string => {
    if (!url || url.trim() === '') return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleConfirmSave = async () => {
    if (!user) return;
    
    // Validate URL format
    if (formData.businessWebsite && !isValidUrl(formData.businessWebsite)) {
      toast.error("Format website tidak valid. Gunakan format seperti: www.business.com atau https://business.com", {
        duration: 4000,
        position: 'top-right',
      });
      throw new Error("Invalid URL format");
    }
    
    try {
      // Format the URL before saving
      const formattedData = {
        ...formData,
        businessWebsite: formatUrl(formData.businessWebsite || '')
      };
      
      await updateSetting('business', formattedData, user.id);
      
      // Wait minimum 1 second after successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Pengaturan bisnis berhasil disimpan!", {
        duration: 3000,
        position: 'top-right',
      });
      
      // Clear local loading state after delay
      setTimeout(() => {
        setLocalLoading(false);
        setShowConfirmationModal(false);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to save business settings:", error);
      
      // Clear loading state immediately on error
      setLocalLoading(false);
      
      toast.error("Gagal menyimpan pengaturan bisnis. Silakan coba lagi.", {
        duration: 4000,
        position: 'top-right',
      });
      throw error; // Re-throw to be handled by modal
    }
  };

  const handleCloseModal = () => {
    setShowConfirmationModal(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Bisnis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveClick} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Bisnis *</label>
            <Input
              value={formData.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="Nama bisnis Anda"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nomor Telepon</label>
              <Input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => handleChange("businessPhone", e.target.value)}
                placeholder="0812-3456-7890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={formData.businessEmail}
                onChange={(e) => handleChange("businessEmail", e.target.value)}
                placeholder="info@bisnis.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Alamat</label>
            <textarea
              value={formData.businessAddress || ""}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              placeholder="Alamat bisnis"
              className="w-full h-20 p-3 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Website</label>
            <Input
              value={formData.businessWebsite || ""}
              onChange={(e) => handleChange("businessWebsite", e.target.value)}
              placeholder="www.bisnis.com"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="button"
              onClick={handleSaveClick}
              className="gap-2 bg-primary hover:bg-primary/90"
              disabled={localLoading}
            >
              <Save className="w-4 h-4" />
              {localLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </CardContent>

      {/* Confirmation Modal */}
      <BusinessSettingsConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSave}
        isLoading={isLoading}
      />
    </Card>
  )
}
