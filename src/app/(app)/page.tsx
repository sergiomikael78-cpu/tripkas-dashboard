'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useWorkspace } from '@/hooks/useWorkspace'
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Banknote, 
  MapPin, 
  CreditCard,
  ArrowDownRight,
  BarChart3,
  Sparkles,
  Compass
} from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: workspace } = useWorkspace()

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
  const profitBersih = (stats?.profitBulanIni || 0) - (stats?.totalPengeluaranBulanIni || 0)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
            Dashboard Utama
          </h1>
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Ringkasan performa bisnis dan aktivitas trip trading Anda secara real-time.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-20 w-full rounded-2xl bg-card border border-border/60 dark:border-white/10 shimmer" />
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardContent className="pt-5 pb-5 space-y-3">
                  <div className="h-4 w-24 rounded-lg bg-muted shimmer" />
                  <div className="h-8 w-36 rounded-lg bg-muted shimmer" />
                  <div className="h-3 w-16 rounded-md bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Trip Status Banner */}
          {stats?.activeTrips && stats.activeTrips.length > 0 ? (
            <div className={`grid gap-4 ${stats.activeTrips.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {stats.activeTrips.map((trip) => (
                <Card key={trip.id} className="relative overflow-hidden border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card dark:border-amber-500/30 dark:from-amber-500/15 shadow-lg shadow-amber-500/5">
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600" />
                  <CardContent className="pt-5 pb-4 pl-6 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trip Operasional Aktif</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">{trip.code}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse-subtle">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      Berjalan
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40">
              <CardContent className="pt-5 pb-5 flex items-center justify-center gap-3 text-muted-foreground">
                <Compass className="h-5 w-5 text-amber-500/70" />
                <p className="text-xs sm:text-sm font-medium">Tidak ada trip aktif saat ini. Siap membuka trip trading berikutnya.</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {/* Profit Kotor */}
            <Card className="hover:border-emerald-500/30">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit Kotor</span>
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-500 tabular-nums tracking-tight">{fmt(stats?.profitBulanIni || 0)}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Estimasi margin bulan ini</p>
              </CardContent>
            </Card>

            {/* Total Penjualan */}
            <Card className="hover:border-blue-500/30">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Penjualan</span>
                  <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/20">
                    <Banknote className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums tracking-tight">{fmt(stats?.totalPenjualanBulanIni || 0)}</p>
                  {(stats?.totalPenjualanBulanIniKHR || 0) > 0 && (
                    <p className="text-xs font-semibold text-blue-500 tabular-nums">
                      ( ៛ {(stats?.totalPenjualanBulanIniKHR || 0).toLocaleString('en-US')} )
                    </p>
                  )}
                  {(stats?.totalPenjualanBulanIniUSD || 0) > 0 && (
                    <p className="text-xs font-semibold text-blue-500 tabular-nums">
                      ( $ {(stats?.totalPenjualanBulanIniUSD || 0).toLocaleString('en-US')} )
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Omset bruto bulan ini</p>
              </CardContent>
            </Card>

            {/* Pengeluaran */}
            <Card className="hover:border-rose-500/30">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengeluaran</span>
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/20">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-rose-500 tabular-nums tracking-tight">{fmt(stats?.totalPengeluaranBulanIni || 0)}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Biaya operasional bulan ini</p>
              </CardContent>
            </Card>

            {/* Profit Bersih */}
            <Card className={`relative overflow-hidden ${profitBersih >= 0 ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-card' : 'border-rose-500/40 bg-gradient-to-b from-rose-500/5 to-card'}`}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profit Bersih</span>
                  <div className={`p-2 rounded-xl border ${profitBersih >= 0 ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/15 text-rose-500 border-rose-500/20'}`}>
                    <BarChart3 className="h-4 w-4" />
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${profitBersih >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {fmt(profitBersih)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Profit Kotor − Pengeluaran</p>
              </CardContent>
            </Card>

            {/* Piutang */}
            <Card className={stats?.totalPiutang ? 'border-amber-500/40 bg-amber-500/5' : ''}>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Piutang</span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${stats?.totalPiutang ? 'text-amber-500' : 'text-foreground'}`}>
                  {fmt(stats?.totalPiutang || 0)}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">
                  {stats?.totalPiutangCount || 0} transaksi belum lunas
                </p>
              </CardContent>
            </Card>

            {/* Nilai Stok */}
            <Card className="hover:border-purple-500/30">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nilai Stok Aktif</span>
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/20">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums tracking-tight">{fmt(stats?.totalStokNilai || 0)}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">{stats?.totalProdukAktif || 0} varian produk aktif</p>
              </CardContent>
            </Card>
          </div>

          {/* Warning Banner */}
          {(stats?.totalPiutang || 0) > 0 && (
            <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-card to-card dark:border-amber-500/30 shadow-md">
              <CardContent className="pt-4 pb-4 flex items-start sm:items-center gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-amber-500">Perhatian: Piutang Penjualan Belum Lunas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Terdapat <span className="font-semibold text-foreground">{stats?.totalPiutangCount} transaksi</span> yang belum dilunasi dengan total tagihan <span className="font-semibold text-amber-500">{fmt(stats?.totalPiutang || 0)}</span>. Silakan periksa menu Penjualan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
