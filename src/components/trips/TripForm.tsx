'use client'

import { useState, useEffect } from 'react'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CalendarIcon, Compass } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { useWorkspace } from '@/hooks/useWorkspace'

interface TripFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripToEdit?: { id: string; code: string; start_date: string; status?: string; notes: string | null } | null
}

export function TripForm({ open, onOpenChange, tripToEdit }: TripFormProps) {
  const { createTrip, updateTrip } = useTrips()
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
  const [code, setCode] = useState(tripToEdit?.code || '')
  // format date as YYYY-MM-DD for input type="date"
  const [startDate, setStartDate] = useState(tripToEdit?.start_date ? tripToEdit.start_date.split('T')[0] : new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(tripToEdit?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when opened with new data
  useEffect(() => {
    if (open) {
      setCode(tripToEdit?.code || '')
      setStartDate(tripToEdit?.start_date ? tripToEdit.start_date.split('T')[0] : new Date().toISOString().split('T')[0])
      setNotes(tripToEdit?.notes || '')
    }
  }, [open, tripToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (tripToEdit) {
        await updateTrip({ id: tripToEdit.id, code, start_date: startDate, notes })
      } else {
        await createTrip({ code, start_date: startDate, notes })
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save trip", error)
      alert(error.message || "Gagal menyimpan trip")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseTrip = async () => {
    if (!tripToEdit || !confirm("Yakin ingin menutup trip ini? Transaksi untuk trip ini tidak bisa ditambah lagi.")) return
    setIsSubmitting(true)
    try {
      await updateTrip({ 
        id: tripToEdit.id, 
        status: 'closed', 
        end_date: new Date().toISOString() 
      })
      onOpenChange(false)
    } catch (error: any) {
      alert("Gagal menutup trip")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={tripToEdit ? "Edit Operasional Trip" : "Buka Trip Operasional Baru"}
      description="Masukkan kode identifikasi dan tanggal pengiriman barang trip."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="text-xs font-semibold flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-amber-500" />
            <span>Kode Identifikasi Trip</span>
          </Label>
          <Input 
            id="code" 
            placeholder="Contoh: TRP-2401" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            required 
            className="h-10 rounded-xl font-bold uppercase tracking-wider text-amber-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-xs font-semibold flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-amber-500" />
            <span>Tanggal Mulai Trip</span>
          </Label>
          <Input 
            id="start_date" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            required 
            className="h-10 rounded-xl"
          />
          <p className="text-[11px] text-muted-foreground">Pilih tanggal awal dimulainya jalur operasional sales.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Catatan Operasional (Opsional)</Label>
          <Textarea 
            id="notes" 
            placeholder="Keterangan rute pasar, nama driver, atau armada..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="rounded-xl min-h-20"
          />
        </div>

        <div className="pt-3 flex flex-col gap-2.5">
          <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-md shadow-amber-500/20" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan Data..." : "Simpan Trip"}
          </Button>

          {tripToEdit && tripToEdit.status === 'running' && (role === 'owner' || role === 'admin') && (
            <Button 
              type="button" 
              variant="outline"
              className="w-full h-10 rounded-xl border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
              disabled={isSubmitting}
              onClick={handleCloseTrip}
            >
              Tutup Trip Ini (Selesai Operasional)
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
