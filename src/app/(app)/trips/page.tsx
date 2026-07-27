'use client'

import { useState } from 'react'
import { Plus, MapPin, Calendar, FileText, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TripForm } from '@/components/trips/TripForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useTrips } from '@/hooks/useTrips'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function TripsPage() {
  const { trips, isLoading, deleteTrip } = useTrips()
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)

  const canManageTrips = role === 'owner' || role === 'admin'

  const handleCreateNew = () => {
    setSelectedTrip(null)
    setIsFormOpen(true)
  }

  const handleEdit = (trip: any) => {
    if (!canManageTrips) return
    setSelectedTrip(trip)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Manajemen Trip Trading
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Kelola periode trip operasional untuk mengelompokkan data pencatatan transaksi.
          </p>
        </div>

        {canManageTrips && (
          <Button onClick={handleCreateNew} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
            <Plus className="h-4 w-4" />
            <span>Buat Trip Baru</span>
          </Button>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !trips ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardHeader className="pb-3 space-y-2">
                  <div className="h-5 w-28 rounded-lg bg-muted shimmer" />
                  <div className="h-4 w-16 rounded-full bg-muted shimmer" />
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  <div className="h-3.5 w-3/4 rounded bg-muted shimmer" />
                  <div className="h-3.5 w-1/2 rounded bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : trips.length === 0 ? (
          <Card className="col-span-full border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Belum Ada Trip Terdaftar</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Buat trip operasional baru untuk memulai pengelompokan penjualan, pembelian, dan pengeluaran.
                </p>
              </div>
              {canManageTrips && (
                <Button onClick={handleCreateNew} variant="outline" className="mt-2 rounded-xl text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Trip Sekarang</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => {
            const isRunning = trip.status === 'running'
            return (
              <Card 
                key={trip.id} 
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                  isRunning 
                    ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card dark:border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-500/60' 
                    : 'hover:border-border/80 dark:hover:border-white/20'
                }`}
                onClick={() => handleEdit(trip)}
              >
                {isRunning && (
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
                )}
                
                <CardHeader className="pb-3 pt-5 pl-5">
                  <CardTitle className="flex justify-between items-start text-base">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${isRunning ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-muted/80 text-muted-foreground border-border/60'}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                          {trip.code}
                        </span>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Kode Referensi</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge 
                        variant={isRunning ? "default" : "outline"}
                        className={`gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold ${
                          isRunning 
                            ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse-subtle' 
                            : 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {isRunning ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>Berjalan</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                            <span>Selesai</span>
                          </>
                        )}
                      </Badge>

                      {canManageTrips && (
                        <LuxuryDeleteDialog 
                          title="Hapus Trip?" 
                          description="Trip tidak bisa dihapus jika sudah memiliki riwayat transaksi (Penjualan/Pembelian)."
                          onConfirm={() => deleteTrip(trip.id)} 
                        />
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pl-5 pb-5 pt-1 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span>Mulai: <strong className="text-foreground font-semibold">{new Date(trip.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                  {trip.end_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                      <span>Selesai: <strong className="text-foreground font-semibold">{new Date(trip.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                    </div>
                  )}
                  {trip.notes && (
                    <div className="flex items-start gap-2 pt-1 border-t border-border/40 dark:border-white/5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-muted-foreground leading-relaxed">{trip.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <TripForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        tripToEdit={selectedTrip} 
      />
    </div>
  )
}
