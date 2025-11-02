import { z } from 'zod';

// User validation schema
export const userSchema = z.object({
  id: z.string().uuid(),
  supabaseId: z.string(),
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['owner', 'kasir']),
  pin: z.string().optional(), // Can be empty initially
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Category validation schema
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Product validation schema
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['finish_goods', 'recipe_goods', 'raw_material']),
  categoryId: z.string().uuid(),
  sku: z.string().nullable().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  image: z.string().nullable().optional(),
  monitorStock: z.boolean(),
  minStock: z.number().nullable().optional(),
  currentStock: z.number().min(0, 'Current stock must be non-negative'),
  calculatedStock: z.number().nullable().optional(),
  uom: z.object({
    base: z.string(),
    conversions: z.array(
      z.object({
        unit: z.string(),
        value: z.number(),
      })
    ),
  }),
  recipe: z.array(
    z.object({
      materialId: z.string().uuid(),
      qty: z.number(),
      unit: z.string(),
    })
  ).nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Customer validation schema
export const customerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().nullable().optional(),
  gender: z.enum(['male', 'female']).nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Transaction validation schema
export const transactionSchema = z.object({
  id: z.string().uuid(),
  transactionNumber: z.string(),
 customerId: z.string().uuid().nullable().optional(),
  shiftId: z.string().uuid().nullable().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      name: z.string(),
      qty: z.number().min(1, 'Quantity must be at least 1'),
      price: z.number().min(0, 'Price must be non-negative'),
      subtotal: z.number().min(0, 'Subtotal must be non-negative'),
    })
  ),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  discount: z.object({
    type: z.enum(['percent', 'nominal']),
    value: z.number().min(0, 'Discount value must be non-negative'),
    amount: z.number().min(0, 'Discount amount must be non-negative'),
  }),
  tax: z.object({
    enabled: z.boolean(),
    rate: z.number().min(0, 'Tax rate must be non-negative'),
    amount: z.number().min(0, 'Tax amount must be non-negative'),
  }),
  total: z.number().min(0, 'Total must be non-negative'),
  payments: z.array(
    z.object({
      method: z.enum(['cash', 'ewallet', 'qris']),
      amount: z.number().min(0, 'Payment amount must be non-negative'),
    })
  ),
  change: z.number(),
  status: z.enum(['paid', 'unpaid', 'saved']),
  savedAt: z.date().nullable().optional(),
  paidAt: z.date().nullable().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
 password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Product form validation schema
export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['finish_goods', 'recipe_goods', 'raw_material']),
  categoryId: z.string().uuid('Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  cost: z.number().min(0, 'Cost must be non-negative'),
  monitorStock: z.boolean(),
  minStock: z.number().min(0).optional().or(z.literal(null)),
  currentStock: z.number().min(0, 'Current stock must be non-negative'),
  recipe: z.array(
    z.object({
      materialId: z.string().uuid(),
      qty: z.number().min(0, 'Quantity must be non-negative'),
      unit: z.string(),
    })
  ).optional(),
});

// Customer form validation schema
export const customerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
});

// Validation utility functions
export const validateUser = (data: unknown) => userSchema.parse(data);
export const validateCategory = (data: unknown) => categorySchema.parse(data);
export const validateProduct = (data: unknown) => productSchema.parse(data);
export const validateCustomer = (data: unknown) => customerSchema.parse(data);
export const validateTransaction = (data: unknown) => transactionSchema.parse(data);
export const validateLogin = (data: unknown) => loginSchema.parse(data);
export const validateProductForm = (data: unknown) => productFormSchema.parse(data);
export const validateCustomerForm = (data: unknown) => customerFormSchema.parse(data);

// Safe validation function that returns result instead of throwing
export const safeValidateUser = (data: unknown) => userSchema.safeParse(data);
export const safeValidateCategory = (data: unknown) => categorySchema.safeParse(data);
export const safeValidateProduct = (data: unknown) => productSchema.safeParse(data);
export const safeValidateCustomer = (data: unknown) => customerSchema.safeParse(data);
export const safeValidateTransaction = (data: unknown) => transactionSchema.safeParse(data);
export const safeValidateLogin = (data: unknown) => loginSchema.safeParse(data);
export const safeValidateProductForm = (data: unknown) => productFormSchema.safeParse(data);
export const safeValidateCustomerForm = (data: unknown) => customerFormSchema.safeParse(data);