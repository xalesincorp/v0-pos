"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useAuthStore } from "@/lib/stores/authStore"
import { useShiftStore } from "@/lib/stores/shiftStore"
import OpenCashierModal from "@/components/cashier/open-cashier-modal"

// Dynamically import components to avoid SSR issues with Zustand
const CashierPage = dynamic(() => import("@/components/pages/cashier-page"), { ssr: false })
const LoginPage = dynamic(() => import("@/components/pages/login-page"), { ssr: false })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [showOpenCashierModal, setShowOpenCashierModal] = useState(false)
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const loading = useAuthStore((state) => state.loading)
  const user = useAuthStore((state) => state.user)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  useEffect(() => {
    // Initialize authentication state
    const initAuth = async () => {
      await initializeAuth();
      setIsLoading(false);
    };

    initAuth();
  }, [initializeAuth])

  // Check for active shift when user is authenticated
  useEffect(() => {
    const checkShiftStatus = async () => {
      if (isAuthenticated && user?.id && !isLoading) {
        console.log('[DEBUG] Main page: User authenticated, checking shift status for user:', user.id);
        try {
          await useShiftStore.getState().checkShiftStatus(user.id);
          const isShiftOpen = useShiftStore.getState().isShiftOpen();
          console.log('[DEBUG] Main page: isShiftOpen result:', isShiftOpen);
          if (!isShiftOpen) {
            console.log('[DEBUG] Main page: No active shift, showing open cashier modal');
            setShowOpenCashierModal(true);
          } else {
            console.log('[DEBUG] Main page: Active shift found, not showing modal');
          }
        } catch (error) {
          console.error("Error checking shift status:", error);
        }
      } else {
        console.log('[DEBUG] Main page: Not checking shift status - isAuthenticated:', isAuthenticated, 'user.id:', user?.id, 'isLoading:', isLoading);
        if (!isAuthenticated) {
          console.log('[DEBUG] Main page: User not authenticated, hiding open cashier modal');
          setShowOpenCashierModal(false);
        }
      }
    };

    checkShiftStatus();
  }, [isAuthenticated, user?.id, isLoading])

  // Show loading state while initializing auth
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated ? <CashierPage /> : <LoginPage />}
      {isAuthenticated && (
        <OpenCashierModal
          isOpen={showOpenCashierModal}
          onClose={() => setShowOpenCashierModal(false)}
          onSuccess={() => {
            setShowOpenCashierModal(false);
            router.push('/cashier');
          }}
        />
      )}
    </>
  )
}
