import { db, Customer } from '../db';
import { validateCustomer, safeValidateCustomer } from '../utils/validators';
import { v7 as uuidv7 } from 'uuid';

// Helper function to clean up validation result and ensure proper null values
function cleanCustomerData(data: any): Customer {
  return {
    ...data,
    phone: data.phone || null,
    gender: data.gender || null,
    deletedAt: data.deletedAt || null,
  };
}

export class CustomerService {
  // Create a new customer
  static async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<Customer> {
    try {
      // Prepare the customer object with required fields
      const customerToCreate: Customer = {
        ...customerData,
        phone: customerData.phone || null,
        gender: customerData.gender || null,
        id: uuidv7(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      };

      // Ensure createdBy is set (required by schema)
      if (!customerToCreate.createdBy) {
        throw new Error('createdBy field is required when creating a customer');
      }
      
      // Validate the customer data
      const validation = safeValidateCustomer(customerToCreate);
      
      if (!validation.success) {
        throw new Error(`Customer validation failed: ${validation.error.message}`);
      }
      
      // Clean the validation result to ensure proper null values
      const cleanedData = cleanCustomerData(validation.data);
      
      // Add to database
      const id = await db.customers.add(cleanedData);
      
      // Return the created customer
      return { ...cleanedData, id };
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customer by ID
  static async getById(id: string): Promise<Customer | null> {
    try {
      const customer = await db.customers.get(id);
      return customer || null;
    } catch (error) {
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get all customers
  static async getAll(): Promise<Customer[]> {
    try {
      const customers = await db.customers.toArray();
      // Sort by createdAt in descending order
      return customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Failed to get customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customers with search filter
  static async search(query: string): Promise<Customer[]> {
    try {
      const customers = await db.customers.filter(customer =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        (customer.phone !== null && customer.phone.includes(query))
      ).toArray();
      
      // Sort by createdAt in descending order
      return customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Failed to search customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update customer
  static async update(id: string, updateData: Partial<Customer>): Promise<Customer | null> {
    try {
      // Get the existing customer
      const existingCustomer = await db.customers.get(id);
      if (!existingCustomer) {
        return null;
      }

      // Prepare updated customer data
      const updatedCustomer = {
        ...existingCustomer,
        ...updateData,
        updatedAt: new Date()
      };

      // Validate the updated data
      const validation = safeValidateCustomer(updatedCustomer);
      if (!validation.success) {
        throw new Error(`Customer validation failed: ${validation.error.message}`);
      }

      // Clean the validation result to ensure proper null values
      const cleanedData = cleanCustomerData(validation.data);

      // Update in database
      await db.customers.update(id, cleanedData);
      
      // Return updated customer
      return { ...cleanedData, id };
    } catch (error) {
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Soft delete customer
  static async delete(id: string): Promise<boolean> {
    try {
      await db.customers.update(id, { deletedAt: new Date() });
      return true; // Assuming deletion was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hard delete customer (only for development/testing)
  static async hardDelete(id: string): Promise<boolean> {
    try {
      await db.customers.delete(id);
      return true; // Assuming deletion was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to hard delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get deleted customers
  static async getDeleted(): Promise<Customer[]> {
    try {
      const deletedCustomers = await db.customers.filter(customer => customer.deletedAt !== null).toArray();
      return deletedCustomers;
    } catch (error) {
      throw new Error(`Failed to get deleted customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Restore soft deleted customer
  static async restore(id: string): Promise<boolean> {
    try {
      await db.customers.update(id, { deletedAt: null });
      return true; // Assuming restoration was successful if no error was thrown
    } catch (error) {
      throw new Error(`Failed to restore customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customer by phone number
  static async getByPhone(phone: string): Promise<Customer | null> {
    try {
      const customer = await db.customers.where('phone').equals(phone).first();
      return customer || null;
    } catch (error) {
      throw new Error(`Failed to get customer by phone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get customer statistics
  static async getCustomerStats(customerId: string): Promise<{ totalTransactions: number; totalSpent: number; lastTransaction: Date | null; avgTransactionValue: number }> {
    try {
      // Get all transactions for this customer that are paid
      const transactions = await db.transactions
        .filter(tx => tx.customerId === customerId && tx.status === 'paid')
        .toArray();
      
      const totalTransactions = transactions.length;
      const totalSpent = transactions.reduce((sum, tx) => sum + tx.total, 0);
      const avgTransactionValue = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
      
      // Find the most recent transaction date
      const lastTransaction = transactions.length > 0
        ? transactions.reduce((latest, tx) =>
            tx.paidAt && tx.paidAt > latest ? tx.paidAt : latest,
            new Date(0)
          )
        : null;

      return {
        totalTransactions,
        totalSpent,
        lastTransaction,
        avgTransactionValue
      };
    } catch (error) {
      throw new Error(`Failed to get customer stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}