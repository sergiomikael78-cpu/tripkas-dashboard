'use client'

import { useState, useEffect } from 'react'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomers, CustomerType } from '@/hooks/useCustomers'

interface CustomerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerToEdit?: { id: string; name: string; type: CustomerType; contact: string | null; notes: string | null; is_active: boolean } | null
}

export function CustomerForm({ open, onOpenChange, customerToEdit }: CustomerFormProps) {
  const { createCustomer, updateCustomer } = useCustomers()
  
  const [name, setName] = useState(customerToEdit?.name || '')
  const [type, setType] = useState<CustomerType>(customerToEdit?.type || 'warung')
  const [contact, setContact] = useState(customerToEdit?.contact || '')
  const [notes, setNotes] = useState(customerToEdit?.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(customerToEdit?.name || '')
      setType(customerToEdit?.type || 'warung')
      setContact(customerToEdit?.contact || '')
      setNotes(customerToEdit?.notes || '')
    }
  }, [open, customerToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (customerToEdit) {
        await updateCustomer({ id: customerToEdit.id, name, type, contact, notes })
      } else {
        await createCustomer({ name, type, contact, notes })
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save customer", error)
      alert("Gagal menyimpan customer")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={customerToEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}
      description="Masukkan detail pelanggan di bawah ini."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Pelanggan</Label>
          <Input 
            id="name" 
            placeholder="Warung XYZ / Pak Budi" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipe Pelanggan</Label>
          <Select value={type} onValueChange={(val) => setType(val as CustomerType)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warung">Warung</SelectItem>
              <SelectItem value="teman">Teman (Grosir/Ecer)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact">Kontak (Opsional)</Label>
          <Input 
            id="contact" 
            placeholder="No HP" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Keterangan lain..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
          {customerToEdit && (
            <Button 
              type="button" 
              variant="destructive"
              className="w-full"
              disabled={isSubmitting}
              onClick={async () => {
                const confirmMsg = customerToEdit.is_active 
                  ? "Yakin ingin menonaktifkan pelanggan ini?" 
                  : "Yakin ingin mengaktifkan kembali pelanggan ini?";
                if (confirm(confirmMsg)) {
                  setIsSubmitting(true)
                  try {
                    await updateCustomer({ id: customerToEdit.id, is_active: !customerToEdit.is_active })
                    onOpenChange(false)
                  } catch(e) {
                    alert("Gagal merubah status")
                  } finally {
                    setIsSubmitting(false)
                  }
                }
              }}
            >
              {customerToEdit.is_active ? "Nonaktifkan Pelanggan" : "Aktifkan Pelanggan"}
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
