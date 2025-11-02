import CustomersPage from "@/components/pages/customers-page";
import AuthGuard from "@/components/auth/auth-guard";

export default function Page() {
  return (
    <AuthGuard>
      <CustomersPage />
    </AuthGuard>
  );
}