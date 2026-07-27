'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import { usePurchases } from '@/hooks/usePurchases'
import { useProducts } from '@/hooks/useProducts'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useTrips } from '@/hooks/useTrips'

interface CartItem {
  product_id: string
  name: string
  unit: string
  quantity: number
  buy_price: number
}

export default function CreatePurchasePage() {
  const router = useRouter()
  const { createPurchase } = usePurchases()
  const { products } = useProducts()
  const { suppliers, createSupplier } = useSuppliers()
  const { trips } = useTrips()

  const [supplierInput, setSupplierInput] = useState('')
  const [tripId, setTripId] = useState('none')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  
  const [cart, setCart] = useState<CartItem[]>([])
  
  // States for adding new item
  const [selectedProductId, setSelectedProductId] = useState('')
  const [itemQty, setItemQty] = useState<number | ''>('')
  const [itemPrice, setItemPrice] = useState<number | ''>('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter active entities only
  const activeProducts = products?.filter(p => p.is_active) || []
  const activeTrips = trips?.filter(t => t.status === 'running') || []

  const handleAddToCart = () => {
    if (!selectedProductId || !itemQty || !itemPrice) return
    const product = products?.find(p => p.id === selectedProductId)
    if (!product) return

    setCart([...cart, {
      product_id: product.id,
      name: product.name,
      unit: product.unit,
      quantity: Number(itemQty),
      buy_price: Number(itemPrice)
    }])

    // Reset inputs
    setSelectedProductId('')
    setItemQty('')
    setItemPrice('')
  }

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.buy_price), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supplierInput.trim()) {
      alert('Nama supplier tidak boleh kosong')
      return
    }

    if (cart.length === 0) {
      alert('Keranjang kosong! Tambahkan minimal satu barang.')
      return
    }

    try {
      setIsSubmitting(true)

      // INSTANT SUPPLIER INNOVATION
      let finalSupplierId = ''
      const existingSupplier = suppliers?.find(s => s.name.toLowerCase() === supplierInput.trim().toLowerCase())
      
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id
      } else {
        const newSupp = await createSupplier({ 
          name: supplierInput.trim(), 
          notes: 'Dibuat otomatis dari pencatatan pembelian instan'
        })
        finalSupplierId = newSupp.id
      }

      await createPurchase({
        supplier_id: finalSupplierId,
        trip_id: tripId !== 'none' ? tripId : null,
        purchase_date: purchaseDate,
        notes,
        items: cart.map(c => ({
          product_id: c.product_id,
          quantity: c.quantity,
          buy_price: c.buy_price
        }))
      })
      
      router.push('/purchases')
    } catch (error: any) {
      alert('Gagal menyimpan pembelian: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/purchases" />} nativeButton={false}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catat Pembelian</h1>
          <p className="text-sm text-muted-foreground mt-1">Catat pembelian barang dari supplier (Stok Masuk).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2 relative">
              <Label>Supplier (Ketik & Auto-simpan) <span className="text-red-500">*</span></Label>
              <Input 
                list="suppliers-list"
                placeholder="Ketik nama supplier..."
                value={supplierInput}
                onChange={(e) => setSupplierInput(e.target.value)}
                required
                className="w-full"
                autoComplete="off"
              />
              <datalist id="suppliers-list">
                {suppliers?.map(s => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
              <p className="text-[10px] text-muted-foreground mt-1">
                Jika nama belum ada, sistem akan otomatis mendaftarkannya untuk Anda.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Trip (Opsional)</Label>
              <Select value={tripId} onValueChange={(val) => setTripId(val || '')}>
                <SelectTrigger>
                  <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${tripId === 'none' || !tripId ? 'text-muted-foreground' : ''}`}>
                    {tripId === 'none' ? 'Gudang Pusat (Tanpa Trip)' : (activeTrips.find(t => t.id === tripId)?.code || tripId)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Gudang Pusat (Tanpa Trip)</SelectItem>
                  {activeTrips.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Tanggal Pembelian <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                value={purchaseDate}
                onChange={e => setPurchaseDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Keranjang Belanja */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Barang</CardTitle>
            <CardDescription>Tambahkan produk yang Anda beli dari supplier ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Form Tambah Item (Nested Card) */}
            <div className="bg-muted/40 p-4 rounded-xl space-y-4 border border-amber-500/30 shadow-inner">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Tambah Barang ke Keranjang (Restok)</h4>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Pilih Produk Rokok</Label>
                <Select 
                  value={selectedProductId} 
                  onValueChange={(val) => {
                    setSelectedProductId(val || '');
                    const p = products?.find(p => p.id === val);
                    if (p) {
                      setItemPrice(p.default_buy_price || '');
                    }
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${!selectedProductId ? 'text-muted-foreground' : ''}`}>
                      {selectedProductId ? (activeProducts.find(p => p.id === selectedProductId)?.name || selectedProductId) : 'Pilih Produk'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (Stok Saat Ini: {p.current_stock} {p.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Kuantitas Restok</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="0" 
                    value={itemQty} 
                    onChange={e => setItemQty(Number(e.target.value) || '')} 
                    className="h-10 rounded-xl font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Harga Modal per Satuan (Rp)</Label>
                  <CurrencyInput 
                    min="0" 
                    placeholder="0" 
                    value={itemPrice} 
                    onChangeValue={(val) => setItemPrice(val)} 
                    className="h-10 rounded-xl font-bold tabular-nums text-amber-500"
                  />
                </div>
              </div>
              <Button 
                type="button" 
                className="w-full h-10 rounded-xl font-semibold shadow-md shadow-amber-500/15"
                onClick={handleAddToCart}
                disabled={!selectedProductId || !itemQty || !itemPrice}
              >
                <Plus className="h-4 w-4 mr-2" /> Masukkan Keranjang
              </Button>
            </div>

            {/* List Item di Keranjang */}
            {cart.length > 0 ? (
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-md shadow-sm bg-white dark:bg-zinc-950">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} x Rp {item.buy_price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-primary tabular-nums">
                        Rp {(item.quantity * item.buy_price).toLocaleString('id-ID')}
                      </p>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        onClick={() => handleRemoveFromCart(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center p-4 bg-zinc-900 text-white dark:bg-zinc-800 rounded-md mt-4">
                  <span className="font-semibold">Total Pembelian</span>
                  <span className="font-bold text-xl tabular-nums">Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-md bg-muted/20">
                <p className="text-muted-foreground">Keranjang masih kosong</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catatan Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              id="notes" 
              placeholder="Tambahkan keterangan opsional jika ada..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-2">
          <Button type="button" variant="outline" className="w-1/3" render={<Link href="/purchases" />} nativeButton={false}>
            Batal
          </Button>
          <Button type="submit" className="w-2/3" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi Pembelian"}
          </Button>
        </div>
      </form>
    </div>
  )
}
