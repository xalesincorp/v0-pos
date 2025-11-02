import { z } from 'zod';

// Receipt settings schema
export const receiptSettingsSchema = z.object({
  showLogo: z.boolean().default(true),
  showBusinessName: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  showCashierName: z.boolean().default(true),
  showTransactionDate: z.boolean().default(true),
  showItemList: z.boolean().default(true),
  showSubtotal: z.boolean().default(true),
  showDiscount: z.boolean().default(true),
  showTax: z.boolean().default(true),
  showTotal: z.boolean().default(true),
  showPaymentMethod: z.boolean().default(true),
  showChange: z.boolean().default(true),
  customMessage: z.string().default("Terima kasih atas kunjungan Anda!"),
  showBarcode: z.boolean().default(true),
});

// Tax settings schema
export const taxSettingsSchema = z.object({
 taxEnabled: z.boolean().default(true),
  taxRate: z.number().min(0).max(100).default(10),
  taxTiming: z.enum(['before_discount', 'after_discount', 'included']).default('after_discount'),
});

// Business settings schema
export const businessSettingsSchema = z.object({
 businessName: z.string().min(1, "Business name is required").max(255),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessWebsite: z.string().url().optional(),
});

// Account settings schema
export const accountSettingsSchema = z.object({
 email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required").max(255),
});

// General settings schema
export const generalSettingsSchema = z.object({
  language: z.enum(['en', 'id']).default('id'),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  currency: z.string().default('IDR'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  timeFormat: z.string().default('HH:mm'),
});

// Lock screen settings schema
export const lockScreenSettingsSchema = z.object({
 lockScreenEnabled: z.boolean().default(false),
  lockScreenTimeout: z.number().min(1).max(60).default(15), // in minutes
});

// Export settings schema
export const exportSettingsSchema = z.object({
  exportFormat: z.enum(['excel', 'pdf', 'csv']).default('excel'),
  exportPath: z.string().optional(),
});

// Data health settings schema
export const dataHealthSettingsSchema = z.object({
  autoArchiveEnabled: z.boolean().default(false),
  autoArchiveDays: z.number().min(1).max(3650).default(365),
  autoOptimizeEnabled: z.boolean().default(false),
  autoOptimizeInterval: z.number().min(1).max(365).default(30),
});

// All settings schema
export const allSettingsSchema = z.object({
  receipt: receiptSettingsSchema.optional(),
  tax: taxSettingsSchema.optional(),
  business: businessSettingsSchema.optional(),
  account: accountSettingsSchema.optional(),
  general: generalSettingsSchema.optional(),
  lockScreen: lockScreenSettingsSchema.optional(),
  export: exportSettingsSchema.optional(),
  dataHealth: dataHealthSettingsSchema.optional(),
});

// Type inference
export type ReceiptSettings = z.infer<typeof receiptSettingsSchema>;
export type TaxSettings = z.infer<typeof taxSettingsSchema>;
export type BusinessSettings = z.infer<typeof businessSettingsSchema>;
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type LockScreenSettings = z.infer<typeof lockScreenSettingsSchema>;
export type ExportSettings = z.infer<typeof exportSettingsSchema>;
export type DataHealthSettings = z.infer<typeof dataHealthSettingsSchema>;
export type AllSettings = z.infer<typeof allSettingsSchema>;

// Setting key types
export type SettingKey = keyof AllSettings;