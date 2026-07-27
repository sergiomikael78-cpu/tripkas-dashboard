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
      title={customerToEdit ? "Edit Profile Pelanggan" : "Tambah Pelanggan Baru"}
      description="Masukkan profil kontak dan kategori pelanggan warung / grosir."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-semibold">Nama Pelanggan / Toko</Label>
          <Input 
            id="name" 
            placeholder="Warung Berkah / Toko Pak Budi" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type" className="text-xs font-semibold">Kategori Pelanggan</Label>
          <Select value={type} onValueChange={(val) => setType(val as CustomerType)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Pilih Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warung">Warung / Toko Kelontong</SelectItem>
              <SelectItem value="teman">Grosir / Pembeli Eceran</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact" className="text-xs font-semibold">No HP / WhatsApp (Opsional)</Label>
          <Input 
            id="contact" 
            placeholder="081234567890" 
            value={contact} 
            onChange={(e) => setContact(e.target.value)} 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Alamat / Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Alamat toko atau batasan piutang..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="h-10 rounded-xl"
          />
        </div>
        <div className="pt-3 flex flex-col gap-2.5">
          <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-md shadow-amber-500/20" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan Data..." : "Simpan Pelanggan"}
          </Button>
          {customerToEdit && (
            <Button 
              type="button" 
              variant="outline"
              className={`w-full h-10 rounded-xl font-bold ${
                customerToEdit.is_active 
                  ? "border-rose-500/40 text-rose-500 hover:bg-rose-500/10" 
                  : "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
              }`}
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
              {customerToEdit.is_active ? "Nonaktifkan Pelanggan Ini" : "Aktifkan Kembali Pelanggan"}
            </Button>
          )}
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
