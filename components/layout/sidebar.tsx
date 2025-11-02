"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Package, Boxes, Users, BarChart3, Settings, ChevronLeft, Maximize2, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/authStore"
import { useShiftStore } from "@/lib/stores/shiftStore"
import { useRouter } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "react-hot-toast"
import { format } from "date-fns";

const menuItems = [
  {
    label: "Kasir",
    icon: ShoppingCart,
    href: "/cashier",
  },
  {
    label: "Produk",
    icon: Package,
    href: "/products",
  },
  {
    label: "Inventory",
    icon: Boxes,
    href: "/inventory",
  },
  {
    label: "Pelanggan",
    icon: Users,
    href: "/customers",
  },
  {
    label: "Laporan",
    icon: BarChart3,
    href: "/reports",
  },
  {
    label: "Pengaturan",
    icon: Settings,
    href: "/settings",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { getCurrentShift } = useShiftStore();
  const [shiftData, setShiftData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fix hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Fetch shift data when user changes
  useEffect(() => {
    const fetchShiftData = async () => {
      if (user?.id) {
        try {
          const currentShift = await getCurrentShift();
          setShiftData(currentShift);
        } catch (error) {
          console.error("Error fetching shift data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setShiftData(null);
        setLoading(true);
      }
    };

    fetchShiftData();
  }, [user?.id, getCurrentShift]);

  const handleCloseCashier = async () => {
    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    try {
      // Use the shift store to get current shift status
      await useShiftStore.getState().checkShiftStatus(user.id);
      const currentShift = await useShiftStore.getState().getCurrentShift();
      
      if (currentShift) {
        // Close the shift with a default actual cash value of 0 (user will enter correct amount on the close cashier page)
        // For now, we'll redirect to the close cashier page where they can properly close the shift
        router.push('/reports?tab=cashier')
      } else {
        // If no open shift, just logout
        await logout()
        router.push('/')
      }
    } catch (error) {
      console.error("Error closing cashier:", error)
      toast.error("Failed to close cashier")
    }
  }

  // Only render the close cashier button if hydrated to prevent hydration errors
  const renderCloseCashierButton = () => {
    if (!isHydrated) return null
    
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-3 transition-all duration-300 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",
              isCollapsed && "justify-center p-2",
            )}
            title={isCollapsed ? "Tutup Kasir" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Tutup Kasir</span>}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Cashier</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menutup kasir? Ini akan mengakhiri shift Anda dan membawa Anda ke halaman laporan penutupan kasir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseCashier}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <nav className={cn("flex flex-col h-full p-4 gap-4 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
      {/* Header with collapse button */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground">POS</h2>
              {/* Shift Status Indicator */}
              {!loading && shiftData ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 truncate">
                  <div className="flex items-center gap-1 truncate">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="truncate">Shift Aktif</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.name} • {shiftData.openedAt ? format(new Date(shiftData.openedAt), 'HH:mm') : ''}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="truncate">Belum ada shift aktif</span>
                </div>
              )}
            </div>
          )}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 h-8 w-8"
              title="Expand sidebar"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <div className="space-y-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 mt-1 transition-all duration-300",
                  isActive && "bg-primary p-2 text-primary-foreground",
                  isCollapsed && "justify-center p-2",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Close Cashier Button at the bottom */}
      <div className="mt-auto pt-4 border-t border-border">
        {renderCloseCashierButton()}
      </div>
    </nav>
  )
}
