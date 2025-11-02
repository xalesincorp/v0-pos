"use client";
import React, { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NotificationService,
  useNotificationStore
} from "@/lib/services/notificationService";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const { notifications, unreadCount, initialize } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  // Initialize notifications on mount
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await initialize();
        console.log("Notifications initialized");
      } catch (error) {
        console.error("Failed to initialize notifications:", error);
      }
    };

    initNotifications();
  }, [initialize]);

  // Removed automatic toast triggering to prevent duplicate toasts
  // Toast notifications are now handled explicitly by components via showNotification
  // This prevents the same notification from being shown multiple times during navigation

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await NotificationService.deleteNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  return (
    <>
      {children}
      
      {/* Notification Bell Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed bottom-20 right-6 z-50 w-full max-w-sm">
          <div className="rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`p-4 ${!notification.read ? 'bg-muted' : ''}`}
                    >
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{notification.title}</h4>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}