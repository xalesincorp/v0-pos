import { create } from 'zustand';
import { Customer } from '../db';
import { CustomerService } from '../services/customerService';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  searchCustomers: (query: string) => Customer[];
  initializeCustomers: () => Promise<void>;
  getCustomerStats: (customerId: string) => Promise<{ totalTransactions: number; totalSpent: number; lastTransaction: Date | null; avgTransactionValue: number }>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  loading: false,
  error: null,
  
  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const customers = await CustomerService.getAll();
      set({ customers, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  addCustomer: async (customerData) => {
    set({ loading: true, error: null });
    try {
      const newCustomer = await CustomerService.create(customerData);
      set(state => ({
        customers: [...state.customers, newCustomer],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error; // Re-throw to allow caller to handle
    }
  },
  
  updateCustomer: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedCustomer = await CustomerService.update(id, updates);
      if (updatedCustomer) {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? updatedCustomer : c),
          loading: false
        }));
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  deleteCustomer: async (id) => {
    set({ loading: true, error: null });
    try {
      await CustomerService.delete(id);
      set(state => ({
        customers: state.customers.map(c =>
          c.id === id ? { ...c, deletedAt: new Date(), updatedAt: new Date() } : c
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  searchCustomers: (query) => {
    const { customers } = get();
    if (!query) return customers.filter(c => !c.deletedAt);
    
    const lowerQuery = query.toLowerCase();
    return customers.filter(c =>
      !c.deletedAt &&
      (c.name.toLowerCase().includes(lowerQuery) ||
       (c.phone && c.phone.toLowerCase().includes(lowerQuery)))
    );
 },
  
 getCustomerStats: async (customerId) => {
    return await CustomerService.getCustomerStats(customerId);
  },

  initializeCustomers: async () => {
    await get().fetchCustomers();
  }
}));