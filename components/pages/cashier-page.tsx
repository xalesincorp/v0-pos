"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import MainLayout from "@/components/layout/main-layout"
import ProductGrid from "@/components/cashier/product-grid"
import ProductHeader from "@/components/cashier/product-header"
import SummaryOrder from "@/components/cashier/summary-order"
import { useProductStore } from "@/lib/stores/productStore"
import { useCashierStore } from "@/lib/stores/cashierStore"
import { useShiftStore } from "@/lib/stores/shiftStore"
import { useAuthStore } from "@/lib/stores/authStore"

export default function CashierPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize stores on mount
  const { initializeProducts } = useProductStore()
  const { initializeCashier } = useCashierStore()
  const { checkShiftStatus, isShiftOpen } = useShiftStore()
  const { user } = useAuthStore()

  useEffect(() => {
    const checkShiftAndInitialize = async () => {
      if (user?.id) {
        // Check shift status
        await checkShiftStatus(user.id);
        const shiftOpen = isShiftOpen();
        
        if (!shiftOpen) {
          // Redirect to main page if no shift is open
          router.push('/');
          return;
        }
      }
      
      // Load initial data only if shift is open
      initializeProducts()
      initializeCashier()
      setIsLoading(false)
    }

    checkShiftAndInitialize()
  }, [initializeProducts, initializeCashier, checkShiftStatus, isShiftOpen, user?.id, router])

  // Show loading state while checking shift status
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
            <p className="text-muted-foreground">Checking shift status...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-full gap-0">
        {/* Main Content - Products Column */}
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
          <ProductHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          {/* Product Grid */}
          <div className="flex-1 overflow-auto">
            <ProductGrid searchQuery={searchQuery} viewMode={viewMode} selectedCategory={selectedCategory} />
          </div>
        </div>
        
        {/* Order Summary - Sidebar on desktop, modal on mobile */}
        {!isMobile && (
          <div className="w-80 h-full border-l border-border flex-shrink-0">
            <SummaryOrder />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
