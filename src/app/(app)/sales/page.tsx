'use client'

import { useState } from 'react'
import { Plus, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentForm } from '@/components/sales/PaymentForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useSales } from '@/hooks/useSales'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SalesPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(defaultMonth)
  const [activeTab, setActiveTab] = useState<'semua' | 'lunas' | 'cicilan'>('semua')

  const { sales, isLoading, isError, deleteSale } = useSales(monthFilter)
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
  // Payment state
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<{id: string, customerName: string, totalAmount: number} | null>(null)

  // Everyone except staff can create sales (Owner, Admin, Partner)
  const canManageSales = role === 'owner' || role === 'admin' || role === 'partner'

  const handleOpenPayment = (saleId: string, customerName: string, totalAmount: number) => {
    setSelectedSale({ id: saleId, customerName, totalAmount })
    setIsPaymentFormOpen(true)
  }

  const filteredSales = sales?.filter(sale => {
    if (activeTab === 'lunas') return sale.payment_status === 'lunas'
    if (activeTab === 'cicilan') return sale.payment_status === 'piutang'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Penjualan</h1>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40 bg-zinc-900 border-zinc-800 text-white"
          />
          {canManageSales && (
            <Button render={<Link href="/sales/create" />} nativeButton={false}>
              <Plus className="mr-2 h-4 w-4" /> Catat Penjualan
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="semua" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="semua">Semua</TabsTrigger>
          <TabsTrigger value="lunas">Lunas</TabsTrigger>
          <TabsTrigger value="cicilan">Cicilan</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {isLoading ? (
          <p>Memuat transaksi penjualan...</p>
        ) : isError || !sales ? (
          <p className="text-red-500">Terjadi kesalahan saat memuat data penjualan. Cek console untuk detail.</p>
        ) : filteredSales?.length === 0 ? (
          <p className="text-muted-foreground">Belum ada transaksi penjualan sesuai filter.</p>
        ) : (
          filteredSales?.map((sale) => {
            const total = sale.items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0)
            
            return (
              <Card key={sale.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>{sale.customer?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-muted-foreground mr-2">
                        {new Date(sale.sale_date).toLocaleDateString('id-ID')}
                      </span>
                      {canManageSales && (
                        <LuxuryDeleteDialog 
                          title="Hapus Penjualan?" 
                          description="Riwayat penjualan ini akan dihapus permanen. Apakah Anda yakin?"
                          onConfirm={() => deleteSale(sale.id)} 
                        />
                      )}
                    </div>
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Trip: {sale.trip?.code || '-'}
                    </div>
                    <Badge variant={sale.payment_status === 'lunas' ? 'default' : 'destructive'}>
                      {sale.payment_status === 'lunas' ? 'Lunas' : 'Piutang'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm font-semibold">Total Penjualan: Rp {total.toLocaleString('id-ID')}</p>
                    {sale.payment_status === 'piutang' && sale.due_date && (
                      <p className="text-xs text-red-500 font-medium">
                        Jatuh Tempo: {new Date(sale.due_date).toLocaleDateString('id-ID')}
                      </p>
                    )}
                    <div className="border-t pt-2 space-y-2">
                      {sale.items.map((item: any) => {
                        const foreignText = item.currency && item.currency !== 'IDR' 
                          ? `${item.foreign_sell_price?.toLocaleString('en-US')} ${item.currency}` 
                          : ''
                        
                        return (
                          <div key={item.id} className="flex flex-col text-sm text-muted-foreground border-b border-dashed pb-2 last:border-0 last:pb-0">
                            <div className="flex justify-between font-medium text-foreground/90">
                              <span>{item.product?.name}</span>
                              <span className="font-semibold text-primary">Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-xs flex justify-between mt-0.5">
                              <span>
                                {item.quantity} {item.product?.unit} x {item.currency !== 'IDR' ? foreignText : `Rp ${item.sell_price?.toLocaleString('id-ID')}`}
                              </span>
                              {item.currency !== 'IDR' && (
                                <span className="opacity-70">(≈ Rp {item.sell_price?.toLocaleString('id-ID')})</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
                {sale.payment_status === 'piutang' && canManageSales && (
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 border-primary text-primary hover:bg-primary/10"
                      onClick={() => handleOpenPayment(sale.id, sale.customer?.name || 'Pelanggan', total)}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Bayar Cicilan
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })
        )}
      </div>

      <PaymentForm
        open={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        saleId={selectedSale?.id || null}
        customerName={selectedSale?.customerName || ''}
        totalAmount={selectedSale?.totalAmount || 0}
      />
    </div>
  )
}
