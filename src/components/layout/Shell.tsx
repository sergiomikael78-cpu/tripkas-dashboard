'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { cn } from "@/lib/utils"
import { 
  Home, Receipt, ShoppingCart, Package, Map, 
  Users, Store, BarChart3, Users2, Shield, Settings, DollarSign 
} from "lucide-react"

function NavItem({ href, icon: Icon, children }: { href: string, icon?: React.ComponentType<{ className?: string }>, children: React.ReactNode }) {
  const pathname = usePathname()
  // Active if exact match, or if it's a sub-path (excluding root '/' which matches everything if not exact)
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href))

  return (
    <Link href={href} className="relative block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden">
      {/* Background Hover/Active state */}
      <span 
        className={cn(
          "absolute inset-0 rounded-xl transition-all duration-300",
          isActive 
            ? "bg-amber-500/15 border border-amber-500/30 dark:bg-amber-500/20 dark:border-amber-500/40 opacity-100 scale-100 shadow-xs" 
            : "bg-muted/60 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
        )} 
      />
      
      {/* Active Indicator Bar on the left */}
      <span 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full transition-all duration-300 shadow-sm shadow-amber-500/50",
          isActive ? "h-3/5 opacity-100" : "h-0 opacity-0"
        )}
      />

      {/* Content with Icon */}
      <span className={cn(
        "relative z-10 transition-all duration-300 flex items-center gap-3",
        isActive ? "text-amber-600 dark:text-amber-400 font-semibold translate-x-1" : "text-muted-foreground group-hover:text-foreground"
      )}>
        {Icon && <Icon className={cn("h-4 w-4 transition-transform duration-300 group-hover:scale-110", isActive && "text-amber-500 scale-110")} />}
        {children}
      </span>
    </Link>
  )
}

import { useWorkspace } from "@/hooks/useWorkspace"

export function Shell({ children }: { children: React.ReactNode }) {
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  return (
    <div className="flex flex-col min-h-screen pb-16 md:pb-0 md:pl-64 bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-border/60 dark:border-white/10 bg-card/75 backdrop-blur-md z-30">
        <div className="py-5 flex items-center px-6 border-b border-border/60 dark:border-white/10 gap-3">
          <div className="relative p-0.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
            <img src="/icon-512x512.png" alt="Logo" className="w-9 h-9 rounded-[10px] bg-background object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent leading-tight tracking-tight">DataRokok.SMJ</span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Trading Multi-Trip</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2 px-3">Navigasi Utama</div>
          <NavItem href="/" icon={Home}>Dashboard</NavItem>
          {(role === 'owner' || role === 'admin') && <NavItem href="/trips" icon={Map}>Trip</NavItem>}
          <NavItem href="/sales" icon={Receipt}>Penjualan</NavItem>
          {role !== 'staff' && <NavItem href="/purchases" icon={ShoppingCart}>Pembelian</NavItem>}
          <NavItem href="/stock" icon={Package}>Stok</NavItem>
          {role !== 'staff' && <NavItem href="/expenses" icon={DollarSign}>Pengeluaran</NavItem>}
          
          {(role === 'owner' || role === 'admin') && (
            <>
              <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-6 mb-2 px-3">Master Data</div>
              <NavItem href="/products" icon={Package}>Produk</NavItem>
              <NavItem href="/suppliers" icon={Store}>Supplier</NavItem>
              <NavItem href="/customers" icon={Users}>Pelanggan</NavItem>
              
              <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-6 mb-2 px-3">Analisis & Admin</div>
              <NavItem href="/reports" icon={BarChart3}>Laporan</NavItem>
              <NavItem href="/team" icon={Users2}>Tim & Akses</NavItem>
              <NavItem href="/audit" icon={Shield}>Audit Log</NavItem>
              <NavItem href="/settings" icon={Settings}>Pengaturan Kurs</NavItem>
            </>
          )}
        </nav>
      </aside>
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center px-4 h-14 border-b border-border/60 dark:border-white/10 bg-card/85 backdrop-blur-md sticky top-0 z-40 gap-3">
        <div className="relative p-0.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm">
          <img src="/icon-512x512.png" alt="Logo" className="w-7 h-7 rounded-[7px] bg-background object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent leading-tight">DataRokok.SMJ</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
