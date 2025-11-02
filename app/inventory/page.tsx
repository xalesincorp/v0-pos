import InventoryPage from "@/components/pages/inventory-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <InventoryPage />
    </AuthGuard>
  );
}