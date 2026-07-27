'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
  const canManagePurchases = role === 'owner' || role === 'admin' || role === 'partner'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Pembelian</h1>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40 bg-zinc-900 border-zinc-800 text-white"
          />
          {canManagePurchases && (
            <Button render={<Link href="/purchases/create" />} nativeButton={false}>
              <Plus className="mr-2 h-4 w-4" /> Beli Barang
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading || !purchases ? (
          <p>Memuat transaksi pembelian...</p>
        ) : purchases.length === 0 ? (
          <p className="text-muted-foreground">Belum ada transaksi pembelian.</p>
        ) : (
          purchases.map((purchase) => {
            const total = purchase.items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0)
            
            return (
              <Card key={purchase.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>{purchase.supplier?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-muted-foreground mr-2">
                        {new Date(purchase.purchase_date).toLocaleDateString('id-ID')}
                      </span>
                      {canManagePurchases && (
                        <LuxuryDeleteDialog 
                          title="Hapus Pembelian?" 
                          description="Riwayat pembelian ini akan dihapus permanen. Apakah Anda yakin?"
                          onConfirm={() => deletePurchase(purchase.id)} 
                        />
                      )}
                    </div>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    Trip: {purchase.trip?.code}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-semibold">Total Pembelian: Rp {total.toLocaleString('id-ID')}</p>
                    <div className="border-t pt-2 space-y-1">
                      {purchase.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm text-muted-foreground">
                          <span>{item.quantity} {item.product?.unit} x {item.product?.name}</span>
                          <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
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
