import CashierPage from "@/components/pages/cashier-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <CashierPage />
    </AuthGuard>
  );
}