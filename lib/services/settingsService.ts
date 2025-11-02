import { db } from '@/lib/db';
import { Setting } from '@/lib/db/index';
import {
  AllSettings,
  SettingKey,
  receiptSettingsSchema,
  taxSettingsSchema,
  businessSettingsSchema,
  accountSettingsSchema,
  generalSettingsSchema,
  lockScreenSettingsSchema,
  exportSettingsSchema,
  dataHealthSettingsSchema
} from '@/lib/types/settings';
import { z } from 'zod';
import { logError, handleAppError } from '@/lib/utils/errorHandler';

class SettingsService {
  private defaultSettings: AllSettings = {
    receipt: {
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
    },
    tax: {
      taxEnabled: true,
      taxRate: 10,
      taxTiming: 'after_discount',
    },
    business: {
      businessName: 'Warung Bakso Sapi',
      businessPhone: '0812-3456-7890',
      businessAddress: 'Jl. Merdeka No. 123, Jakarta',
      businessEmail: 'info@warungbaksosapi.com',
      businessWebsite: 'www.warungbaksosapi.com',
    },
    account: {
      email: 'user@example.com',
      name: 'Demo User',
    },
    general: {
      language: 'id',
      theme: 'system',
      currency: 'IDR',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: 'HH:mm',
    },
    lockScreen: {
      lockScreenEnabled: false,
      lockScreenTimeout: 15,
    },
    export: {
      exportFormat: 'excel',
      exportPath: undefined,
    },
    dataHealth: {
      autoArchiveEnabled: false,
      autoArchiveDays: 365,
      autoOptimizeEnabled: false,
      autoOptimizeInterval: 30,
    },
  };

  /**
   * Get settings by key
   */
  async getSettings<T extends SettingKey>(key: T): Promise<AllSettings[T] | null> {
    try {
      const setting = await db.settings.get({ key });
      
      if (!setting) {
        return this.getDefaultSettings(key);
      }

      // Validate the retrieved settings against the schema
      const schema = this.getSchemaForSetting(key);
      if (!schema) {
        return setting.value as AllSettings[T];
      }

      const parsed = schema.safeParse(setting.value);
      if (parsed.success) {
        return parsed.data as AllSettings[T];
      } else {
        console.warn(`Invalid settings for key ${key}:`, parsed.error);
        return this.getDefaultSettings(key);
      }
    } catch (error) {
      const handledError = handleAppError(error, `Failed to get settings for key: ${key}`);
      logError(handledError, `Failed to get settings for key: ${key}`);
      return this.getDefaultSettings(key);
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<AllSettings> {
    try {
      const allSettings = {} as AllSettings;
      const keys = Object.keys(this.defaultSettings) as SettingKey[];

      for (const key of keys) {
        const setting = await this.getSettings(key);
        if (setting) {
          (allSettings as any)[key] = setting;
        }
      }

      return allSettings;
    } catch (error) {
      const handledError = handleAppError(error, 'Failed to get all settings');
      logError(handledError, 'Failed to get all settings');
      return this.defaultSettings;
    }
  }

  /**
   * Save settings by key
   */
  async saveSettings<T extends SettingKey>(key: T, settings: AllSettings[T], userId: string): Promise<void> {
    try {
      // Validate the settings against the schema
      const schema = this.getSchemaForSetting(key);
      if (schema) {
        const parsed = schema.safeParse(settings);
        if (!parsed.success) {
          throw new Error(`Invalid settings for key ${key}: ${parsed.error.message}`);
        }
        settings = parsed.data as AllSettings[T];
      }

      const setting: Setting = {
        id: `${key}_settings`,
        key,
        value: settings,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      await db.settings.put(setting);
    } catch (error) {
      const handledError = handleAppError(error, `Failed to save settings for key: ${key}`);
      logError(handledError, `Failed to save settings for key: ${key}`);
      throw error;
    }
  }

  /**
   * Save multiple settings at once
   */
  async saveMultipleSettings(settings: Partial<AllSettings>, userId: string): Promise<void> {
    try {
      const keys = Object.keys(settings) as SettingKey[];
      
      for (const key of keys) {
        if (settings[key] !== undefined) {
          await this.saveSettings(key, settings[key]!, userId);
        }
      }
    } catch (error) {
      const handledError = handleAppError(error, 'Failed to save multiple settings');
      logError(handledError, 'Failed to save multiple settings');
      throw error;
    }
  }

  /**
   * Reset settings to default for a specific key
   */
  async resetSettings<T extends SettingKey>(key: T, userId: string): Promise<void> {
    try {
      const defaultSetting = this.getDefaultSettings(key);
      if (defaultSetting) {
        await this.saveSettings(key, defaultSetting, userId);
      }
    } catch (error) {
      const handledError = handleAppError(error, `Failed to reset settings for key: ${key}`);
      logError(handledError, `Failed to reset settings for key: ${key}`);
      throw error;
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings(userId: string): Promise<void> {
    try {
      const keys = Object.keys(this.defaultSettings) as SettingKey[];
      
      for (const key of keys) {
        await this.resetSettings(key, userId);
      }
    } catch (error) {
      const handledError = handleAppError(error, 'Failed to reset all settings');
      logError(handledError, 'Failed to reset all settings');
      throw error;
    }
  }

  /**
   * Get default settings for a specific key
   */
  private getDefaultSettings<T extends SettingKey>(key: T): AllSettings[T] | null {
    return this.defaultSettings[key] || null;
  }

 /**
   * Get the appropriate Zod schema for a setting key
   */
 private getSchemaForSetting(key: SettingKey): z.ZodSchema | null {
    switch (key) {
      case 'receipt':
        return receiptSettingsSchema;
      case 'tax':
        return taxSettingsSchema;
      case 'business':
        return businessSettingsSchema;
      case 'account':
        return accountSettingsSchema;
      case 'general':
        return generalSettingsSchema;
      case 'lockScreen':
        return lockScreenSettingsSchema;
      case 'export':
        return exportSettingsSchema;
      case 'dataHealth':
        return dataHealthSettingsSchema;
      default:
        return null;
    }
  }
}

export const settingsService = new SettingsService();