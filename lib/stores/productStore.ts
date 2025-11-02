import { create } from 'zustand';
import { db, Product, Category, Supplier, Invoice, StockOpname, StockWaste } from '../db';
import { useShiftStore } from './shiftStore';

interface ProductState {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getProductsByCategory: (categoryId: string) => Product[];
  searchProducts: (query: string) => Product[];
  initializeProducts: () => Promise<void>;
  
  // Inventory management functions
  addPurchaseInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'shiftId'>) => Promise<void>;
  updateStock: (productId: string, quantity: number, unit: string) => Promise<void>;
  addStockOpname: (opname: Omit<StockOpname, 'id' | 'createdAt' | 'shiftId'>) => Promise<void>;
  addStockWaste: (waste: Omit<StockWaste, 'id' | 'createdAt' | 'shiftId'>) => Promise<void>;
  calculateHPP: (productId: string) => Promise<number>;
  getStockHistory: (productId: string) => Promise<any[]>;
  getLowStockProducts: () => Product[];
  
  // Recipe builder functions
  addRecipe: (recipeProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Product>) => Promise<void>;
  calculateRecipeStock: (recipeProductId: string) => Promise<number>;
  validateRecipeMaterials: (recipe: { materialId: string; qty: number; unit: string }[]) => Promise<boolean>;
  
  // Supplier management functions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  searchSuppliers: (query: string) => Supplier[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  suppliers: [],
  invoices: [],
  loading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      let products = await db.products.filter(p => !p.deletedAt).toArray();
      
      // Validate and cleanup products with invalid data
      const invalidProducts = products.filter(p => !p.id || p.id.trim() === '' || !p.name || p.name.trim() === '');
      if (invalidProducts.length > 0) {
        console.log("ProductStore: Found products with invalid data:", invalidProducts.map(p => ({ id: p.id, name: p.name })));
        
        // Fix invalid products by generating proper UUIDs for missing IDs
        for (const product of invalidProducts) {
          if (!product.id || product.id.trim() === '') {
            const newId = crypto.randomUUID();
            await db.products.update(product.id, { id: newId, updatedAt: new Date() });
            console.log("ProductStore: Fixed product ID:", { oldId: product.id, newId, name: product.name });
          }
        }
        
        // Re-fetch products after cleanup
        products = await db.products.filter(p => !p.deletedAt).toArray();
      }
      
      // Additional validation to ensure all products have valid structure
      const validatedProducts = products.filter(p =>
        p.id &&
        p.id.trim() !== '' &&
        p.name &&
        p.name.trim() !== ''
      );
      
      console.log("ProductStore: Fetched and validated products", validatedProducts.map(p => ({ id: p.id, name: p.name })));
      set({ products: validatedProducts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await db.invoices.filter(i => !i.deletedAt).toArray();
      console.log("ProductStore: Fetched invoices", invoices);
      set({ invoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      let categories = await db.categories.filter(c => !c.deletedAt).toArray();
      
      // Validate and cleanup categories with invalid IDs
      const invalidCategories = categories.filter(c => !c.id || c.id.trim() === '');
      if (invalidCategories.length > 0) {
        console.log("ProductStore: Found categories with invalid IDs:", invalidCategories.map(c => ({ id: c.id, name: c.name })));
        
        // Fix invalid categories by generating proper UUIDs
        for (const category of invalidCategories) {
          const newId = crypto.randomUUID();
          await db.categories.update(category.id, { id: newId, updatedAt: new Date() });
          console.log("ProductStore: Fixed category ID:", { oldId: category.id, newId, name: category.name });
        }
        
        // Re-fetch categories after cleanup
        categories = await db.categories.filter(c => !c.deletedAt).toArray();
      }
      
      // Additional validation to ensure all categories have valid structure
      const validatedCategories = categories.filter(c =>
        c.id &&
        c.id.trim() !== '' &&
        c.name &&
        c.name.trim() !== ''
      );
      
      console.log("ProductStore: Fetched and validated categories", validatedCategories.map(c => ({ id: c.id, name: c.name })));
      set({ categories: validatedCategories, loading: false });
    } catch (error: any) {
      console.log("ProductStore: Error fetching categories", error);
      set({ error: error.message, loading: false });
    }
  },
  
  addProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      const newProduct: Product = {
        ...productData,
        id: '', // Will be auto-generated by DB
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      
      const id = await db.products.add(newProduct);
      set(state => ({
        products: [...state.products, { ...newProduct, id }],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  updateProduct: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await db.products.update(id, { ...updates, updatedAt: new Date() });
      set(state => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      // Soft delete by setting deletedAt
      await db.products.update(id, { deletedAt: new Date(), updatedAt: new Date() });
      set(state => ({
        products: state.products.map(p =>
          p.id === id ? { ...p, deletedAt: new Date(), updatedAt: new Date() } : p
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  addCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      // Validate input data
      if (!categoryData.name || categoryData.name.trim() === '') {
        throw new Error("Category name is required");
      }

      // Ensure we have a valid UUID for the category
      const categoryId = crypto.randomUUID();
      
      const newCategory: Category = {
        ...categoryData,
        id: categoryId,
        name: categoryData.name.trim(), // Ensure name is trimmed
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const id = await db.categories.add(newCategory);
      console.log("ProductStore: Added category", { id: categoryId, name: newCategory.name });
      
      // Immediately refresh categories to ensure consistency
      const updatedCategories = await db.categories.filter(c => !c.deletedAt).toArray();
      set({ categories: updatedCategories, loading: false });
    } catch (error: any) {
      console.log("ProductStore: Error adding category", error);
      set({ error: error.message, loading: false });
    }
  },
  
  updateCategory: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await db.categories.update(id, { ...updates, updatedAt: new Date() });
      console.log("ProductStore: Updated category", { id, updates });
      set(state => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c),
        loading: false
      }));
    } catch (error: any) {
      console.log("ProductStore: Error updating category", error);
      set({ error: error.message, loading: false });
    }
  },
  
  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      // Soft delete by setting deletedAt
      await db.categories.update(id, { deletedAt: new Date(), updatedAt: new Date() });
      set(state => ({
        categories: state.categories.map(c =>
          c.id === id ? { ...c, deletedAt: new Date(), updatedAt: new Date() } : c
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  getProductsByCategory: (categoryId) => {
    return get().products.filter(p => p.categoryId === categoryId && !p.deletedAt);
  },
  
  searchProducts: (query) => {
    const { products } = get();
    if (!query) return products.filter(p => !p.deletedAt);
    
    const lowerQuery = query.toLowerCase();
    return products.filter(p =>
      !p.deletedAt &&
      (p.name.toLowerCase().includes(lowerQuery) ||
       (p.sku && p.sku.toLowerCase().includes(lowerQuery)))
    );
 },
  
  initializeProducts: async () => {
    await Promise.all([
      get().fetchProducts(),
      get().fetchCategories(),
      get().fetchSuppliers()
    ]);
  },
  
  // Inventory management functions
  addPurchaseInvoice: async (invoiceData) => {
    set({ loading: true, error: null });
    try {
      // Generate invoice number and UUID for proper constraint handling
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceId = crypto.randomUUID();
      
      // Get the current shift ID if there's an active shift
      const { currentShiftId } = useShiftStore.getState();
      
      const newInvoice: Invoice = {
        ...invoiceData,
        id: invoiceId,
        invoiceNumber,
        shiftId: currentShiftId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      
      const id = await db.invoices.add(newInvoice);
      
      // Update stock for each item in the invoice
      for (const item of invoiceData.items) {
        const product = await db.products.get(item.productId);
        if (product) {
          const newCurrentStock = (product.currentStock || 0) + item.qty;
          // Update HPP (Average Cost) - simple average calculation
          let newCost = product.cost;
          if (product.cost === 0) {
            newCost = item.unitPrice;
          } else {
            const totalValue = (product.currentStock * product.cost) + (item.qty * item.unitPrice);
            newCost = totalValue / newCurrentStock;
          }
          
          await db.products.update(item.productId, {
            currentStock: newCurrentStock,
            cost: newCost,
            updatedAt: new Date()
          });
        }
      }
      
      // Refresh products after stock update
      const updatedProducts = await db.products.filter(p => !p.deletedAt).toArray();
      // Refresh invoices after adding new invoice
      const updatedInvoices = await db.invoices.filter(i => !i.deletedAt).toArray();
      set({ products: updatedProducts, invoices: updatedInvoices, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateStock: async (productId, quantity, unit) => {
    set({ loading: true, error: null });
    try {
      const product = await db.products.get(productId);
      if (!product) {
        throw new Error("Product not found");
      }
      
      // Update stock
      await db.products.update(productId, {
        currentStock: (product.currentStock || 0) + quantity,
        updatedAt: new Date()
      });
      
      // Refresh products
      const updatedProducts = await db.products.filter(p => !p.deletedAt).toArray();
      set({ products: updatedProducts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  addStockOpname: async (opnameData) => {
    set({ loading: true, error: null });
    try {
      // Get the current shift ID if there's an active shift
      const { currentShiftId } = useShiftStore.getState();
      
      const newOpname: StockOpname = {
        ...opnameData,
        id: '',
        shiftId: currentShiftId || null,
        createdAt: new Date(),
      };
      
      const id = await db.stockOpnames.add(newOpname);
      
      // Update stock based on opname results
      for (const item of opnameData.items) {
        await db.products.update(item.productId, {
          currentStock: item.actualStock,
          updatedAt: new Date()
        });
      }
      
      // Refresh products after stock update
      const updatedProducts = await db.products.filter(p => !p.deletedAt).toArray();
      set({ products: updatedProducts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  addStockWaste: async (wasteData) => {
    set({ loading: true, error: null });
    try {
      // Get the current shift ID if there's an active shift
      const { currentShiftId } = useShiftStore.getState();
      
      const newWaste: StockWaste = {
        ...wasteData,
        id: '',
        shiftId: currentShiftId || null,
        createdAt: new Date(),
      };
      
      const id = await db.stockWastes.add(newWaste);
      
      // Reduce stock for the wasted item
      const product = await db.products.get(wasteData.productId);
      if (product) {
        const newCurrentStock = Math.max(0, (product.currentStock || 0) - wasteData.qty);
        await db.products.update(wasteData.productId, {
          currentStock: newCurrentStock,
          updatedAt: new Date()
        });
      }
      
      // Refresh products after stock update
      const updatedProducts = await db.products.filter(p => !p.deletedAt).toArray();
      set({ products: updatedProducts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  calculateHPP: async (productId) => {
    // TODO: Implement proper HPP calculation based on purchase history
    // For now, return the current cost as HPP
    const product = await db.products.get(productId);
    return product ? product.cost : 0;
  },
  
  getStockHistory: async (productId) => {
    // TODO: Implement stock history tracking
    // This would return stock history including purchase invoices, opnames, and waste records
    return [];
  },
  
  getLowStockProducts: () => {
    // Return products where current stock is below minimum stock level
    return get().products.filter(p =>
      p.monitorStock && p.minStock && p.currentStock <= p.minStock
    );
  },
  
  // Recipe builder functions
  addRecipe: async (recipeProductData) => {
    set({ loading: true, error: null });
    try {
      // Validate that this is a recipe product
      if (recipeProductData.type !== 'recipe_goods') {
        throw new Error("Product must be of type 'recipe_goods' to be a recipe");
      }
      
      // Validate recipe materials
      if (recipeProductData.recipe && recipeProductData.recipe.length > 0) {
        const isValid = await get().validateRecipeMaterials(recipeProductData.recipe);
        if (!isValid) {
          throw new Error("One or more recipe materials are invalid or insufficient in stock");
        }
      }
      
      const newRecipeProduct: Product = {
        ...recipeProductData,
        id: '', // Will be auto-generated by DB
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      
      const id = await db.products.add(newRecipeProduct);
      set(state => ({
        products: [...state.products, { ...newRecipeProduct, id }],
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateRecipe: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      // Validate recipe materials if updating recipe
      if (updates.recipe && updates.recipe.length > 0) {
        const isValid = await get().validateRecipeMaterials(updates.recipe);
        if (!isValid) {
          throw new Error("One or more recipe materials are invalid or insufficient in stock");
        }
      }
      
      await db.products.update(id, { ...updates, updatedAt: new Date() });
      set(state => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  calculateRecipeStock: async (recipeProductId) => {
    try {
      const recipeProduct = await db.products.get(recipeProductId);
      if (!recipeProduct || recipeProduct.type !== 'recipe_goods' || !recipeProduct.recipe) {
        return 0;
      }
      
      // Calculate the maximum number of recipes that can be made based on available materials
      let minPossibleRecipes = Infinity;
      
      for (const material of recipeProduct.recipe) {
        const materialProduct = await db.products.get(material.materialId);
        if (!materialProduct) {
          return 0; // Material not found, can't make recipe
        }
        
        // Calculate how many recipes can be made with this material
        const possibleRecipes = Math.floor((materialProduct.currentStock || 0) / material.qty);
        minPossibleRecipes = Math.min(minPossibleRecipes, possibleRecipes);
      }
      
      return minPossibleRecipes === Infinity ? 0 : minPossibleRecipes;
    } catch (error: any) {
      console.error("Error calculating recipe stock:", error);
      return 0;
    }
  },
  
  validateRecipeMaterials: async (recipe) => {
    try {
      // Check if all materials exist and have sufficient stock
      for (const material of recipe) {
        const materialProduct = await db.products.get(material.materialId);
        if (!materialProduct) {
          return false; // Material not found
        }
        
        // Check if material has sufficient stock
        if ((materialProduct.currentStock || 0) < material.qty) {
          return false; // Insufficient stock
        }
      }
      
      return true; // All materials are valid and sufficient
    } catch (error) {
      return false; // Error occurred during validation
    }
  },
  
  // Supplier management functions
  fetchSuppliers: async () => {
    set({ loading: true, error: null });
    try {
      const suppliers = await db.suppliers.filter(s => !s.deletedAt).toArray();
      // We're storing suppliers in the products store for now, but in a real app this would be in a separate supplier store
      console.log("Fetched suppliers:", suppliers);
      set({ suppliers, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  addSupplier: async (supplierData) => {
    set({ loading: true, error: null });
    try {
      // Generate a proper UUID for the supplier to avoid constraint errors
      const supplierId = crypto.randomUUID();
      
      const newSupplier: Supplier = {
        ...supplierData,
        id: supplierId,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      
      console.log("Adding supplier:", newSupplier);
      
      await db.suppliers.add(newSupplier);
      console.log("Supplier added successfully with ID:", supplierId);
      
      // Update the store state with the new supplier immediately
      set(state => ({
        suppliers: [...state.suppliers, newSupplier],
        loading: false
      }));
      
      console.log("Store updated with new supplier:", newSupplier);
    } catch (error: any) {
      console.error("Error adding supplier:", error);
      set({ error: error.message, loading: false });
    }
  },
  
  updateSupplier: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await db.suppliers.update(id, { ...updates, updatedAt: new Date() });
      console.log("Updated supplier with ID:", id);
      
      // Update the store state with the updated supplier
      set(state => ({
        suppliers: state.suppliers.map(supplier =>
          supplier.id === id ? { ...supplier, ...updates, updatedAt: new Date() } : supplier
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  deleteSupplier: async (id) => {
    set({ loading: true, error: null });
    try {
      // Soft delete by setting deletedAt
      await db.suppliers.update(id, { deletedAt: new Date(), updatedAt: new Date() });
      console.log("Deleted supplier with ID:", id);
      
      // Update the store state by marking the supplier as deleted
      set(state => ({
        suppliers: state.suppliers.map(supplier =>
          supplier.id === id ? { ...supplier, deletedAt: new Date(), updatedAt: new Date() } : supplier
        ),
        loading: false
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
 },
  
  searchSuppliers: (query) => {
    const state = get();
    if (!query) return state.suppliers;
    
    const lowerQuery = query.toLowerCase();
    return state.suppliers.filter(supplier =>
      !supplier.deletedAt &&
      (supplier.name.toLowerCase().includes(lowerQuery) ||
       (supplier.phone && supplier.phone.toLowerCase().includes(lowerQuery)) ||
       (supplier.address && supplier.address.toLowerCase().includes(lowerQuery)))
    );
  }
}));