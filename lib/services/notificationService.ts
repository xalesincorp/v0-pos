import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification as NotificationType } from '@/lib/db';
import { db } from '@/lib/db';

interface NotificationState {
  notifications: NotificationType[];
  unreadCount: number;
  
  addNotification: (notification: Omit<NotificationType, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: async (notificationData) => {
        try {
          // Create notification with boolean value (will be stored as 0/1 by Dexie)
          const newNotification: any = {
            id: crypto.randomUUID(), // Using crypto.randomUUID() for better ID generation
            ...notificationData,
            createdAt: new Date(),
            read: 0, // Store as 0 for false in Dexie
          };
          
          // Add to database
          await db.notifications.add(newNotification);
          
          // Update state - convert back to boolean for the UI
          const notificationForState: NotificationType = {
            ...newNotification,
            read: false, // Convert back to boolean for state
          };
          
          const { notifications } = get();
          set({
            notifications: [notificationForState, ...notifications],
            unreadCount: get().unreadCount + 1,
          });
        } catch (error) {
          console.error('Error adding notification:', error);
        }
      },
      
      markAsRead: async (id) => {
        try {
          // Update in database - using 1 for true as per Dexie boolean storage
          await db.notifications.update(id, { read: 1 } as any);
          
          // Update state
          const { notifications } = get();
          const updatedNotifications = notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          );
          
          set({
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length,
          });
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      },
      
      markAllAsRead: async () => {
        try {
          // Update all unread notifications in database - using 0 for false as per Dexie storage
          const unreadNotifications = await db.notifications.where('read').equals(0).toArray();
          for (const notification of unreadNotifications) {
            await db.notifications.update(notification.id, { read: 1 } as any);
          }
          
          // Update state
          const { notifications } = get();
          const updatedNotifications = notifications.map(notification => ({
            ...notification,
            read: true,
          }));
          
          set({
            notifications: updatedNotifications,
            unreadCount: 0,
          });
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
        }
      },
      
      deleteNotification: async (id) => {
        try {
          // Delete from database
          await db.notifications.delete(id);
          
          // Update state
          const { notifications } = get();
          const updatedNotifications = notifications.filter(notification => notification.id !== id);
          
          set({
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length,
          });
        } catch (error) {
          console.error('Error deleting notification:', error);
        }
      },
      
      deleteAllNotifications: async () => {
        try {
          // Delete all from database
          await db.notifications.clear();
          
          // Update state
          set({
            notifications: [],
            unreadCount: 0,
          });
        } catch (error) {
          console.error('Error deleting all notifications:', error);
        }
      },
      
      initialize: async () => {
        try {
          // Load notifications from database
          const notifications = await db.notifications.orderBy('createdAt').reverse().toArray();
          // Convert Dexie's stored boolean values (0/1) to actual booleans for the state
          const processedNotifications = notifications.map(notification => ({
            ...notification,
            read: Boolean(notification.read) // Convert 0/1 to false/true
          }));
          const unreadCount = processedNotifications.filter(n => !n.read).length;
          
          set({
            notifications: processedNotifications,
            unreadCount,
          });
        } catch (error) {
          console.error('Error initializing notifications:', error);
          set({
            notifications: [],
            unreadCount: 0,
          });
        }
      },
    }),
    {
      name: 'notification-storage',
    }
 )
);

// Service class for notification functionality
class NotificationService {
  /**
   * Add a new notification
   */
  static async addNotification(
    type: 'low_stock' | 'unpaid_transaction' | 'saved_order' | 'account_update' | 'account_error' | string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    // Validate the type to ensure it's one of the expected values
    const validTypes: Array<'low_stock' | 'unpaid_transaction' | 'saved_order' | 'account_update' | 'account_error' | string> = [
      'low_stock',
      'unpaid_transaction',
      'saved_order',
      'account_update',
      'account_error'
    ];
    
    const notificationType = validTypes.includes(type) ? type as 'low_stock' | 'unpaid_transaction' | 'saved_order' | 'account_update' | 'account_error' : 'low_stock';
    
    const { addNotification } = useNotificationStore.getState();
    await addNotification({
      type: notificationType,
      title,
      message,
      data,
    });
  }

  /**
   * Add a low stock notification
   */
  static async addLowStockNotification(productId: string, productName: string, currentStock: number): Promise<void> {
    await this.addNotification(
      'low_stock',
      'Low Stock Alert',
      `Product "${productName}" has low stock: ${currentStock} remaining`,
      { productId, currentStock }
    );
 }

  /**
   * Add an unpaid transaction notification
   */
  static async addUnpaidTransactionNotification(transactionId: string, customerName: string, amount: number): Promise<void> {
    await this.addNotification(
      'unpaid_transaction',
      'Unpaid Transaction',
      `Transaction for customer "${customerName}" with amount Rp ${amount.toLocaleString('id-ID')} is unpaid`,
      { transactionId, customerName, amount }
    );
  }

 /**
  * Add a saved order notification
  */
 static async addSavedOrderNotification(transactionId: string, customerName: string): Promise<void> {
   await this.addNotification(
     'saved_order',
     'Order Saved',
     `Order for customer "${customerName}" has been saved successfully`,
     { transactionId, customerName }
   );
 }

 /**
  * Add an account update notification
  */
 static async addAccountUpdateNotification(message: string): Promise<void> {
   await this.addNotification(
     'account_update',
     'Account Update',
     message
   );
 }

 /**
  * Add an account error notification
  */
 static async addAccountErrorNotification(message: string): Promise<void> {
   await this.addNotification(
     'account_error',
     'Account Error',
     message
   );
 }

  /**
   * Get all notifications
   */
  static getNotifications(): NotificationType[] {
    const { notifications } = useNotificationStore.getState();
    return notifications;
  }

  /**
   * Get unread notifications count
   */
  static getUnreadCount(): number {
    const { unreadCount } = useNotificationStore.getState();
    return unreadCount;
  }

 /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    const { markAsRead } = useNotificationStore.getState();
    await markAsRead(id);
 }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    const { markAllAsRead } = useNotificationStore.getState();
    await markAllAsRead();
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: string): Promise<void> {
    const { deleteNotification } = useNotificationStore.getState();
    await deleteNotification(id);
  }

  /**
   * Initialize the notification service
   */
  static async initialize(): Promise<void> {
    const { initialize } = useNotificationStore.getState();
    await initialize();
  }

}

export { NotificationService };