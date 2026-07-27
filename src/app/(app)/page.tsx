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
  BarChart3
} from 'lucide-react'

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { data: workspace } = useWorkspace()

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
  const profitBersih = (stats?.profitBulanIni || 0) - (stats?.totalPengeluaranBulanIni || 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang kembali! Ini ringkasan bisnis Anda hari ini.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-5 pb-4">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-7 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Trip Status */}
          {stats?.activeTrips && stats.activeTrips.length > 0 ? (
            <div className={`grid gap-4 ${stats.activeTrips.length > 1 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {stats.activeTrips.map((trip) => (
                <Card key={trip.id} className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Trip Aktif</p>
                        <p className="text-lg font-bold text-primary">{trip.code}</p>
                      </div>
                    </div>
                    <Badge>Berjalan</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tidak ada trip aktif saat ini.</p>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Profit Kotor */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profit Kotor</p>
                </div>
                <p className="text-xl font-bold text-green-600 tabular-nums">{fmt(stats?.profitBulanIni || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            {/* Total Penjualan */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Penjualan</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold tabular-nums">{fmt(stats?.totalPenjualanBulanIni || 0)}</p>
                  {(stats?.totalPenjualanBulanIniKHR || 0) > 0 && (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      ( ៛ {(stats?.totalPenjualanBulanIniKHR || 0).toLocaleString('en-US')} )
                    </p>
                  )}
                  {(stats?.totalPenjualanBulanIniUSD || 0) > 0 && (
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      ( $ {(stats?.totalPenjualanBulanIniUSD || 0).toLocaleString('en-US')} )
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            {/* Pengeluaran */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pengeluaran</p>
                </div>
                <p className="text-xl font-bold text-red-500 tabular-nums">{fmt(stats?.totalPengeluaranBulanIni || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
              </CardContent>
            </Card>

            {/* Profit Bersih */}
            <Card className={profitBersih >= 0 ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className={`h-4 w-4 ${profitBersih >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Profit Bersih</p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${profitBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(profitBersih)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Profit Kotor − Pengeluaran</p>
              </CardContent>
            </Card>

            {/* Piutang */}
            <Card className={stats?.totalPiutang ? 'border-amber-200' : ''}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Piutang</p>
                </div>
                <p className={`text-xl font-bold tabular-nums ${stats?.totalPiutang ? 'text-amber-600' : 'text-foreground'}`}>
                  {fmt(stats?.totalPiutang || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.totalPiutangCount || 0} transaksi belum lunas
                </p>
              </CardContent>
            </Card>

            {/* Nilai Stok */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nilai Stok</p>
                </div>
                <p className="text-xl font-bold tabular-nums">{fmt(stats?.totalStokNilai || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats?.totalProdukAktif || 0} produk aktif</p>
              </CardContent>
            </Card>
          </div>

          {/* Warning */}
          {(stats?.totalPiutang || 0) > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Perhatian: Ada Piutang Belum Lunas</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    Terdapat {stats?.totalPiutangCount} transaksi penjualan yang belum dilunasi senilai {fmt(stats?.totalPiutang || 0)}. 
                    Buka menu Penjualan untuk melihat detailnya.
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
