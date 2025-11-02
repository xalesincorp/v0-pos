"use client"
import MainLayout from "@/components/layout/main-layout"
import ReceiptSettings from "@/components/settings/receipt-settings"
import TaxSettings from "@/components/settings/tax-settings"
import AccountSettings from "@/components/settings/account-settings"
import BusinessSettings from "@/components/settings/business-settings"
import DataHealth from "@/components/settings/data-health"
import LanguageSettings from "@/components/settings/language-settings"
import CashierSettings from "@/components/settings/cashier-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>

        {/* Tabs */}
        <Tabs defaultValue="business" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-7">
            <TabsTrigger value="business">Bisnis</TabsTrigger>
            <TabsTrigger value="receipt">Struk</TabsTrigger>
            <TabsTrigger value="tax">Pajak</TabsTrigger>
            <TabsTrigger value="account">Akun</TabsTrigger>
            <TabsTrigger value="cashier">Kasir</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="language">Bahasa</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-4">
            <BusinessSettings />
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            <ReceiptSettings />
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <TaxSettings />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="cashier" className="space-y-4">
            <CashierSettings />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <DataHealth />
          </TabsContent>
          
          <TabsContent value="language" className="space-y-4">
            <LanguageSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
