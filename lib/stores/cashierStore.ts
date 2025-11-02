import { create } from 'zustand';
import { db, Transaction, Customer, Product } from '../db';
import { TransactionService } from '../services/transactionService';
import { PaymentService } from '../services/paymentService';
import { SavedOrderService } from '../services/savedOrderService';
import { CashierShiftService } from '../services/cashierShiftService';
import { useShiftStore } from './shiftStore';
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';
import { CalculationService } from '../services/calculationService';

interface CartItem {
  productId: string;
  name: string;
 price: number;
  qty: number;
  subtotal: number;
}

interface CashierState {
  cart: CartItem[];
  savedOrders: Transaction[];
  selectedCustomer: Customer | null;
  activeTransaction: Transaction | null;
  
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  saveOrder: (notes?: string) => Promise<void>;
  loadSavedOrder: (orderId: string) => Promise<void>;
  selectCustomer: (customer: Customer | null) => void;
  calculateSubtotal: () => number;
  calculateTotal: () => number;
  calculateTax: () => number;
  calculateDiscount: () => number;
  checkout: (payment: { method: string; amount: number }) => Promise<void>;
  initializeCashier: () => Promise<void>;
}

export const useCashierStore = create<CashierState>((set, get) => ({
  cart: [],
  savedOrders: [],
  selectedCustomer: null,
  activeTransaction: null,
  
  addToCart: (product) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      const updatedCart = cart.map(item =>
        item.productId === product.id
          ? { 
              ...item, 
              qty: item.qty + 1, 
              subtotal: (item.qty + 1) * item.price 
            }
          : item
      );
      set({ cart: updatedCart });
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        subtotal: product.price,
      };
      set({ cart: [...cart, newItem] });
    }
  },
  
  removeFromCart: (productId) => {
    const { cart } = get();
    set({ 
      cart: cart.filter(item => item.productId !== productId) 
    });
  },
  
  updateQuantity: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    
    const { cart } = get();
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          qty,
          subtotal: qty * item.price
        };
      }
      return item;
    });
    
    set({ cart: updatedCart });
  },
  
  clearCart: () => {
    set({ cart: [] });
  },
  
 saveOrder: async (notes) => {
   const { cart, selectedCustomer } = get();
   if (cart.length === 0) return;

   // Get current user for createdBy field
   const { user } = useAuthStore.getState();
   if (!user?.id) {
     throw new Error('User not authenticated. Please log in to save orders.');
   }

   // Calculate totals
   const subtotal = get().calculateSubtotal();
   const tax = get().calculateTax();
   const discount = get().calculateDiscount();
   const total = subtotal + tax - discount;

   // Get tax settings for proper database storage
   const taxSettings = useSettingsStore.getState().getSetting('tax') || {
     taxEnabled: true,
     taxRate: 10,
     taxTiming: 'after_discount'
   };

   // Create transaction object using the new service
           const { currentShiftId } = useShiftStore.getState();
           const transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'paidAt'> = {
             customerId: selectedCustomer?.id || null,
             shiftId: currentShiftId || null, // Include the current shift ID if available
             items: cart.map(item => ({
               productId: item.productId,
               name: item.name,
               qty: item.qty,
               price: item.price,
               subtotal: item.subtotal
             })),
             subtotal,
             discount: { type: 'nominal', value: 0, amount: discount },
             tax: {
               enabled: taxSettings.taxEnabled,
               rate: taxSettings.taxRate,
               amount: tax
             },
             total,
             payments: [],
             change: 0,
             status: 'saved',
             savedAt: new Date(),
             createdBy: user.id, // Get current user ID from auth store
           };

   try {
     console.log('Saving order with status:', transactionData.status);
     // Use the new service to save the transaction
     const savedTransaction = await SavedOrderService.saveOrder(transactionData);

     // Add to saved orders
     set(state => ({
       savedOrders: [...state.savedOrders, savedTransaction],
       cart: [],
       selectedCustomer: null,
       activeTransaction: null // Clear active transaction after saving
     }));
   } catch (error) {
     console.error('Failed to save order:', error);
     throw error;
   }
 },
  
 loadSavedOrder: async (orderId) => {
    const savedOrder = await SavedOrderService.getSavedOrderById(orderId);
    
    if (savedOrder) {
      console.log('Loading saved order:', orderId, 'Status:', savedOrder.status);
      set({
        cart: savedOrder.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          qty: item.qty,
          subtotal: item.subtotal,
        })),
        selectedCustomer: savedOrder.customerId ? { id: savedOrder.customerId } as Customer : null,
        activeTransaction: savedOrder, // Set activeTransaction to track the loaded saved order
      });
      console.log('Saved order loaded, activeTransaction set:', savedOrder.id);
    }
  },
  
  selectCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },
  
 calculateSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  },
  
  calculateTax: () => {
    // Get tax settings from settings store
    const taxSettings = useSettingsStore.getState().getSetting('tax');
    
    if (!taxSettings || !taxSettings.taxEnabled) {
      return 0;
    }
    
    const subtotal = get().calculateSubtotal();
    const discountAmount = get().calculateDiscount();
    
    // Use CalculationService with proper tax timing
    return CalculationService.calculateTax(subtotal, discountAmount, {
      enabled: taxSettings.taxEnabled,
      rate: taxSettings.taxRate,
      timing: taxSettings.taxTiming
    });
  },
  
 calculateDiscount: () => {
    // For now, no discount - this would be configurable in real app
    return 0;
  },
  
  calculateTotal: () => {
    const subtotal = get().calculateSubtotal();
    const tax = get().calculateTax();
    const discount = get().calculateDiscount();
    return subtotal + tax - discount;
  },
  
  checkout: async (payment) => {
    const { cart, selectedCustomer, activeTransaction } = get();
    if (cart.length === 0) return;
    
    // Get current user for createdBy field
    const { user } = useAuthStore.getState();
    if (!user?.id) {
      throw new Error('User not authenticated. Please log in to process payments.');
    }
    
    // Calculate totals
    const subtotal = get().calculateSubtotal();
    const tax = get().calculateTax();
    const discount = get().calculateDiscount();
    const total = subtotal + tax - discount;
    
    // Get tax settings for proper database storage
    const taxSettings = useSettingsStore.getState().getSetting('tax') || {
      taxEnabled: true,
      taxRate: 10,
      taxTiming: 'after_discount'
    };
    
    // Map payment method to allowed types
    const paymentMethod: 'cash' | 'ewallet' | 'qris' =
      payment.method === 'cash' ? 'cash' :
      payment.method === 'ewallet' ? 'ewallet' :
      'qris';
    
    try {
      let transactionId: string;
      
      console.log('Checkout started. ActiveTransaction:', activeTransaction?.id, 'Status:', activeTransaction?.status);
      
      // Check if we have an activeTransaction from a loaded saved order
      if (activeTransaction && activeTransaction.status === 'saved') {
        console.log('Processing saved order checkout, ID:', activeTransaction.id);
        // Use the existing transaction ID from the saved order
        transactionId = activeTransaction.id;
        
        // Process payment using the saved order service
        const paymentResult = await SavedOrderService.convertToPaidOrder(
          transactionId,
          paymentMethod,
          payment.amount
        );
        
        if (!paymentResult) {
          throw new Error('Failed to process payment for saved order');
        }
        
        console.log('Saved order payment successful');
      } else {
        console.log('Creating new transaction for checkout');
        // Create a new transaction for fresh orders
        const { currentShiftId } = useShiftStore.getState();
        const transactionData: Omit<Transaction, 'id' | 'transactionNumber' | 'createdAt' | 'updatedAt' | 'deletedAt'> = {
          customerId: selectedCustomer?.id || null,
          shiftId: currentShiftId || null,
          items: cart.map(item => ({
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal
          })),
          subtotal,
          discount: { type: 'nominal', value: 0, amount: discount },
          tax: {
            enabled: taxSettings.taxEnabled,
            rate: taxSettings.taxRate,
            amount: tax
          },
          total,
          payments: [],
          change: 0,
          status: 'paid',
          savedAt: null,
          paidAt: null,
          createdBy: user.id,
        };
        
        // Create the transaction first
        const newTransaction = await TransactionService.create(transactionData);
        transactionId = newTransaction.id;

        // Process the payment using the payment service
        const paymentResult = await PaymentService.processPayment(transactionId, {
          method: paymentMethod,
          amount: payment.amount
        });

        if (!paymentResult.success) {
          throw new Error(paymentResult.message);
        }
        
        console.log('New transaction payment successful');
      }

      // Clear cart and reset state
      set({
        cart: [],
        selectedCustomer: null,
        activeTransaction: null // Clear activeTransaction after successful checkout
      });
      
      console.log('Checkout completed successfully');
    } catch (error) {
      console.error('Failed to checkout:', error);
      throw error;
    }
  },
  
  initializeCashier: async () => {
    // Load saved orders from database
    const savedTransactions = await db.transactions.where('status').equals('saved').toArray();
    set({ savedOrders: savedTransactions });
  }
}));