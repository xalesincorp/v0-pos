"use client"
import MainLayout from "@/components/layout/main-layout"
import TransactionReport from "@/components/reports/transaction-report"
import SalesReport from "@/components/reports/sales-report"
import CloseCashierReport from "@/components/reports/close-cashier-report"
import CloseCashierModal from "@/components/reports/close-cashier-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function ReportsPage() {
  const searchParams = useSearchParams()
  const [defaultValue, setDefaultValue] = useState("transactions")
  const [isCloseCashierModalOpen, setIsCloseCashierModalOpen] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'cashier' || tab === 'sales' || tab === 'transactions') {
      setDefaultValue(tab)
      if (tab === 'cashier') {
        setIsCloseCashierModalOpen(true)
      }
    } else {
      setDefaultValue("transactions")
    }
  }, [searchParams])

  // Handle tab change to open modal when cashier tab is selected
  const handleTabChange = (value: string) => {
    if (value === 'cashier') {
      setIsCloseCashierModalOpen(true)
      setDefaultValue(value)
    } else {
      setDefaultValue(value)
    }
  }

  const handleOpenCashierModal = () => {
    setIsCloseCashierModalOpen(true)
  }

  const handleCloseCashierModal = () => {
    setIsCloseCashierModalOpen(false)
    // Update URL to remove the tab parameter when modal is closed
    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    window.history.pushState({}, '', url.toString());
  }

  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>

        {/* Tabs */}
        <Tabs value={defaultValue} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="cashier">Close Cashier</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionReport />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <SalesReport />
          </TabsContent>

          <TabsContent value="cashier" className="space-y-4">
            {isCloseCashierModalOpen && (
              <CloseCashierModal
                isOpen={isCloseCashierModalOpen}
                onClose={handleCloseCashierModal}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
