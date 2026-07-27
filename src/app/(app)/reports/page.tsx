'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReports } from '@/hooks/useReports'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useStockHistory } from '@/hooks/useStockHistory'
import { 
  Sparkles, Map, Store, Users, Layers, TrendingUp, BarChart3, Coins 
} from 'lucide-react'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

type Tab = 'trip' | 'supplier' | 'customer' | 'stock'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trip')
  const { tripReport, supplierReport, customerReport, dailyCurrencyReport } = useReports()
  const { data: workspace } = useWorkspace()
  const { data: stockHistory, isLoading: isStockLoading } = useStockHistory(workspace?.workspaceId || undefined)
  const role = workspace?.role
  const canSeeFinancials = role === 'owner' || role === 'admin'

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const tripChartConfig = {
    netProfit: {
      label: "Profit Bersih",
      color: "var(--primary)",
    },
    totalSales: {
      label: "Total Penjualan",
      color: "var(--secondary)",
    }
  } satisfies ChartConfig

  const supplierChartConfig = {
    totalPurchase: {
      label: "Total Pembelian",
      color: "var(--primary)",
    }
  } satisfies ChartConfig

  const stockChartConfig = {
    masuk: {
      label: "Stok Masuk",
      color: "var(--secondary)",
    },
    keluar: {
      label: "Stok Keluar",
      color: "var(--primary)",
    }
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
            Laporan & Analisis Bisnis
          </h1>
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Analisis perbandingan per trip, performa supplier, kontribusi pelanggan, dan tren pergerakan stok.
        </p>
      </div>

      {/* Daily Currency Summary */}
      {dailyCurrencyReport.data && dailyCurrencyReport.data.some((c: any) => c.total > 0) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dailyCurrencyReport.data.filter((c: any) => c.total > 0).map((curr: any) => (
            <Card key={curr.currency} className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-card dark:border-emerald-500/30 shadow-md">
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-600" />
              <CardContent className="pt-4 pb-4 pl-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Penerimaan Cash Hari Ini ({curr.currency})
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums tracking-tight">
                    {curr.total.toLocaleString('en-US')} <span className="text-xs font-semibold text-muted-foreground">{curr.currency}</span>
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl flex items-center justify-center shrink-0">
                  <span className="font-bold text-lg">{curr.currency === 'KHR' ? '៛' : '$'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Nav Buttons */}
      <div className="flex gap-2 flex-wrap p-1 rounded-2xl bg-muted/50 border border-border/40 dark:border-white/5 max-w-fit">
        {(['trip', 'supplier', 'customer', 'stock'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab
          return (
            <Button
              key={tab}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl text-xs font-semibold px-4 transition-all duration-200 ${
                isActive ? "shadow-md shadow-amber-500/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === 'trip' && <Map className="mr-1.5 h-3.5 w-3.5" />}
              {tab === 'supplier' && <Store className="mr-1.5 h-3.5 w-3.5" />}
              {tab === 'customer' && <Users className="mr-1.5 h-3.5 w-3.5" />}
              {tab === 'stock' && <Layers className="mr-1.5 h-3.5 w-3.5" />}
              {tab === 'trip' ? 'Per Trip' : tab === 'supplier' ? 'Per Supplier' : tab === 'customer' ? 'Per Pelanggan' : 'Pergerakan Stok'}
            </Button>
          )
        })}
      </div>

      {/* TAB: Per Trip */}
      {activeTab === 'trip' && (
        <div className="space-y-6">
          {tripReport.isPending ? (
            <div className="space-y-4">
              <Card className="border border-border/60 dark:border-white/10"><CardContent className="h-64 shimmer" /></Card>
            </div>
          ) : !tripReport.data || tripReport.data.length === 0 ? (
            <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8 text-center">
              <CardContent className="text-xs text-muted-foreground font-medium">
                Belum ada data trip terdaftar.
              </CardContent>
            </Card>
          ) : (
            <>
              {canSeeFinancials && tripReport.data.length > 0 && (
                <Card className="border border-border/70 dark:border-white/10 bg-card/80 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-amber-500" />
                      <span>Grafik Perbandingan Trip</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Total Penjualan vs Profit Bersih per Trip</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={tripChartConfig} className="h-[300px] w-full">
                      <BarChart data={tripReport.data.slice().reverse()}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="code" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis 
                          tickFormatter={(value) => `Rp ${(value/1000000).toFixed(1)}M`}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                        />
                        <ChartTooltip content={<ChartTooltipContent formatter={(val) => (val !== undefined ? fmt(Number(val)) : "")} />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netProfit" fill="var(--color-netProfit)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                {tripReport.data.map((trip: any) => (
                  <Card key={trip.id} className="hover:border-amber-500/30 transition-all duration-300">
                    <CardHeader className="pb-3 pt-5 pl-5">
                      <CardTitle className="flex justify-between items-center text-base">
                        <span className="font-bold text-lg tracking-tight text-foreground">{trip.code}</span>
                        <Badge variant={trip.status === 'running' ? 'default' : 'secondary'} className="text-[10px] px-2.5 py-0.5">
                          {trip.status === 'running' ? 'Berjalan' : 'Selesai'}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Periode: {new Date(trip.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {trip.end_date ? ` — ${new Date(trip.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : ' — Sekarang'}
                      </p>
                    </CardHeader>
                    <CardContent className="pl-5 pb-5 pt-1">
                      <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-muted/40 border border-border/40 dark:border-white/5">
                        {canSeeFinancials && (
                          <div>
                            <p className="text-muted-foreground text-[11px] font-medium">Modal Restok</p>
                            <p className="font-bold text-foreground tabular-nums mt-0.5">{fmt(trip.totalPurchase)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground text-[11px] font-medium">Total Penjualan</p>
                          <p className="font-bold text-foreground tabular-nums mt-0.5">{fmt(trip.totalSales)}</p>
                        </div>
                        {canSeeFinancials && (
                          <>
                            <div>
                              <p className="text-muted-foreground text-[11px] font-medium">Profit Kotor</p>
                              <p className="font-bold text-emerald-500 tabular-nums mt-0.5">{fmt(trip.totalProfit)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-[11px] font-medium">Pengeluaran Trip</p>
                              <p className="font-bold text-rose-500 tabular-nums mt-0.5">{fmt(trip.totalExpenses)}</p>
                            </div>
                            <div className="col-span-2 border-t border-border/40 dark:border-white/5 pt-2 mt-1 flex justify-between items-center">
                              <p className="text-muted-foreground text-xs font-semibold">Profit Bersih Trip:</p>
                              <p className={`text-base font-bold tabular-nums ${trip.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {fmt(trip.netProfit)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Per Supplier */}
      {activeTab === 'supplier' && (
        <div className="space-y-6">
          {supplierReport.isPending ? (
            <div className="space-y-4">
              <Card className="border border-border/60 dark:border-white/10"><CardContent className="h-64 shimmer" /></Card>
            </div>
          ) : !supplierReport.data || supplierReport.data.length === 0 ? (
            <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8 text-center">
              <CardContent className="text-xs text-muted-foreground font-medium">
                Belum ada data transaksi supplier.
              </CardContent>
            </Card>
          ) : (
            <>
              {canSeeFinancials && supplierReport.data.length > 0 && (
                <Card className="border border-border/70 dark:border-white/10 bg-card/80 backdrop-blur-md shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Store className="h-4 w-4 text-amber-500" />
                      <span>Volume Pembelian per Supplier</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={supplierChartConfig} className="h-[300px] w-full">
                      <BarChart data={supplierReport.data} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis 
                          type="number"
                          tickFormatter={(value) => `Rp ${(value/1000000).toFixed(1)}M`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <ChartTooltip content={<ChartTooltipContent formatter={(val) => (val !== undefined ? fmt(Number(val)) : "")} />} />
                        <Bar dataKey="totalPurchase" fill="var(--color-totalPurchase)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {supplierReport.data.map((s: any) => (
                  <Card key={s.id} className="hover:border-amber-500/30 transition-all duration-300">
                    <CardHeader className="pb-2 pt-4 pl-4">
                      <CardTitle className="text-base font-bold text-foreground">{s.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-4 pb-4 pt-1">
                      <div className="space-y-1.5 text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border/30">
                        {canSeeFinancials && (
                          <div className="flex justify-between">
                            <span>Total Restok:</span>
                            <span className="font-bold text-emerald-500 tabular-nums">{fmt(s.totalPurchase)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Total Qty Unit:</span>
                          <span className="font-semibold text-foreground tabular-nums">{s.totalQty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Jumlah Transaksi:</span>
                          <span className="font-semibold text-foreground tabular-nums">{s.txCount} kali</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB: Per Customer */}
      {activeTab === 'customer' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customerReport.isPending ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-border/60 dark:border-white/10"><CardContent className="h-32 shimmer" /></Card>
              ))}
            </>
          ) : !customerReport.data || customerReport.data.length === 0 ? (
            <Card className="col-span-full border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8 text-center">
              <CardContent className="text-xs text-muted-foreground font-medium">
                Belum ada data kontribusi pelanggan.
              </CardContent>
            </Card>
          ) : (
            customerReport.data.map((c: any) => (
              <Card key={c.id} className="hover:border-amber-500/30 transition-all duration-300">
                <CardHeader className="pb-2 pt-4 pl-4">
                  <CardTitle className="flex justify-between items-center text-base font-bold">
                    <span className="text-foreground">{c.name}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {c.type === 'warung' ? 'Warung' : 'Grosir'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-4 pb-4 pt-1">
                  <div className="space-y-1.5 text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border/30">
                    <div className="flex justify-between">
                      <span>Total Penjualan:</span>
                      <span className="font-bold text-foreground tabular-nums">{fmt(c.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jumlah Transaksi:</span>
                      <span className="font-semibold text-foreground tabular-nums">{c.txCount} transaksi</span>
                    </div>
                    {canSeeFinancials && (
                      <div className="flex justify-between pt-1 border-t border-border/30">
                        <span>Margin Kotor:</span>
                        <span className="font-bold text-emerald-500 tabular-nums">{fmt(c.totalProfit)}</span>
                      </div>
                    )}
                    {c.piutangCount > 0 && (
                      <div className="flex justify-between text-rose-500 pt-1 border-t border-rose-500/20 font-semibold">
                        <span>Sisa Piutang:</span>
                        <span className="tabular-nums">{fmt(c.piutangAmount)} ({c.piutangCount} transaksi)</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB: Pergerakan Stok */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {isStockLoading ? (
            <Card className="border border-border/60 dark:border-white/10"><CardContent className="h-64 shimmer" /></Card>
          ) : !stockHistory || stockHistory.length === 0 ? (
            <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8 text-center">
              <CardContent className="text-xs text-muted-foreground font-medium">
                Belum ada data tren pergerakan stok.
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-border/70 dark:border-white/10 bg-card/80 backdrop-blur-md shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <span>Tren Masuk vs Keluar Stok Harian</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={stockChartConfig} className="h-[350px] w-full">
                  <LineChart data={stockHistory} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tickLine={false}
                      axisLine={false}
                      width={40}
                    />
                    <ChartTooltip 
                      content={
                        <ChartTooltipContent 
                          labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        />
                      } 
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="masuk" 
                      stroke="var(--color-masuk)" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="keluar" 
                      stroke="var(--color-keluar)" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
