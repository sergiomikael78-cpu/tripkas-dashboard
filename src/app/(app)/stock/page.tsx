'use client'

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Plus } from 'lucide-react'
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
  SelectValue,
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
      case 'in': return 'default' as const
      case 'out': return 'destructive' as const
      case 'adjustment': return 'secondary' as const
      default: return 'outline' as const
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownCircle className="h-4 w-4 text-green-500" />
      case 'out': return <ArrowUpCircle className="h-4 w-4 text-red-500" />
      case 'adjustment': return <RefreshCw className="h-4 w-4 text-yellow-500" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Stok & Pergerakan</h1>
        {canAdjustStock && (
          <Button onClick={() => setIsAdjustOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Penyesuaian Stok
          </Button>
        )}
      </div>

      {/* Current Stock Summary Grouped by Trip */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Stok Saat Ini (Berdasarkan Lokasi)</h2>
        {movementsLoading || !tripStocks ? (
          <p>Memuat stok...</p>
        ) : tripStocks.length === 0 ? (
          <p className="text-muted-foreground">Belum ada stok barang.</p>
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
                const tripName = tripId === 'gudang' 
                  ? 'Gudang Pusat (Tanpa Trip)' 
                  : (trips?.find(t => t.id === tripId)?.code || `Trip ${tripId}`)
                
                return (
                  <div key={tripId} className="space-y-3">
                    <h3 className="font-semibold text-primary">{tripName}</h3>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {stocks.map(stock => (
                        <Card key={stock.product_id} className={stock.current_stock < 0 ? 'border-red-500' : ''}>
                          <CardContent className="pt-4 pb-3">
                            <p className="text-sm font-medium truncate">{stock.product?.name}</p>
                            <p className="text-xs text-muted-foreground mb-1">{stock.product?.brand} {stock.product?.variant}</p>
                            <p className={`text-2xl font-bold ${stock.current_stock < 0 ? 'text-red-500' : 'text-foreground'}`}>
                              {stock.current_stock} <span className="text-xs font-normal text-muted-foreground">{stock.product?.unit}</span>
                            </p>
                            {stock.current_stock < 0 && (
                              <p className="text-xs text-red-500 font-medium mt-1">⚠ Stok Minus</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Stock Movement History */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold">Riwayat Pergerakan Stok</h2>
          <Input 
            type="month" 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40 bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
        <div className="space-y-3">
          {movementsLoading || !movements ? (
            <p>Memuat riwayat...</p>
          ) : movements.length === 0 ? (
            <p className="text-muted-foreground">Belum ada pergerakan stok.</p>
          ) : (
            movements.map((m) => (
              <Card key={m.id}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {typeIcon(m.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{m.product?.name || 'Produk'}</p>
                          {canAdjustStock && (
                            <LuxuryDeleteDialog 
                              title="Hapus Riwayat Stok?" 
                              description="Riwayat pergerakan stok ini akan dihapus permanen. Apakah Anda yakin?"
                              onConfirm={() => deleteStockMovement(m.id)} 
                            />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.created_at).toLocaleDateString('id-ID')} · {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={typeBadgeVariant(m.type)}>{typeLabel(m.type)}</Badge>
                      <p className={`text-sm font-bold mt-1 ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity} {m.product?.unit}
                      </p>
                    </div>
                  </div>
                  {m.reason && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                      Alasan: {m.reason}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Ref: {m.reference_type === 'purchase' ? 'Pembelian' : m.reference_type === 'sale' ? 'Penjualan' : 'Manual'}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Adjustment Form */}
      <ResponsiveFormSheet
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        title="Penyesuaian Stok Manual"
        description="Koreksi stok jika terjadi selisih antara stok fisik dan stok sistem. Alasan wajib diisi."
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pilih Produk</Label>
            <Select value={adjProductId} onValueChange={(val) => setAdjProductId(val as string)}>
              <SelectTrigger>
                <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${!adjProductId ? 'text-muted-foreground' : ''}`}>
                  {adjProductId ? (products?.find((p: any) => p.id === adjProductId)?.name || adjProductId) : 'Pilih Produk'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {products?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.current_stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pilih Lokasi / Trip</Label>
            <Select value={adjTripId} onValueChange={(val) => setAdjTripId(val as string)}>
              <SelectTrigger className="bg-white">
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
            <p className="text-xs text-muted-foreground">Pilih di mana stok ini akan disesuaikan.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjDelta">Perubahan Stok (+ untuk tambah, - untuk kurang)</Label>
            <Input
              id="adjDelta"
              type="number"
              value={adjDelta}
              onChange={(e) => setAdjDelta(e.target.value)}
              placeholder="Misal: -2 atau +5"
              required
            />
            <p className="text-xs text-muted-foreground">
              Contoh: isi <strong>-2</strong> jika stok fisik kurang 2 dari sistem, atau <strong>+3</strong> jika stok fisik lebih 3.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjReason">Alasan Penyesuaian (WAJIB)</Label>
            <Textarea
              id="adjReason"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Barang rusak, barang hilang, salah hitung sebelumnya, dll..."
              rows={3}
              required
            />
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)} disabled={adjustStock.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={adjustStock.isPending}>
              {adjustStock.isPending ? 'Menyimpan...' : 'Simpan Penyesuaian'}
            </Button>
          </div>
        </form>
      </ResponsiveFormSheet>
    </div>
  )
}
