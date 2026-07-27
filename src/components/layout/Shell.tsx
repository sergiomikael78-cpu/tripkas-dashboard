'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BottomNav } from "./BottomNav"
import { cn } from "@/lib/utils"

function NavItem({ href, children }: { href: string, children: React.ReactNode }) {
  const pathname = usePathname()
  // Active if exact match, or if it's a sub-path (excluding root '/' which matches everything if not exact)
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href))

  return (
    <Link href={href} className="relative block px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 group overflow-hidden">
      {/* Background Hover/Active state */}
      <span 
        className={cn(
          "absolute inset-0 rounded-md transition-all duration-300",
          isActive ? "bg-primary/10 opacity-100 scale-100" : "bg-muted opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
        )} 
      />
      
      {/* Active Indicator Bar on the left */}
      <span 
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full transition-all duration-300",
          isActive ? "h-3/4 opacity-100" : "h-0 opacity-0"
        )}
      />

      {/* Text Content */}
      <span className={cn(
        "relative z-10 transition-colors duration-300 flex items-center",
        isActive ? "text-primary font-semibold translate-x-1" : "text-muted-foreground group-hover:text-foreground"
      )}>
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
    <div className="flex flex-col min-h-screen pb-16 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 border-r bg-background">
        <div className="py-4 flex items-center px-6 border-b gap-3">
          <img src="/icon-512x512.png" alt="Logo" className="w-10 h-10 rounded-md shadow-sm" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary leading-tight">DataRokok.SMJ</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Dashboard Pencatatan</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">Navigasi Utama</div>
          <NavItem href="/">Dashboard</NavItem>
          {(role === 'owner' || role === 'admin') && <NavItem href="/trips">Trip</NavItem>}
          <NavItem href="/sales">Penjualan</NavItem>
          {role !== 'staff' && <NavItem href="/purchases">Pembelian</NavItem>}
          <NavItem href="/stock">Stok</NavItem>
          {role !== 'staff' && <NavItem href="/expenses">Pengeluaran</NavItem>}
          
          {(role === 'owner' || role === 'admin') && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-6 mb-3 px-3">Master Data</div>
              <NavItem href="/products">Produk</NavItem>
              <NavItem href="/suppliers">Supplier</NavItem>
              <NavItem href="/customers">Pelanggan</NavItem>
              
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-6 mb-3 px-3">Analisis & Admin</div>
              <NavItem href="/reports">Laporan</NavItem>
              <NavItem href="/team">Tim & Akses</NavItem>
              <NavItem href="/audit">Audit Log</NavItem>
              <NavItem href="/settings">Pengaturan Kurs</NavItem>
            </>
          )}
        </nav>
      </aside>
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center px-4 h-14 border-b bg-background sticky top-0 z-40 gap-3">
        <img src="/icon-512x512.png" alt="Logo" className="w-8 h-8 rounded-md shadow-sm" />
        <div className="flex flex-col">
          <span className="text-base font-bold text-primary leading-tight">DataRokok.SMJ</span>
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
