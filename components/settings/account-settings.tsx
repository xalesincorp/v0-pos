"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Lock, Mail, AlertCircle, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settingsStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { AccountSettings as AccountSettingsType } from "@/lib/types/settings";
import { authService } from "@/lib/config/supabase";
import toast from "react-hot-toast";
import { NotificationService } from "@/lib/services/notificationService";

export default function AccountSettings() {
  const { getSetting, updateSetting, isLoading } = useSettingsStore();
  const { user } = useAuthStore();
const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState<AccountSettingsType & { currentPassword: string; newPassword: string; confirmPassword: string }>({
    email: "",
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Enhanced notification functions
    const showSuccessNotification = async (message: string) => {
      toast.success(message, {
        duration: 3000,
        position: 'top-right',
      });
      
      // Add to notification store for persistent notifications
      await NotificationService.addAccountUpdateNotification(message);
    };
  
    const showErrorNotification = async (message: string) => {
      toast.error(message, {
        duration: 5000,
        position: 'top-right',
      });
      
      // Add error to notification store for persistent tracking
      await NotificationService.addAccountErrorNotification(message);
    };

  // Load initial settings
  useEffect(() => {
    if (user) {
      // Get saved account settings from IndexedDB
      const initialSettings = getSetting('account');
      setFormData(prev => ({
        ...prev,
        email: user.email, // Use current user's email
        name: user.name, // Use current user's name
        ...(initialSettings && { name: initialSettings.name }) // Override with saved name if exists
      }));
    }
  }, [getSetting, user]);

  const handleChange = (field: keyof AccountSettingsType | 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLocalLoading(true);
    
    try {
      // Only update the name in IndexedDB (email is read-only from Supabase)
      const accountSettings: AccountSettingsType = {
        email: user.email, // Keep original email
        name: formData.name,
      };
      
      // Update the name in IndexedDB via settings service
      await updateSetting('account', accountSettings, user.id);
      
      // Update user name in auth store and local database
      const { db } = await import('@/lib/db');
      const updatedUser = {
        ...user,
        name: formData.name,
        updatedAt: new Date()
      };
      
      await db.users.put(updatedUser);
      useAuthStore.setState({ user: updatedUser });
      
      // Use unified notification system
      await showSuccessNotification('Profil berhasil diperbarui');
      setError(null);
    } catch (error) {
      console.error("Failed to update profile:", error);
      await showErrorNotification('Gagal memperbarui profil');
      setSuccess(null);
    } finally {
      setLocalLoading(false);
    }
  };

const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      await showErrorNotification("Password baru dan konfirmasi password tidak cocok!");
      return;
    }

    if (formData.newPassword.length < 6) {
      await showErrorNotification("Password baru minimal 6 karakter!");
      return;
    }

    if (!formData.currentPassword) {
      await showErrorNotification("Password saat ini harus diisi!");
      return;
    }

    setLocalLoading(true);
    
    try {
      // Check if current password is correct by attempting to sign in
      try {
        await authService.signIn(user.email, formData.currentPassword);
      } catch (signInError) {
        await showErrorNotification("Password saat ini tidak valid!");
        return;
      }

      // Update password using Supabase updateUser
      await authService.updateUser({ password: formData.newPassword });
      
      // Use unified notification system
      await showSuccessNotification('Password berhasil diubah! Password baru sudah aktif dan bisa digunakan untuk login.');
      setShowPasswordForm(false);
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      
    } catch (error: any) {
      console.error("Password change error:", error);
      
      if (error.message?.includes('Email not confirmed')) {
        await showErrorNotification('Anda perlu mengkonfirmasi email Anda terlebih dahulu. Periksa inbox email Anda.');
      } else if (error.message?.includes('Password should be at least')) {
        await showErrorNotification('Password harus minimal 6 karakter!');
      } else {
        await showErrorNotification('Gagal mengubah password. Silakan coba lagi.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nama Lengkap</label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nama lengkap anda"
              />
            </div>

<div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Alamat Email
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  readOnly
                  className="bg-muted/50"
                />
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah. Hubungi administrator untuk perubahan email.
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90" disabled={localLoading}>
                <Save className="w-4 h-4" />
                {localLoading ? 'Menyimpan...' : 'Simpan Profil'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)} variant="outline" className="gap-2 bg-transparent" disabled={isLoading}>
              <Lock className="w-4 h-4" />
              Ganti Password
            </Button>
          ) : (
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password saat ini</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleChange("currentPassword", e.target.value)}
                    placeholder="•••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password baru</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                    placeholder="•••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Konfirmasi Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    placeholder="•••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)} disabled={localLoading}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={localLoading}>
                  {localLoading ? 'Merubah...' : 'Rubah Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
