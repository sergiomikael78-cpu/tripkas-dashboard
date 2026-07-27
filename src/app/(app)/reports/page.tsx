'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useReports } from '@/hooks/useReports'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useStockHistory } from '@/hooks/useStockHistory'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground mt-1">Analisis bisnis per dimensi.</p>
      </div>

      {/* Daily Currency Summary */}
      {dailyCurrencyReport.data && dailyCurrencyReport.data.some((c: any) => c.total > 0) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dailyCurrencyReport.data.filter((c: any) => c.total > 0).map((curr: any) => (
            <Card key={curr.currency} className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CardContent className="pt-4 pb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                    Uang Masuk Hari Ini ({curr.currency})
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">
                    {curr.total.toLocaleString('en-US')} <span className="text-sm font-normal">{curr.currency}</span>
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{curr.currency === 'KHR' ? '៛' : '$'}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Buttons */}
      <div className="flex gap-2 flex-wrap pt-2">
        {(['trip', 'supplier', 'customer', 'stock'] as Tab[]).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'trip' ? 'Per Trip' : tab === 'supplier' ? 'Per Supplier' : tab === 'customer' ? 'Per Customer' : 'Pergerakan Stok'}
          </Button>
        ))}
      </div>

      {/* TAB: Per Trip */}
      {activeTab === 'trip' && (
        <div className="space-y-6">
          {tripReport.isPending ? (
            <p>Memuat laporan trip...</p>
          ) : !tripReport.data || tripReport.data.length === 0 ? (
            <p className="text-muted-foreground">Belum ada data trip.</p>
          ) : (
            <>
              {canSeeFinancials && tripReport.data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Perbandingan Trip</CardTitle>
                    <CardDescription>Profit dan Penjualan per Trip</CardDescription>
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
                        <ChartTooltip content={<ChartTooltipContent formatter={(val: any) => fmt(val as number)} />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="netProfit" fill="var(--color-netProfit)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-4">
                {tripReport.data.map((trip: any) => (
                  <Card key={trip.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-lg">
                        <span>{trip.code}</span>
                        <Badge variant={trip.status === 'running' ? 'default' : 'secondary'}>
                          {trip.status === 'running' ? 'Berjalan' : 'Selesai'}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(trip.start_date).toLocaleDateString('id-ID')}
                        {trip.end_date ? ` — ${new Date(trip.end_date).toLocaleDateString('id-ID')}` : ' — Sekarang'}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {canSeeFinancials && (
                          <div>
                            <p className="text-muted-foreground text-xs">Modal Masuk</p>
                            <p className="font-semibold tabular-nums">{fmt(trip.totalPurchase)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground text-xs">Total Penjualan</p>
                          <p className="font-semibold tabular-nums">{fmt(trip.totalSales)}</p>
                        </div>
                        {canSeeFinancials && (
                          <>
                            <div>
                              <p className="text-muted-foreground text-xs">Profit Kotor</p>
                              <p className="font-semibold text-green-600 tabular-nums">{fmt(trip.totalProfit)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Pengeluaran Trip</p>
                              <p className="font-semibold text-red-500 tabular-nums">{fmt(trip.totalExpenses)}</p>
                            </div>
                            <div className="col-span-2 border-t pt-2 mt-1">
                              <p className="text-muted-foreground text-xs">Profit Bersih Trip</p>
                              <p className={`text-lg font-bold tabular-nums ${trip.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            <p>Memuat laporan supplier...</p>
          ) : !supplierReport.data || supplierReport.data.length === 0 ? (
            <p className="text-muted-foreground">Belum ada data supplier.</p>
          ) : (
            <>
              {canSeeFinancials && supplierReport.data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Perbandingan Supplier</CardTitle>
                    <CardDescription>Total Pembelian per Supplier</CardDescription>
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
                        <ChartTooltip content={<ChartTooltipContent formatter={(val: number) => fmt(val)} />} />
                        <Bar dataKey="totalPurchase" fill="var(--color-totalPurchase)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {supplierReport.data.map((s: any) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {canSeeFinancials && (
                          <div>
                            <p className="text-muted-foreground text-xs">Total Pembelian</p>
                            <p className="font-semibold tabular-nums">{fmt(s.totalPurchase)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground text-xs">Total Qty Dibeli</p>
                          <p className="font-semibold tabular-nums">{s.totalQty}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Jumlah Transaksi</p>
                          <p className="font-semibold tabular-nums">{s.txCount}</p>
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
        <div className="space-y-4">
          {customerReport.isPending ? (
            <p>Memuat laporan pelanggan...</p>
          ) : !customerReport.data || customerReport.data.length === 0 ? (
            <p className="text-muted-foreground">Belum ada data pelanggan.</p>
          ) : (
            customerReport.data.map((c: any) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>{c.name}</span>
                    <Badge variant="outline">{c.type === 'warung' ? 'Warung' : 'Teman'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Total Pembelian</p>
                      <p className="font-semibold tabular-nums">{fmt(c.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Jumlah Transaksi</p>
                      <p className="font-semibold tabular-nums">{c.txCount}</p>
                    </div>
                    {canSeeFinancials && (
                      <div>
                        <p className="text-muted-foreground text-xs">Profit dari Customer</p>
                        <p className="font-semibold text-green-600 tabular-nums">{fmt(c.totalProfit)}</p>
                      </div>
                    )}
                    {c.piutangCount > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs">Piutang</p>
                        <p className="font-semibold text-amber-600 tabular-nums">{fmt(c.piutangAmount)}</p>
                        <p className="text-xs text-amber-500 tabular-nums">{c.piutangCount} belum lunas</p>
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
            <p>Memuat riwayat stok...</p>
          ) : !stockHistory || stockHistory.length === 0 ? (
            <p className="text-muted-foreground">Belum ada riwayat pergerakan stok.</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Pergerakan Stok</CardTitle>
                <CardDescription>Total stok masuk vs keluar harian</CardDescription>
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
