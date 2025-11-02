"use client"

import { Bell, Lock, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import NotificationPanel from "@/components/notifications/notification-panel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/stores/authStore"
import { useNotificationStore } from "@/lib/services/notificationService"

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { unreadCount } = useNotificationStore()

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local session
      window.location.href = "/";
    }
  }

  const handleLockScreen = () => {
    // TODO: Show PIN lock screen
    console.log("Lock screen")
  }

  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
      {/* Left: Logo/Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">POS</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Online/Offline Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
          <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-yellow-500"}`}></div>
          <span className="text-xs text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {showNotifications && <NotificationPanel />}
        </div>

        {/* Lock Screen */}
        <Button variant="ghost" size="icon" onClick={handleLockScreen} title="Lock Screen (Ctrl+L)">
          <Lock className="w-5 h-5" />
        </Button>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
