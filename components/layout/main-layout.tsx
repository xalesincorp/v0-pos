"use client"
 
import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import LockScreen from "@/components/security/lock-screen"
import NotificationProvider from "@/components/providers/notification-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLockScreenStore } from "@/lib/services/lockScreenService"
import { setupAuthStateListener } from "@/lib/stores/authStore"

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  header?: ReactNode
}

export default function MainLayout({ children, showSidebar = true, header }: MainLayoutProps) {
  const isMobile = useIsMobile()
  const { isLocked } = useLockScreenStore()
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    // Set up auth state change listener when layout mounts
    const authSubscription = setupAuthStateListener();
    
    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe?.();
      }
    };
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true)
  }

  return (
    <div className="flex h-screen bg-background flex-col">
      {/* Lock Screen */}
      {isLocked && <LockScreen onUnlock={handleUnlock} />}
      
      {/* Header - if provided */}
      {header && header}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        {showSidebar && !isMobile && !isLocked && (
          <div className="relative border-r border-border bg-card transition-all duration-300">
            <Sidebar />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <main className="h-full overflow-auto">
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </main>
        </div>
      </div>
    </div>
  )
}
