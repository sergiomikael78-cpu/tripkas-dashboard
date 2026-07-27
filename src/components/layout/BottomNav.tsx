'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, Receipt, ShoppingCart, Package, Menu, 
  Map, Users, Store, BarChart3, Users2, Shield, Settings 
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Jual', href: '/sales', icon: Receipt },
  { name: 'Beli', href: '/purchases', icon: ShoppingCart },
  { name: 'Stok', href: '/stock', icon: Package },
]

const menuGroups = [
  {
    title: "Navigasi Utama",
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Trip', href: '/trips', icon: Map },
      { name: 'Penjualan', href: '/sales', icon: Receipt },
      { name: 'Pembelian', href: '/purchases', icon: ShoppingCart },
      { name: 'Stok', href: '/stock', icon: Package },
      { name: 'Pengeluaran', href: '/expenses', icon: Receipt },
    ]
  },
  {
    title: "Master Data",
    items: [
      { name: 'Produk', href: '/products', icon: Package },
      { name: 'Supplier', href: '/suppliers', icon: Store },
      { name: 'Pelanggan', href: '/customers', icon: Users },
    ]
  },
  {
    title: "Analisis & Admin",
    items: [
      { name: 'Laporan', href: '/reports', icon: BarChart3 },
      { name: 'Tim & Akses', href: '/team', icon: Users2 },
      { name: 'Audit Log', href: '/audit', icon: Shield },
      { name: 'Pengaturan', href: '/settings', icon: Settings },
    ]
  }
]

import { useWorkspace } from "@/hooks/useWorkspace"

export function BottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data: workspace } = useWorkspace()
  const role = workspace?.role

  // Check if current path is in the main nav items
  const isMainPath = mainNavItems.some(item => 
    pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
  )

  // If not in main nav, the "Menu" icon should be highlighted
  const isMenuPathActive = !isMainPath && pathname !== '/'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-all duration-300",
                isActive ? "text-primary" : ""
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-md transition-all duration-300 animate-in slide-in-from-top-2" />
              )}
              <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive && "-translate-y-0.5 scale-110")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger 
            render={
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-all duration-300 outline-none",
                  isMenuPathActive ? "text-primary" : ""
                )}
              />
            }
          >
            {isMenuPathActive && (
              <span className="absolute top-0 w-8 h-1 bg-primary rounded-b-md transition-all duration-300 animate-in slide-in-from-top-2" />
            )}
            <Menu className={cn("h-5 w-5 transition-transform duration-300", isMenuPathActive && "-translate-y-0.5 scale-110")} />
            <span className="text-[10px] font-medium">Menu</span>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle className="text-left">Semua Menu</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto p-4 space-y-6">
              {menuGroups.map((group, idx) => {
                // Filter items based on role
                const filteredItems = group.items.filter(item => {
                  if (role === 'owner' || role === 'admin') return true;
                  
                  if (role === 'partner') {
                    return ['Dashboard', 'Penjualan', 'Pembelian', 'Stok', 'Pengeluaran'].includes(item.name);
                  }
                  
                  if (role === 'staff') {
                    return ['Dashboard', 'Penjualan', 'Stok'].includes(item.name);
                  }
                  
                  return false;
                });

                if (filteredItems.length === 0) return null;

                return (
                <div key={idx} className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {filteredItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-2 rounded-xl transition-all",
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-full",
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-medium text-center leading-tight line-clamp-1 w-full">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  )
}
