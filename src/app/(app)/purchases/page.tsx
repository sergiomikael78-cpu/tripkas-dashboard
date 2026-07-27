'use client'

import { useState } from 'react'
import { Plus, Store, Calendar, MapPin, ShoppingCart, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { usePurchases } from '@/hooks/usePurchases'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function PurchasesPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(defaultMonth)

  const { purchases, isLoading, deletePurchase } = usePurchases(monthFilter)
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
  const canManagePurchases = role === 'owner' || role === 'admin' || role === 'partner'

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Riwayat Pembelian Barang
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Catatan restok barang rokok dari supplier per periode bulan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Input 
              type="month" 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-40 h-10 rounded-xl bg-card/60 border-border/80 text-xs font-semibold"
            />
          </div>
          {canManagePurchases && (
            <Button render={<Link href="/purchases/create" />} nativeButton={false} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
              <Plus className="h-4 w-4" />
              <span>Beli Barang</span>
            </Button>
          )}
        </div>
      </div>

      {/* Purchase List Grid */}
      <div className="space-y-4">
        {isLoading || !purchases ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardHeader className="pb-3 space-y-2">
                  <div className="h-5 w-40 rounded-lg bg-muted shimmer" />
                  <div className="h-4 w-24 rounded bg-muted shimmer" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted shimmer" />
                  <div className="h-12 w-full rounded-xl bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Belum Ada Transaksi Pembelian</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Belum terdapat transaksi pembelian barang dari supplier pada bulan yang dipilih.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          purchases.map((purchase) => {
            const total = purchase.items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0)
            
            return (
              <Card key={purchase.id} className="relative overflow-hidden transition-all duration-300 hover:border-border/80 dark:hover:border-white/15">
                <CardHeader className="pb-3 pt-5 pl-5">
                  <CardTitle className="flex justify-between items-start text-base">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-base tracking-tight text-foreground">
                          {purchase.supplier?.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(purchase.purchase_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Trip: {purchase.trip?.code || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManagePurchases && (
                      <LuxuryDeleteDialog 
                        title="Hapus Pembelian?" 
                        description="Riwayat pembelian ini akan dihapus permanen. Apakah Anda yakin?"
                        onConfirm={() => deletePurchase(purchase.id)} 
                      />
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pl-5 pb-5 pt-1 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40 dark:border-white/5">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Total Pengeluaran Restok</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Items List Breakdown */}
                  <div className="space-y-2 pt-1">
                    {purchase.items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-lg bg-background/50 border border-border/30 dark:border-white/5">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">{item.product?.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {item.quantity} {item.product?.unit}
                          </span>
                        </div>
                        <span className="font-bold text-foreground tabular-nums">
                          Rp {item.subtotal?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
