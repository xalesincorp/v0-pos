"use client"
import { AlertTriangle, TrendingDown, Clock, User, ShieldAlert } from "lucide-react"
import { useNotificationStore } from "@/lib/services/notificationService"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

// Helper function to get icon based on notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'low_stock':
      return AlertTriangle;
    case 'unpaid_transaction':
      return TrendingDown;
    case 'saved_order':
      return Clock;
    case 'account_update':
      return User;
    case 'account_error':
      return ShieldAlert;
    default:
      return AlertTriangle;
  }
};

// Helper function to format timestamp
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function NotificationPanel() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);

  // Get the most recent 5 notifications for display
  const displayNotifications = notifications.slice(0, 5);

  const handleMarkAsRead = async (id: string) => {
    setIsLoading(true);
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-12 right-0 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {notifications.filter(n => !n.read).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {displayNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          displayNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const isUnread = !notification.read;
            
            return (
              <div
                key={notification.id}
                className={`p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                  isUnread ? 'bg-muted/20' : ''
                }`}
                onClick={() => isUnread && handleMarkAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground">{notification.title}</p>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatTimestamp(new Date(notification.createdAt))}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      disabled={isLoading}
                    >
                      <span className="sr-only">Dismiss</span>
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 5 && (
        <div className="p-3 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">
            Showing 5 of {notifications.length} notifications
          </span>
        </div>
      )}
    </div>
  );
}
