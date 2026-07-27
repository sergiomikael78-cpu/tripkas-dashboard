'use client'

import { useState, useEffect } from 'react'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Fallback to simple button if ui/button is missing/not used properly, but we have ui/button
import { Button } from '@/components/ui/button'
import { useTrips } from '@/hooks/useTrips'
import { useWorkspace } from '@/hooks/useWorkspace'

interface TripFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tripToEdit?: { id: string; code: string; start_date: string; status?: string; notes: string | null } | null
}

export function TripForm({ open, onOpenChange, tripToEdit }: TripFormProps) {
  const { createTrip, updateTrip } = useTrips()
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
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
      title={tripToEdit ? "Edit Trip" : "Buat Trip Baru"}
      description="Masukkan detail trip di bawah ini."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="code">Kode Trip</Label>
          <Input 
            id="code" 
            placeholder="Contoh: TRP-2401" 
            value={code} 
            onChange={(e) => setCode(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_date">Tanggal Mulai</Label>
          <Input 
            id="start_date" 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Keterangan trip..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
          {tripToEdit && tripToEdit.status === 'running' && (role === 'owner' || role === 'admin') && (
            <Button 
              type="button" 
              variant="secondary"
              className="w-full bg-amber-100 text-amber-900 hover:bg-amber-200"
              disabled={isSubmitting}
              onClick={handleCloseTrip}
            >
              Tutup Trip (Selesai)
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
