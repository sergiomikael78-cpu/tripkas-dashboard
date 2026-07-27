'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Plus, Package, Building2, MapPin, Sparkles, History, AlertTriangle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useProducts } from '@/hooks/useProducts'
import { useStockMovements, TripStock } from '@/hooks/useStocks'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTrips } from '@/hooks/useTrips'

export default function StockPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(defaultMonth)

  const { products, isLoading: productsLoading } = useProducts()
  const { movements, tripStocks, isLoading: movementsLoading, adjustStock, deleteStockMovement } = useStockMovements(undefined, monthFilter)
  const { trips } = useTrips()
  const { data: workspace } = useWorkspace()
  const role = workspace?.role

  const canAdjustStock = role === 'owner' || role === 'admin' || role === 'partner'

  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjProductId, setAdjProductId] = useState('')
  const [adjTripId, setAdjTripId] = useState('none')
  const [adjDelta, setAdjDelta] = useState('')
  const [adjReason, setAdjReason] = useState('')

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjProductId || !adjDelta || !adjReason.trim()) {
      alert('Semua field wajib diisi, termasuk alasan penyesuaian.')
      return
    }
    adjustStock.mutate({
      product_id: adjProductId,
      quantity_delta: Number(adjDelta),
      reason: adjReason,
      trip_id: adjTripId !== 'none' ? adjTripId : null
    }, {
      onSuccess: () => {
        setIsAdjustOpen(false)
        setAdjProductId('')
        setAdjTripId('none')
        setAdjDelta('')
        setAdjReason('')
      }
    })
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'in': return 'Masuk'
      case 'out': return 'Keluar'
      case 'adjustment': return 'Penyesuaian'
      default: return type
    }
  }

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case 'in': return 'secondary' as const
      case 'out': return 'destructive' as const
      case 'adjustment': return 'default' as const
      default: return 'outline' as const
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
      case 'out': return <ArrowUpCircle className="h-4 w-4 text-rose-500" />
      case 'adjustment': return <RefreshCw className="h-4 w-4 text-amber-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Stok & Pergerakan Barang
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Pantau posisi fisik stok di gudang/trip serta audit riwayat mutasi barang.
          </p>
        </div>

        {canAdjustStock && (
          <Button onClick={() => setIsAdjustOpen(true)} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
            <Plus className="h-4 w-4" />
            <span>Penyesuaian Stok</span>
          </Button>
        )}
      </div>

      {/* Current Stock Summary Grouped by Trip */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-bold text-foreground">Posisi Stok Saat Ini (Per Lokasi / Trip)</h2>
        </div>

        {movementsLoading || !tripStocks ? (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="h-4 w-28 rounded bg-muted shimmer" />
                  <div className="h-7 w-20 rounded bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tripStocks.length === 0 ? (
          <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-6 text-center">
            <CardContent className="text-xs text-muted-foreground font-medium">
              Belum ada posisi stok fisik tercatat.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Group tripStocks by trip_id */}
            {(() => {
              const grouped = tripStocks.reduce((acc, stock) => {
                const key = stock.trip_id || 'gudang'
                if (!acc[key]) acc[key] = []
                acc[key].push(stock)
                return acc
              }, {} as Record<string, TripStock[]>)

              return Object.entries(grouped).map(([tripId, stocks]) => {
                const isGudang = tripId === 'gudang'
                const tripName = isGudang 
                  ? 'Gudang Pusat (Tanpa Trip)' 
                  : (trips?.find(t => t.id === tripId)?.code || `Trip ${tripId}`)
                
                return (
                  <div key={tripId} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {isGudang ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      <span>{tripName}</span>
                    </div>

                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {stocks.map(stock => {
                        const isNegative = stock.current_stock < 0
                        return (
                          <Card 
                            key={stock.product_id} 
                            className={`transition-all duration-300 ${
                              isNegative 
                                ? 'border-rose-500/40 bg-rose-500/10' 
                                : 'hover:border-amber-500/30'
                            }`}
                          >
                            <CardContent className="pt-4 pb-4">
                              <p className="text-sm font-bold text-foreground truncate">{stock.product?.name}</p>
                              <p className="text-xs text-muted-foreground mb-2">{stock.product?.brand} {stock.product?.variant}</p>
                              <div className="flex items-baseline justify-between">
                                <span className={`text-2xl font-bold tabular-nums tracking-tight ${isNegative ? 'text-rose-500' : 'text-foreground'}`}>
                                  {stock.current_stock}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground uppercase">{stock.product?.unit}</span>
                              </div>
                              {isNegative && (
                                <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Stok Minus!
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Stock Movement History */}
      <div className="space-y-4 pt-2 border-t border-border/50 dark:border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-bold text-foreground">Riwayat Pergerakan Stok</h2>
          </div>

          <div className="relative flex items-center">
            <Input 
              type="month" 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-40 h-10 rounded-xl bg-card/60 border-border/80 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="space-y-3">
          {movementsLoading || !movements ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-border/60 dark:border-white/10">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted shimmer" />
                    <div className="h-3 w-24 rounded bg-muted shimmer" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : movements.length === 0 ? (
            <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-6 text-center">
              <CardContent className="text-xs text-muted-foreground font-medium">
                Belum ada pergerakan stok pada filter bulan ini.
              </CardContent>
            </Card>
          ) : (
            movements.map((m) => (
              <Card key={m.id} className="hover:border-border/80 dark:hover:border-white/15 transition-all duration-300">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted/60 border border-border/40 shrink-0">
                        {typeIcon(m.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground">{m.product?.name || 'Produk'}</p>
                          {canAdjustStock && (
                            <LuxuryDeleteDialog 
                              title="Hapus Riwayat Stok?" 
                              description="Riwayat pergerakan stok ini akan dihapus permanen. Apakah Anda yakin?"
                              onConfirm={() => deleteStockMovement(m.id)} 
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <Badge variant={typeBadgeVariant(m.type)} className="text-[10px] font-semibold px-2 py-0.2">
                        {typeLabel(m.type)}
                      </Badge>
                      <p className={`text-sm font-bold tabular-nums ${m.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity} {m.product?.unit}
                      </p>
                    </div>
                  </div>

                  {m.reason && (
                    <div className="text-xs text-muted-foreground mt-2 bg-muted/40 p-2.5 rounded-xl border border-border/30 dark:border-white/5">
                      <strong className="text-foreground font-semibold">Alasan:</strong> {m.reason}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground/80">
                    <span>Referensi: <strong className="text-foreground font-medium">{m.reference_type === 'purchase' ? 'Pembelian' : m.reference_type === 'sale' ? 'Penjualan' : 'Manual'}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Adjustment Form Sheet */}
      <ResponsiveFormSheet
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        title="Penyesuaian Stok Manual"
        description="Koreksi stok jika terjadi selisih antara stok fisik dan stok sistem. Alasan wajib diisi."
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Pilih Produk Rokok</Label>
            <Select value={adjProductId} onValueChange={(val) => setAdjProductId(val as string)}>
              <SelectTrigger className="h-10 rounded-xl">
                <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${!adjProductId ? 'text-muted-foreground' : ''}`}>
                  {adjProductId ? (products?.find((p: any) => p.id === adjProductId)?.name || adjProductId) : 'Pilih Produk'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {products?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.current_stock} {p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Pilih Lokasi / Trip</Label>
            <Select value={adjTripId} onValueChange={(val) => setAdjTripId(val as string)}>
              <SelectTrigger className="h-10 rounded-xl">
                <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${adjTripId === 'none' ? 'text-muted-foreground' : ''}`}>
                  {adjTripId === 'none' ? 'Gudang Pusat (Tanpa Trip)' : (trips?.find((t: any) => t.id === adjTripId)?.code || adjTripId)}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Gudang Pusat (Tanpa Trip)</SelectItem>
                {trips?.filter((t: any) => t.status === 'running').map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Pilih lokasi spesifik di mana penyesuaian fisik dilakukan.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjDelta" className="text-xs font-semibold">Perubahan Stok (+ untuk tambah, - untuk kurang)</Label>
            <Input
              id="adjDelta"
              type="number"
              value={adjDelta}
              onChange={(e) => setAdjDelta(e.target.value)}
              placeholder="Misal: -2 atau +5"
              required
              className="h-10 rounded-xl font-bold tabular-nums"
            />
            <p className="text-[11px] text-muted-foreground">
              Contoh: isi <strong className="text-rose-500 font-bold">-2</strong> jika stok fisik kurang 2, atau <strong className="text-emerald-500 font-bold">+3</strong> jika stok lebih 3.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjReason" className="text-xs font-semibold flex items-center justify-between">
              <span>Alasan Penyesuaian</span>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">(Field Wajib)</span>
            </Label>
            <Textarea
              id="adjReason"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Barang rusak saat perjalanan, barang hilang, salah hitung sebelumnya, dll..."
              rows={3}
              required
              className="rounded-xl border-amber-500/30 focus-visible:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)} disabled={adjustStock.isPending} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" disabled={adjustStock.isPending} className="rounded-xl font-semibold shadow-md shadow-amber-500/20">
              {adjustStock.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </Button>
          </div>
        </form>
      </ResponsiveFormSheet>
    </div>
  )
}
