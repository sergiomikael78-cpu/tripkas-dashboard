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
      title={supplierToEdit ? "Edit Supplier" : "Tambah Supplier"}
      description="Masukkan data supplier di bawah ini."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Supplier</Label>
          <Input 
            id="name" 
            placeholder="PT ABCD / Budi" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">Kontak (Opsional)</Label>
          <Input 
            id="contact" 
            placeholder="No HP / Email" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Alamat atau keterangan lain..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
          {supplierToEdit && (
            <Button 
              type="button" 
              variant="destructive"
              className="w-full"
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
              {supplierToEdit.is_active ? "Nonaktifkan Supplier" : "Aktifkan Supplier"}
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
