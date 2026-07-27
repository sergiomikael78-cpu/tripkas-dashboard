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
import { CurrencyInput } from "@/components/ui/currency-input"
import { useProducts, ProductUnit } from '@/hooks/useProducts'
import { useWorkspace } from '@/hooks/useWorkspace'

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productToEdit?: any | null
}

export function ProductForm({ open, onOpenChange, productToEdit }: ProductFormProps) {
  const { createProduct, updateProduct } = useProducts()
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
  const [name, setName] = useState(productToEdit?.name || '')
  const [brand, setBrand] = useState(productToEdit?.brand || '')
  const [variant, setVariant] = useState(productToEdit?.variant || '')
  const [unit, setUnit] = useState<ProductUnit>(productToEdit?.unit || 'slop')
  const [defaultBuyPrice, setDefaultBuyPrice] = useState(productToEdit?.default_buy_price || 0)
  const [defaultSellPrice, setDefaultSellPrice] = useState(productToEdit?.default_sell_price || 0)
  const [defaultSellCurrency, setDefaultSellCurrency] = useState(productToEdit?.default_sell_currency || 'IDR')
  const [notes, setNotes] = useState(productToEdit?.notes || '')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only Owner and Admin can see/edit Buy Price
  const canSeeBuyPrice = role === 'owner' || role === 'admin'

  useEffect(() => {
    if (open) {
      setName(productToEdit?.name || '')
      setBrand(productToEdit?.brand || '')
      setVariant(productToEdit?.variant || '')
      setUnit(productToEdit?.unit || 'slop')
      setDefaultBuyPrice(productToEdit?.default_buy_price || 0)
      setDefaultSellPrice(productToEdit?.default_sell_price || 0)
      setDefaultSellCurrency(productToEdit?.default_sell_currency || 'IDR')
      setNotes(productToEdit?.notes || '')
    }
  }, [open, productToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (productToEdit) {
        await updateProduct({ 
          id: productToEdit.id, 
          name, brand, variant, unit, 
          default_buy_price: canSeeBuyPrice ? Number(defaultBuyPrice) : undefined, 
          default_sell_price: Number(defaultSellPrice), 
          default_sell_currency: defaultSellCurrency,
          notes 
        })
      } else {
        await createProduct({ 
          name, brand, variant, unit, 
          default_buy_price: Number(defaultBuyPrice), 
          default_sell_price: Number(defaultSellPrice), 
          default_sell_currency: defaultSellCurrency,
          notes 
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save product", error)
      alert("Gagal menyimpan produk")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={productToEdit ? "Edit Produk Rokok" : "Tambah Produk Rokok"}
      description="Masukkan rincian spesifikasi & acuan harga produk di bawah ini."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-semibold">Nama Produk</Label>
          <Input 
            id="name" 
            placeholder="Misal: Sampoerna Mild 16" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="h-10 rounded-xl"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-xs font-semibold">Merek (Opsional)</Label>
            <Input 
              id="brand" 
              placeholder="Sampoerna" 
              value={brand} 
              onChange={(e) => setBrand(e.target.value)} 
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="variant" className="text-xs font-semibold">Varian (Opsional)</Label>
            <Input 
              id="variant" 
              placeholder="16 Batang" 
              value={variant} 
              onChange={(e) => setVariant(e.target.value)} 
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit" className="text-xs font-semibold">Satuan Kemasan</Label>
          <Select value={unit} onValueChange={(val) => setUnit(val as ProductUnit)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Pilih Satuan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slop">Slop</SelectItem>
              <SelectItem value="karton">Karton</SelectItem>
              <SelectItem value="pak">Pak (Bks)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {canSeeBuyPrice && (
          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border border-border/40">
            <Label htmlFor="default_buy_price" className="text-xs font-bold text-foreground">Harga Modal Default (Rp)</Label>
            <CurrencyInput 
              id="default_buy_price" 
              min="0"
              value={defaultBuyPrice} 
              onChangeValue={(val) => setDefaultBuyPrice(Number(val))} 
              required={!productToEdit} 
              className="h-10 rounded-xl bg-background"
            />
            <p className="text-[11px] text-muted-foreground">Harga modal acuan per {unit}. Rahasia Owner/Admin.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="default_sell_price" className="text-xs font-semibold">Harga Jual Default</Label>
            <CurrencyInput 
              id="default_sell_price" 
              min="0"
              value={defaultSellPrice} 
              onChangeValue={(val) => setDefaultSellPrice(Number(val))} 
              required 
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_sell_currency" className="text-xs font-semibold">Mata Uang</Label>
            <Select value={defaultSellCurrency} onValueChange={(val) => setDefaultSellCurrency(val || 'IDR')}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Pilih" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IDR">IDR (Rp)</SelectItem>
                <SelectItem value="KHR">KHR (Riel)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Catatan (Opsional)</Label>
          <Input 
            id="notes" 
            placeholder="Keterangan lain..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="h-10 rounded-xl"
          />
        </div>
        
        <div className="pt-3">
          <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-md shadow-amber-500/20" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan Data..." : "Simpan Produk"}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
