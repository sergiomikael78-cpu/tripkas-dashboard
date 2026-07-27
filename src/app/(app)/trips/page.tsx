'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TripForm } from '@/components/trips/TripForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useTrips } from '@/hooks/useTrips'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function TripsPage() {
  const { trips, isLoading, deleteTrip } = useTrips()
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Trip</h1>
        {canManageTrips && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Trip
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !trips ? (
          <div>
            <p>Memuat data trip...</p>
          </div>
        ) : trips.length === 0 ? (
          <p className="text-muted-foreground">Belum ada data trip.</p>
        ) : (
          trips.map((trip) => (
            <Card 
              key={trip.id} 
              className={`cursor-pointer hover:border-primary transition-colors ${trip.status === 'running' ? 'border-primary shadow-md' : ''}`}
              onClick={() => handleEdit(trip)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  {trip.code}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trip.status === 'running' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {trip.status === 'running' ? 'Berjalan' : 'Selesai'}
                    </span>
                    {canManageTrips && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <LuxuryDeleteDialog 
                          title="Hapus Trip?" 
                          description="Trip tidak bisa dihapus jika sudah memiliki riwayat transaksi (Penjualan/Pembelian)."
                          onConfirm={() => deleteTrip(trip.id)} 
                        />
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Mulai: {new Date(trip.start_date).toLocaleDateString('id-ID')}</p>
                  {trip.end_date && <p>Selesai: {new Date(trip.end_date).toLocaleDateString('id-ID')}</p>}
                  {trip.notes && <p className="truncate">Catatan: {trip.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))
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
