'use client'

import { useState } from 'react'
import { Plus, CreditCard, Calendar, User, MapPin, Receipt, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentForm } from '@/components/sales/PaymentForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useSales } from '@/hooks/useSales'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useSettings } from '@/hooks/useSettings'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SalesPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(defaultMonth)
  const [activeTab, setActiveTab] = useState<'semua' | 'lunas' | 'cicilan'>('semua')

  const { sales, isLoading, isError, deleteSale } = useSales(monthFilter)
  const { data: workspace } = useWorkspace()
  const { settings } = useSettings()
  const role = workspace?.role

  const usdRate = settings?.usd_to_idr_rate || 16000
  const khrRate = settings?.khr_to_usd_rate || 4000
  const toKHR = (idr: number) => Math.round((idr / usdRate) * khrRate)
  
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Riwayat Penjualan
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Daftar seluruh transaksi penjualan rokok per bulan beserta status pelunasan.
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
          {canManageSales && (
            <Button render={<Link href="/sales/create" />} nativeButton={false} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
              <Plus className="h-4 w-4" />
              <span>Catat Penjualan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs defaultValue="semua" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[380px] h-10 rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="semua" className="rounded-lg text-xs font-semibold">Semua</TabsTrigger>
          <TabsTrigger value="lunas" className="rounded-lg text-xs font-semibold">Lunas</TabsTrigger>
          <TabsTrigger value="cicilan" className="rounded-lg text-xs font-semibold">Piutang / Cicilan</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sales List Grid */}
      <div className="space-y-4">
        {isLoading ? (
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
        ) : isError || !sales ? (
          <Card className="border-rose-500/30 bg-rose-500/10">
            <CardContent className="pt-5 pb-5 flex items-center gap-3 text-rose-500 text-xs font-medium">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Terjadi kesalahan saat memuat data penjualan. Silakan periksa koneksi atau ulangi.</span>
            </CardContent>
          </Card>
        ) : filteredSales?.length === 0 ? (
          <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Belum Ada Transaksi Penjualan</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Belum terdapat catatan transaksi penjualan pada filter bulan dan status yang dipilih.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSales?.map((sale) => {
            const total = sale.items.reduce((acc: number, item: any) => acc + (item.subtotal || 0), 0)
            const isPaid = sale.payment_status === 'lunas'

            return (
              <Card 
                key={sale.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  !isPaid 
                    ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/5 via-card to-card dark:border-rose-500/30' 
                    : 'hover:border-border/80 dark:hover:border-white/15'
                }`}
              >
                {!isPaid && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-rose-600" />
                )}

                <CardHeader className="pb-3 pt-5 pl-5">
                  <CardTitle className="flex justify-between items-start text-base">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${isPaid ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/15 text-rose-500 border-rose-500/20'}`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-base tracking-tight text-foreground">
                          {sale.customer?.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(sale.sale_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Trip: {sale.trip?.code || '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isPaid ? 'secondary' : 'destructive'}
                        className="gap-1 px-2.5 py-0.5 text-[11px] font-semibold"
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Lunas</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>Piutang</span>
                          </>
                        )}
                      </Badge>

                      {canManageSales && (
                        <LuxuryDeleteDialog 
                          title="Hapus Penjualan?" 
                          description="Riwayat penjualan ini akan dihapus permanen. Apakah Anda yakin?"
                          onConfirm={() => deleteSale(sale.id)} 
                        />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pl-5 pb-5 pt-1 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40 dark:border-white/5">
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Total Tagihan Penjualan</span>
                      {sale.payment_status === 'piutang' && sale.due_date && (
                        <span className="text-[11px] text-rose-500 font-medium block">
                          Jatuh Tempo: {new Date(sale.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums block">
                        ៛ {toKHR(total).toLocaleString('en-US')}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground/80 tabular-nums block">
                        (Rp {total.toLocaleString('id-ID')})
                      </span>
                    </div>
                  </div>

                  {/* Items List Breakdown */}
                  <div className="space-y-2 pt-1">
                    {sale.items.map((item: any) => {
                      const foreignText = item.currency && item.currency !== 'IDR' 
                        ? `${item.foreign_sell_price?.toLocaleString('en-US')} ${item.currency}` 
                        : ''
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground p-2 rounded-lg bg-background/50 border border-border/30 dark:border-white/5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">{item.product?.name}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {item.quantity} {item.product?.unit} × {item.currency !== 'IDR' ? foreignText : `Rp ${item.sell_price?.toLocaleString('id-ID')}`}
                              {item.currency !== 'IDR' && (
                                <span className="opacity-70 ml-1">(≈ Rp {item.sell_price?.toLocaleString('id-ID')})</span>
                              )}
                            </span>
                          </div>
                          <span className="font-bold text-foreground tabular-nums">
                            Rp {item.subtotal?.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>

                {sale.payment_status === 'piutang' && canManageSales && (
                  <CardFooter className="pt-0 pl-5 pr-5 pb-5">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full h-10 rounded-xl gap-2 font-semibold shadow-md shadow-emerald-500/15 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      onClick={() => handleOpenPayment(sale.id, sale.customer?.name || 'Pelanggan', total)}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Catat Pembayaran / Cicilan</span>
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
