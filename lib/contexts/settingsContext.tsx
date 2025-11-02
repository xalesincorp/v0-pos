"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "@/lib/services/settingsService";
import { 
  ReceiptSettings, 
  TaxSettings, 
  BusinessSettings, 
  AccountSettings,
  GeneralSettings,
  LockScreenSettings,
  ExportSettings,
  DataHealthSettings
} from "@/lib/types/settings";

interface SettingsContextType {
  // Receipt settings
  receiptSettings: ReceiptSettings;
  updateReceiptSettings: (settings: Partial<ReceiptSettings>) => Promise<void>;
  
  // Tax settings
  taxSettings: TaxSettings;
  updateTaxSettings: (settings: Partial<TaxSettings>) => Promise<void>;
  
  // Business settings
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  
  // Account settings
  accountSettings: AccountSettings;
  updateAccountSettings: (settings: Partial<AccountSettings>) => Promise<void>;
  
  // General settings
  generalSettings: GeneralSettings;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => Promise<void>;
  
  // Lock screen settings
  lockScreenSettings: LockScreenSettings;
  updateLockScreenSettings: (settings: Partial<LockScreenSettings>) => Promise<void>;
  
  // Export settings
  exportSettings: ExportSettings;
  updateExportSettings: (settings: Partial<ExportSettings>) => Promise<void>;
  
  // Data health settings
  dataHealthSettings: DataHealthSettings;
  updateDataHealthSettings: (settings: Partial<DataHealthSettings>) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Initialize settings
  initializeSettings: () => Promise<void>;
  
  // Reset settings
  resetSettings: (key: string) => Promise<void>;
  resetAllSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings>({
    showLogo: true,
    showBusinessName: true,
    showAddress: true,
    showPhone: true,
    showCashierName: true,
    showTransactionDate: true,
    showItemList: true,
    showSubtotal: true,
    showDiscount: true,
    showTax: true,
    showTotal: true,
    showPaymentMethod: true,
    showChange: true,
    customMessage: "Terima kasih atas kunjungan Anda!",
    showBarcode: true,
  });
  
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    taxEnabled: true,
    taxRate: 10,
    taxTiming: 'after_discount',
  });
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Warung Bakso Sapi',
    businessPhone: '0812-3456-7890',
    businessAddress: 'Jl. Merdeka No. 123, Jakarta',
    businessEmail: 'info@warungbaksosapi.com',
    businessWebsite: 'www.warungbaksosapi.com',
  });
  
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    email: 'user@example.com',
    name: 'Demo User',
  });
  
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'id',
    theme: 'system',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
  });
  
  const [lockScreenSettings, setLockScreenSettings] = useState<LockScreenSettings>({
    lockScreenEnabled: false,
    lockScreenTimeout: 15,
  });
  
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    exportFormat: 'excel',
    exportPath: undefined,
  });
  
  const [dataHealthSettings, setDataHealthSettings] = useState<DataHealthSettings>({
    autoArchiveEnabled: false,
    autoArchiveDays: 365,
    autoOptimizeEnabled: false,
    autoOptimizeInterval: 30,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize settings on mount
  useEffect(() => {
    const initSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all settings
        const allSettings = await settingsService.getAllSettings();
        
        if (allSettings.receipt) {
          setReceiptSettings(allSettings.receipt);
        }
        
        if (allSettings.tax) {
          setTaxSettings(allSettings.tax);
        }
        
        if (allSettings.business) {
          setBusinessSettings(allSettings.business);
        }
        
        if (allSettings.account) {
          setAccountSettings(allSettings.account);
        }
        
        if (allSettings.general) {
          setGeneralSettings(allSettings.general);
        }
        
        if (allSettings.lockScreen) {
          setLockScreenSettings(allSettings.lockScreen);
        }
        
        if (allSettings.export) {
          setExportSettings(allSettings.export);
        }
        
        if (allSettings.dataHealth) {
          setDataHealthSettings(allSettings.dataHealth);
        }
      } catch (err) {
        console.error('Error initializing settings:', err);
        setError('Failed to initialize settings');
      } finally {
        setIsLoading(false);
      }
    };

    initSettings();
  }, []);

  // Update receipt settings
  const updateReceiptSettings = async (settings: Partial<ReceiptSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...receiptSettings, ...settings };
      await settingsService.saveSettings('receipt', updatedSettings, 'system');
      setReceiptSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating receipt settings:', err);
      setError('Failed to update receipt settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update tax settings
  const updateTaxSettings = async (settings: Partial<TaxSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...taxSettings, ...settings };
      await settingsService.saveSettings('tax', updatedSettings, 'system');
      setTaxSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating tax settings:', err);
      setError('Failed to update tax settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update business settings
  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...businessSettings, ...settings };
      await settingsService.saveSettings('business', updatedSettings, 'system');
      setBusinessSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating business settings:', err);
      setError('Failed to update business settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update account settings
  const updateAccountSettings = async (settings: Partial<AccountSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...accountSettings, ...settings };
      await settingsService.saveSettings('account', updatedSettings, 'system');
      setAccountSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating account settings:', err);
      setError('Failed to update account settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update general settings
  const updateGeneralSettings = async (settings: Partial<GeneralSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...generalSettings, ...settings };
      await settingsService.saveSettings('general', updatedSettings, 'system');
      setGeneralSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating general settings:', err);
      setError('Failed to update general settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update lock screen settings
  const updateLockScreenSettings = async (settings: Partial<LockScreenSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...lockScreenSettings, ...settings };
      await settingsService.saveSettings('lockScreen', updatedSettings, 'system');
      setLockScreenSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating lock screen settings:', err);
      setError('Failed to update lock screen settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update export settings
  const updateExportSettings = async (settings: Partial<ExportSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...exportSettings, ...settings };
      await settingsService.saveSettings('export', updatedSettings, 'system');
      setExportSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating export settings:', err);
      setError('Failed to update export settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update data health settings
  const updateDataHealthSettings = async (settings: Partial<DataHealthSettings>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...dataHealthSettings, ...settings };
      await settingsService.saveSettings('dataHealth', updatedSettings, 'system');
      setDataHealthSettings(updatedSettings);
    } catch (err) {
      console.error('Error updating data health settings:', err);
      setError('Failed to update data health settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize settings
  const initializeSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all settings
      const allSettings = await settingsService.getAllSettings();
      
      if (allSettings.receipt) {
        setReceiptSettings(allSettings.receipt);
      }
      
      if (allSettings.tax) {
        setTaxSettings(allSettings.tax);
      }
      
      if (allSettings.business) {
        setBusinessSettings(allSettings.business);
      }
      
      if (allSettings.account) {
        setAccountSettings(allSettings.account);
      }
      
      if (allSettings.general) {
        setGeneralSettings(allSettings.general);
      }
      
      if (allSettings.lockScreen) {
        setLockScreenSettings(allSettings.lockScreen);
      }
      
      if (allSettings.export) {
        setExportSettings(allSettings.export);
      }
      
      if (allSettings.dataHealth) {
        setDataHealthSettings(allSettings.dataHealth);
      }
    } catch (err) {
      console.error('Error initializing settings:', err);
      setError('Failed to initialize settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset settings
  const resetSettings = async (key: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await settingsService.resetSettings(key as any, 'system');
      
      // Reload settings for the specific key
      const settings = await settingsService.getSettings(key as any);
      
      switch (key) {
        case 'receipt':
          setReceiptSettings(settings || {
            showLogo: true,
            showBusinessName: true,
            showAddress: true,
            showPhone: true,
            showCashierName: true,
            showTransactionDate: true,
            showItemList: true,
            showSubtotal: true,
            showDiscount: true,
            showTax: true,
            showTotal: true,
            showPaymentMethod: true,
            showChange: true,
            customMessage: "Terima kasih atas kunjungan Anda!",
            showBarcode: true,
          });
          break;
        case 'tax':
          setTaxSettings(settings || {
            taxEnabled: true,
            taxRate: 10,
            taxTiming: 'after_discount',
          });
          break;
        case 'business':
          setBusinessSettings(settings || {
            businessName: 'Warung Bakso Sapi',
            businessPhone: '0812-3456-7890',
            businessAddress: 'Jl. Merdeka No. 123, Jakarta',
            businessEmail: 'info@warungbaksosapi.com',
            businessWebsite: 'www.warungbaksosapi.com',
          });
          break;
        case 'account':
          setAccountSettings(settings || {
            email: 'user@example.com',
            name: 'Demo User',
          });
          break;
        case 'general':
          setGeneralSettings(settings || {
            language: 'id',
            theme: 'system',
            currency: 'IDR',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: 'HH:mm',
          });
          break;
        case 'lockScreen':
          setLockScreenSettings(settings || {
            lockScreenEnabled: false,
            lockScreenTimeout: 15,
          });
          break;
        case 'export':
          setExportSettings(settings || {
            exportFormat: 'excel',
            exportPath: undefined,
          });
          break;
        case 'dataHealth':
          setDataHealthSettings(settings || {
            autoArchiveEnabled: false,
            autoArchiveDays: 365,
            autoOptimizeEnabled: false,
            autoOptimizeInterval: 30,
          });
          break;
      }
    } catch (err) {
      console.error(`Error resetting ${key} settings:`, err);
      setError(`Failed to reset ${key} settings`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all settings
  const resetAllSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await settingsService.resetAllSettings('system');
      
      // Reset all settings to defaults
      setReceiptSettings({
        showLogo: true,
        showBusinessName: true,
        showAddress: true,
        showPhone: true,
        showCashierName: true,
        showTransactionDate: true,
        showItemList: true,
        showSubtotal: true,
        showDiscount: true,
        showTax: true,
        showTotal: true,
        showPaymentMethod: true,
        showChange: true,
        customMessage: "Terima kasih atas kunjungan Anda!",
        showBarcode: true,
      });
      
      setTaxSettings({
        taxEnabled: true,
        taxRate: 10,
        taxTiming: 'after_discount',
      });
      
      setBusinessSettings({
        businessName: 'Warung Bakso Sapi',
        businessPhone: '0812-3456-7890',
        businessAddress: 'Jl. Merdeka No. 123, Jakarta',
        businessEmail: 'info@warungbaksosapi.com',
        businessWebsite: 'www.warungbaksosapi.com',
      });
      
      setAccountSettings({
        email: 'user@example.com',
        name: 'Demo User',
      });
      
      setGeneralSettings({
        language: 'id',
        theme: 'system',
        currency: 'IDR',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
      });
      
      setLockScreenSettings({
        lockScreenEnabled: false,
        lockScreenTimeout: 15,
      });
      
      setExportSettings({
        exportFormat: 'excel',
        exportPath: undefined,
      });
      
      setDataHealthSettings({
        autoArchiveEnabled: false,
        autoArchiveDays: 365,
        autoOptimizeEnabled: false,
        autoOptimizeInterval: 30,
      });
    } catch (err) {
      console.error('Error resetting all settings:', err);
      setError('Failed to reset all settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    // Receipt settings
    receiptSettings,
    updateReceiptSettings,
    
    // Tax settings
    taxSettings,
    updateTaxSettings,
    
    // Business settings
    businessSettings,
    updateBusinessSettings,
    
    // Account settings
    accountSettings,
    updateAccountSettings,
    
    // General settings
    generalSettings,
    updateGeneralSettings,
    
    // Lock screen settings
    lockScreenSettings,
    updateLockScreenSettings,
    
    // Export settings
    exportSettings,
    updateExportSettings,
    
    // Data health settings
    dataHealthSettings,
    updateDataHealthSettings,
    
    // Loading state
    isLoading,
    error,
    
    // Initialize settings
    initializeSettings,
    
    // Reset settings
    resetSettings,
    resetAllSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}