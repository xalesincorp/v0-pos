import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define available languages
export type Language = 'en' | 'id';

// Define translations structure
interface Translations {
  [key: string]: string | Translations;
}

// English translations
const enTranslations: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    confirm: 'Confirm',
  },
  navigation: {
    dashboard: 'Dashboard',
    products: 'Products',
    inventory: 'Inventory',
    customers: 'Customers',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
  },
  settings: {
    general: 'General',
    receipt: 'Receipt',
    tax: 'Tax',
    business: 'Business',
    account: 'Account',
    data: 'Data Health',
  },
  receipt: {
    showLogo: 'Show Business Logo',
    showBusinessName: 'Show Business Name',
    showAddress: 'Show Business Address',
    showPhone: 'Show Business Phone',
    showCashierName: 'Show Cashier Name',
    showTransactionDate: 'Show Transaction Date/Time',
    showItemList: 'Show Item List',
    showSubtotal: 'Show Subtotal',
    showDiscount: 'Show Discount',
    showTax: 'Show Tax',
    showTotal: 'Show Total',
    showPaymentMethod: 'Show Payment Method',
    showChange: 'Show Change',
    customMessage: 'Custom Message',
    showBarcode: 'Show Transaction Barcode/QR',
  },
  tax: {
    enableTax: 'Enable Tax on Transactions',
    taxRate: 'Tax Rate (%)',
    taxTiming: 'Tax Calculation Timing',
    beforeDiscount: 'Tax BEFORE Discount',
    afterDiscount: 'Tax AFTER Discount',
    included: 'Price INCLUDES Tax',
  },
  business: {
    businessName: 'Business Name',
    businessPhone: 'Phone Number',
    businessAddress: 'Address',
    businessEmail: 'Email',
    businessWebsite: 'Website',
  },
  account: {
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    saveProfile: 'Save Profile',
  },
  data: {
    databaseInfo: 'Database Information',
    estimatedSize: 'Estimated Size',
    status: 'Status',
    lastOptimized: 'Last Optimized',
    dataArchive: 'Data Archive',
    archiveOldData: 'Archive Old Data',
    databaseOptimization: 'Database Optimization',
    optimizeDatabase: 'Optimize Database',
    cleanUpRecords: 'Clean Up Records',
    dataSafety: 'Data Safety',
    autoBackup: 'Auto-backup enabled',
    dataEncryption: 'Data encryption',
    localStorageSync: 'Local storage sync',
  },
};

// Indonesian translations
const idTranslations: Translations = {
  common: {
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    add: 'Tambah',
    search: 'Cari',
    filter: 'Filter',
    clear: 'Bersihkan',
    yes: 'Ya',
    no: 'Tidak',
    ok: 'OK',
    close: 'Tutup',
    back: 'Kembali',
    next: 'Lanjut',
    previous: 'Sebelumnya',
    loading: 'Memuat...',
    error: 'Kesalahan',
    success: 'Berhasil',
    warning: 'Peringatan',
    info: 'Info',
    confirm: 'Konfirmasi',
  },
  navigation: {
    dashboard: 'Dasbor',
    products: 'Produk',
    inventory: 'Inventaris',
    customers: 'Pelanggan',
    reports: 'Laporan',
    settings: 'Pengaturan',
    logout: 'Keluar',
    login: 'Masuk',
  },
  settings: {
    general: 'Umum',
    receipt: 'Struk',
    tax: 'Pajak',
    business: 'Bisnis',
    account: 'Akun',
    data: 'Kesehatan Data',
  },
  receipt: {
    showLogo: 'Tampilkan Logo Bisnis',
    showBusinessName: 'Tampilkan Nama Bisnis',
    showAddress: 'Tampilkan Alamat Bisnis',
    showPhone: 'Tampilkan Nomor Telepon',
    showCashierName: 'Tampilkan Nama Kasir',
    showTransactionDate: 'Tampilkan Tanggal/Waktu Transaksi',
    showItemList: 'Tampilkan Daftar Item',
    showSubtotal: 'Tampilkan Subtotal',
    showDiscount: 'Tampilkan Diskon',
    showTax: 'Tampilkan Pajak',
    showTotal: 'Tampilkan Total',
    showPaymentMethod: 'Tampilkan Metode Pembayaran',
    showChange: 'Tampilkan Kembalian',
    customMessage: 'Pesan Kustom',
    showBarcode: 'Tampilkan Barcode/QR Transaksi',
  },
  tax: {
    enableTax: 'Aktifkan Pajak pada Transaksi',
    taxRate: 'Tarif Pajak (%)',
    taxTiming: 'Waktu Perhitungan Pajak',
    beforeDiscount: 'Pajak SEBELUM Diskon',
    afterDiscount: 'Pajak SESUDAH Diskon',
    included: 'Harga SUDAH Termasuk Pajak',
  },
  business: {
    businessName: 'Nama Bisnis',
    businessPhone: 'Nomor Telepon',
    businessAddress: 'Alamat',
    businessEmail: 'Email',
    businessWebsite: 'Website',
  },
  account: {
    fullName: 'Nama Lengkap',
    emailAddress: 'Alamat Email',
    currentPassword: 'Kata Sandi Saat Ini',
    newPassword: 'Kata Sandi Baru',
    confirmPassword: 'Konfirmasi Kata Sandi',
    changePassword: 'Ubah Kata Sandi',
    saveProfile: 'Simpan Profil',
  },
  data: {
    databaseInfo: 'Informasi Database',
    estimatedSize: 'Ukuran Perkiraan',
    status: 'Status',
    lastOptimized: 'Terakhir Dioptimalkan',
    dataArchive: 'Arsip Data',
    archiveOldData: 'Arsipkan Data Lama',
    databaseOptimization: 'Optimalisasi Database',
    optimizeDatabase: 'Optimalkan Database',
    cleanUpRecords: 'Bersihkan Catatan',
    dataSafety: 'Keamanan Data',
    autoBackup: 'Cadangan otomatis diaktifkan',
    dataEncryption: 'Enkripsi data',
    localStorageSync: 'Sinkronisasi penyimpanan lokal',
  },
};

// Translation map
const translations: Record<Language, Translations> = {
  en: enTranslations,
  id: idTranslations,
};

interface LanguageState {
  currentLanguage: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  getTranslations: () => Translations;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      currentLanguage: 'id', // Default to Indonesian
      
      t: (key: string): string => {
        const { currentLanguage } = get();
        const langTranslations = translations[currentLanguage];
        
        // Split key by dots to navigate nested objects
        const keys = key.split('.');
        let current: any = langTranslations;
        
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            // Return the key if translation not found
            return key;
          }
        }
        
        return typeof current === 'string' ? current : key;
      },
      
      setLanguage: (lang: Language) => {
        set({ currentLanguage: lang });
        // Update document language attribute
        document.documentElement.lang = lang;
        // Update direction for RTL languages if needed
        document.documentElement.dir = 'ltr';
      },
      
      getTranslations: (): Translations => {
        const { currentLanguage } = get();
        return translations[currentLanguage];
      },
    }),
    {
      name: 'language-storage',
    }
  )
);

// Service class for language functionality
class LanguageService {
  /**
   * Get translated text for a key
   */
  static t(key: string): string {
    const { t } = useLanguageStore.getState();
    return t(key);
  }

  /**
   * Set the current language
   */
  static setLanguage(lang: Language): void {
    const { setLanguage } = useLanguageStore.getState();
    setLanguage(lang);
  }

  /**
   * Get current language
   */
  static getCurrentLanguage(): Language {
    const { currentLanguage } = useLanguageStore.getState();
    return currentLanguage;
  }

  /**
   * Get available languages
   */
  static getAvailableLanguages(): Language[] {
    return ['en', 'id'];
  }

  /**
   * Initialize language service
   */
  static initialize(): void {
    // Set initial language based on user preference or system default
    const { setLanguage, currentLanguage } = useLanguageStore.getState();
    setLanguage(currentLanguage);
    
    // Set document language
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = 'ltr';
  }
}

export { LanguageService };