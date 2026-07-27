'use client'

import { useState, useEffect } from 'react'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSuppliers } from '@/hooks/useSuppliers'

interface SupplierFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierToEdit?: { id: string; name: string; contact: string | null; notes: string | null; is_active: boolean } | null
}

export function SupplierForm({ open, onOpenChange, supplierToEdit }: SupplierFormProps) {
  const { createSupplier, updateSupplier } = useSuppliers()
  
  const [name, setName] = useState(supplierToEdit?.name || '')
  const [contact, setContact] = useState(supplierToEdit?.contact || '')
  const [notes, setNotes] = useState(supplierToEdit?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(supplierToEdit?.name || '')
      setContact(supplierToEdit?.contact || '')
      setNotes(supplierToEdit?.notes || '')
    }
  }, [open, supplierToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (supplierToEdit) {
        await updateSupplier({ id: supplierToEdit.id, name, contact, notes })
      } else {
        await createSupplier({ name, contact, notes })
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save supplier", error)
      alert("Gagal menyimpan supplier")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={supplierToEdit ? "Edit Data Supplier" : "Tambah Supplier Baru"}
      description="Masukkan profil kontak dan alamat mitra supplier rokok."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-semibold">Nama Supplier / PT</Label>
          <Input 
            id="name" 
            placeholder="PT Sampoerna / Pabrik Budi" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact" className="text-xs font-semibold">No HP / WhatsApp (Opsional)</Label>
          <Input 
            id="contact" 
            placeholder="081234567890 / email@contoh.com" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Alamat / Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Alamat gudang supplier atau catatan khusus..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="pt-3 flex flex-col gap-2.5">
          <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-md shadow-amber-500/20" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan Data..." : "Simpan Supplier"}
          </Button>
          {supplierToEdit && (
            <Button 
              type="button" 
              variant="outline"
              className={`w-full h-10 rounded-xl font-bold ${
                supplierToEdit.is_active 
                  ? "border-rose-500/40 text-rose-500 hover:bg-rose-500/10" 
                  : "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
              }`}
              disabled={isSubmitting}
              onClick={async () => {
                const confirmMsg = supplierToEdit.is_active 
                  ? "Yakin ingin menonaktifkan supplier ini?" 
                  : "Yakin ingin mengaktifkan kembali supplier ini?";
                if (confirm(confirmMsg)) {
                  setIsSubmitting(true)
                  try {
                    await updateSupplier({ id: supplierToEdit.id, is_active: !supplierToEdit.is_active })
                    onOpenChange(false)
                  } catch(e) {
                    alert("Gagal merubah status")
                  } finally {
                    setIsSubmitting(false)
                  }
                }
              }}
            >
              {supplierToEdit.is_active ? "Nonaktifkan Supplier Ini" : "Aktifkan Kembali Supplier"}
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
