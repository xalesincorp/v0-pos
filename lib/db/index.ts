import Dexie, { Table } from 'dexie';
import { v7 as uuidv7 } from 'uuid';

// Define TypeScript interfaces based on Architecture.md
export interface User {
  id: string;
  supabaseId: string;
  email: string;
  name: string;
  role: 'owner' | 'kasir';
  pin: string; // hashed
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Product {
  id: string;
  name: string;
  type: 'finish_goods' | 'recipe_goods' | 'raw_material';
  categoryId: string; // categories.id
  sku: string | null;
  price: number;
  cost: number; // HPP (Average)
  image: string | null; // Base64 WebP
  monitorStock: boolean;
  minStock: number | null;
  currentStock: number; // Real stock for finish_goods/raw_material
  calculatedStock: number | null; // Calculated for recipe_goods
  uom: {
    base: string;
    conversions: { unit: string; value: number }[];
  };
  recipe: { materialId: string; qty: number; unit: string }[] | null; // for recipe_goods
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Auto-generated
  supplierId: string; // suppliers.id
  shiftId?: string | null; // cashierShifts.id - optional to maintain backward compatibility
  items: {
    productId: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: 'kas_outlet' | 'bank';
  paymentType: 'cash' | 'non_cash';
  paymentStatus: 'lunas' | 'belum_lunas' | 'bayar_sebagian'; // Payment status: Lunas, Belum Lunas, Bayar Sebagian
  paidAmount: number;
  remainingDebt: number;
  paymentDate?: Date | null; // Date of payment
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface StockOpname {
  id: string;
  shiftId?: string | null; // cashierShifts.id - optional to maintain backward compatibility
  items: {
    productId: string;
    systemStock: number;
    actualStock: number;
    variance: number;
  }[];
  notes: string | null;
  createdBy: string; // user.id
  createdAt: Date;
}

export interface StockWaste {
  id: string;
  productId: string; // products.id
  shiftId?: string | null; // cashierShifts.id - optional to maintain backward compatibility
  qty: number;
  unit: string;
  reason: string;
  createdBy: string; // user.id
  createdAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  gender: 'male' | 'female' | null;
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Transaction {
  id: string;
  transactionNumber: string; // Auto-generated
  customerId: string | null; // customers.id
  shiftId?: string | null; // cashierShifts.id - optional to maintain backward compatibility
  items: {
    productId: string;
    name: string;
    qty: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: {
    type: 'percent' | 'nominal';
    value: number;
    amount: number;
  };
  tax: {
    enabled: boolean;
    rate: number;
    amount: number;
  };
  total: number;
  payments: {
    method: 'cash' | 'ewallet' | 'qris';
    amount: number;
  }[];
  change: number;
  status: 'paid' | 'unpaid' | 'saved';
  savedAt: Date | null;
  paidAt: Date | null;
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CashierShift {
  id: string;
  openedBy: string; // user.id
  closedBy: string | null; // user.id
  openingBalance: number;
  closingBalance: number | null;
  actualCash: number | null;
  variance: number | null; // actualCash - closingBalance
  totalTransactions: number;
  totalSales: number;
  totalCash: number;
  totalNonCash: number;
  openedAt: Date;
  closedAt: Date | null;
  status: 'open' | 'closed';
}

export interface Setting {
  id: string;
  key: string; // Unique setting key
  value: any; // JSON value
  updatedBy: string; // user.id
  updatedAt: Date;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'unpaid_transaction' | 'saved_order' | 'account_update' | 'account_error';
  title: string;
  message: string;
  data: any | null; // Related data (productId, transactionId, etc)
  read: boolean;
  createdAt: Date;
}

export interface StockReturn {
  id: string;
  returnNumber: string; // Auto-generated: RT-{YYYYMMDD}-{sequence}
  supplierId: string; // suppliers.id
  originalInvoiceId: string; // invoices.id
  returnDate: Date; // When return was processed
  confirmationDate?: Date | null; // When supplier confirmed - nullable
  totalAmount: number; // Total return value
  confirmedAmount?: number | null; // Confirmed amount - nullable, can differ from total
  status: 'belum_selesai' | 'selesai'; // Return status
  notes?: string | null; // Return notes
  shiftId?: string | null; // cashierShifts.id - optional for shift tracking
  createdBy: string; // user.id
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // Soft delete
}

export interface StockReturnItem {
  id: string;
  stockReturnId: string; // stock_returns.id
  productId: string; // products.id
  quantity: number; // Qty being returned
  unitPrice: number; // Price per unit from original invoice
  totalPrice: number; // quantity × unit_price
  createdAt: Date;
  updatedAt: Date;
}

// Main Dexie database class
export class POSDatabase extends Dexie {
  users!: Table<User>;
  categories!: Table<Category>;
  products!: Table<Product>;
  suppliers!: Table<Supplier>;
  invoices!: Table<Invoice>;
  stockOpnames!: Table<StockOpname>;
  stockWastes!: Table<StockWaste>;
  customers!: Table<Customer>;
  transactions!: Table<Transaction>;
  cashierShifts!: Table<CashierShift>;
  stockReturns!: Table<StockReturn>;
  stockReturnItems!: Table<StockReturnItem>;
  settings!: Table<Setting>;
  notifications!: Table<Notification>;

  constructor() {
    super('POSDatabase');
    this.version(1).stores({
      users: 'id, supabaseId, email, role, createdAt, updatedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt',
      products: 'id, name, type, categoryId, sku, price, createdAt, updatedAt',
      suppliers: 'id, name, createdBy, createdAt, updatedAt',
      invoices: 'id, invoiceNumber, supplierId, createdAt, updatedAt',
      stockOpnames: 'id, createdAt',
      stockWastes: 'id, productId, createdAt',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt',
      transactions: 'id, transactionNumber, customerId, status, createdAt, updatedAt',
      cashierShifts: 'id, openedBy, status, openedAt, closedAt',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt',
    });

    // Add value and updatedBy fields to settings table
    this.version(6).stores({
      users: 'id, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, createdBy, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdBy, createdAt, updatedAt, deletedAt, shiftId, paymentStatus',
      stockOpnames: 'id, createdBy, createdAt, shiftId',
      stockWastes: 'id, productId, createdBy, createdAt, shiftId',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      cashierShifts: 'id, openedBy, closedBy, openedAt, closedAt, status',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt'
    }).upgrade((trans: any) => {
      // Add value and updatedBy fields to existing settings records
      return trans.table('settings').toCollection().modify((obj: any) => {
        if (obj.value === undefined) {
          obj.value = {};
        }
        if (obj.updatedBy === undefined) {
          obj.updatedBy = 'system';
        }
      });
    });

    // Add stock returns tables in version 7
    this.version(7).stores({
      users: 'id, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, createdBy, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdBy, createdAt, updatedAt, deletedAt, shiftId, paymentStatus',
      stockOpnames: 'id, createdBy, createdAt, shiftId',
      stockWastes: 'id, productId, createdBy, createdAt, shiftId',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      cashierShifts: 'id, openedBy, closedBy, openedAt, closedAt, status',
      stockReturns: 'id, returnNumber, supplierId, originalInvoiceId, status, createdAt, updatedAt, deletedAt',
      stockReturnItems: 'id, stockReturnId, productId, createdAt',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt'
    });

    // Create indexes for soft deletes
    this.version(2).stores({
      users: 'id, supabaseId, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, price, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdAt, updatedAt, deletedAt',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdAt, updatedAt, deletedAt',
      notifications: 'id, type, read, createdAt',
    });

    // Initialize database version
    this.version(3).stores({
      users: 'id, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, createdBy, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdBy, createdAt, updatedAt, deletedAt',
      stockOpnames: 'id, createdBy, createdAt',
      stockWastes: 'id, productId, createdBy, createdAt',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      cashierShifts: 'id, openedBy, closedBy, openedAt, closedAt, status',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt'
    }).upgrade(trans => {
      // Set shiftId to null for existing transactions that don't have the field
      return trans.table('transactions').toCollection().modify((obj: any) => {
        if (obj.shiftId === undefined) {
          obj.shiftId = null;
        }
      });
    });
     
    // Add shiftId to invoices, stockOpnames, and stockWastes in version 4
    this.version(4).stores({
      users: 'id, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, createdBy, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      stockOpnames: 'id, createdBy, createdAt, shiftId',
      stockWastes: 'id, productId, createdBy, createdAt, shiftId',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      cashierShifts: 'id, openedBy, closedBy, openedAt, closedAt, status',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt'
    }).upgrade((trans: any) => {
      // Set shiftId to null for existing records that don't have the field
      return Promise.all([
        trans.table('invoices').toCollection().modify((obj: any) => {
          if (obj.shiftId === undefined) {
            obj.shiftId = null;
          }
        }),
        trans.table('stockOpnames').toCollection().modify((obj: any) => {
          if (obj.shiftId === undefined) {
            obj.shiftId = null;
          }
        }),
        trans.table('stockWastes').toCollection().modify((obj: any) => {
          if (obj.shiftId === undefined) {
            obj.shiftId = null;
          }
        })
      ]);
    });

    // Add paymentStatus field to invoices in version 5
    this.version(5).stores({
      users: 'id, email, role, createdAt, updatedAt, deletedAt',
      categories: 'id, name, createdBy, createdAt, updatedAt, deletedAt',
      products: 'id, name, type, categoryId, sku, createdBy, createdAt, updatedAt, deletedAt',
      suppliers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      invoices: 'id, invoiceNumber, supplierId, createdBy, createdAt, updatedAt, deletedAt, shiftId, paymentStatus',
      stockOpnames: 'id, createdBy, createdAt, shiftId',
      stockWastes: 'id, productId, createdBy, createdAt, shiftId',
      customers: 'id, name, phone, createdBy, createdAt, updatedAt, deletedAt',
      transactions: 'id, transactionNumber, customerId, status, createdBy, createdAt, updatedAt, deletedAt, shiftId',
      cashierShifts: 'id, openedBy, closedBy, openedAt, closedAt, status',
      settings: 'id, key, updatedAt',
      notifications: 'id, type, read, createdAt'
    }).upgrade((trans: any) => {
      // Set paymentStatus to 'belum_lunas' for existing invoices that don't have the field
      return trans.table('invoices').toCollection().modify((obj: any) => {
        if (obj.paymentStatus === undefined) {
          obj.paymentStatus = 'belum_lunas';
        }
        // Also ensure remainingDebt is calculated properly
        if (obj.remainingDebt === undefined) {
          obj.remainingDebt = obj.total - (obj.paidAmount || 0);
        }
        if (obj.paymentDate === undefined) {
          obj.paymentDate = null;
        }
      });
    });
  }
}

export const db = new POSDatabase();