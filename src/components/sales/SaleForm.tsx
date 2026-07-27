import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
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
import { useSales, SalePayload } from '@/hooks/useSales'
import { useProducts } from '@/hooks/useProducts'
import { useCustomers } from '@/hooks/useCustomers'
import { useTrips } from '@/hooks/useTrips'
import { useSettings } from '@/hooks/useSettings'
import { CurrencyInput } from '@/components/ui/currency-input'

interface CartItem {
  product_id: string
  name: string
  unit: string
  quantity: number
  currency: 'IDR' | 'KHR' | 'USD'
  foreign_sell_price: number
  sell_price: number // IDR
}

interface SaleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleForm({ open, onOpenChange }: SaleFormProps) {
  const { createSale } = useSales()
  const { products } = useProducts()
  const { customers } = useCustomers()
  const { trips } = useTrips()

  const [customerId, setCustomerId] = useState('')
  const [tripId, setTripId] = useState('none')
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'lunas' | 'piutang'>('lunas')
  const [dueDate, setDueDate] = useState('')
  
  const [cart, setCart] = useState<CartItem[]>([])
  
  // States for adding new item
  const [selectedProductId, setSelectedProductId] = useState('')
  const [itemQty, setItemQty] = useState<number | ''>('')
  const [itemCurrency, setItemCurrency] = useState<'IDR' | 'KHR' | 'USD'>('KHR')
  const [itemPrice, setItemPrice] = useState<number | ''>('')

  const { settings } = useSettings()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter active entities only
  const activeProducts = products?.filter(p => p.is_active) || []
  const activeCustomers = customers?.filter(c => c.is_active) || []
  const activeTrips = trips?.filter(t => t.status === 'running') || []

  const handleAddToCart = () => {
    if (!selectedProductId || !itemQty || !itemPrice) return
    const product = products?.find(p => p.id === selectedProductId)
    if (!product) return

    let calculatedIdr = Number(itemPrice)
    if (itemCurrency === 'KHR') {
      calculatedIdr = (Number(itemPrice) / settings.khr_to_usd_rate) * settings.usd_to_idr_rate
    } else if (itemCurrency === 'USD') {
      calculatedIdr = Number(itemPrice) * settings.usd_to_idr_rate
    }

    setCart([...cart, {
      product_id: product.id,
      name: product.name,
      unit: product.unit,
      quantity: Number(itemQty),
      currency: itemCurrency,
      foreign_sell_price: Number(itemPrice),
      sell_price: calculatedIdr
    }])

    // Reset inputs
    setSelectedProductId('')
    setItemQty('')
    setItemPrice('')
  }

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const totalIDR = cart.filter(c => c.currency === 'IDR').reduce((sum, item) => sum + (item.quantity * item.foreign_sell_price), 0)
  const totalKHR = cart.filter(c => c.currency === 'KHR').reduce((sum, item) => sum + (item.quantity * item.foreign_sell_price), 0)
  const totalUSD = cart.filter(c => c.currency === 'USD').reduce((sum, item) => sum + (item.quantity * item.foreign_sell_price), 0)
  const grandTotalIDR = cart.reduce((sum, item) => sum + (item.quantity * item.sell_price), 0)
  const resetForm = () => {
    setCustomerId('')
    setTripId('none')
    setSaleDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setPaymentStatus('lunas')
    setDueDate('')
    setCart([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId) {
      alert('Pilih pelanggan terlebih dahulu')
      return
    }

    if (cart.length === 0) {
      alert('Keranjang kosong! Tambahkan minimal satu barang.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload: SalePayload = {
        customer_id: customerId,
        trip_id: tripId !== 'none' ? tripId : null,
        sale_date: saleDate,
        notes,
        payment_status: paymentStatus,
        due_date: paymentStatus === 'piutang' && dueDate ? dueDate : null,
        items: cart.map(c => ({
          product_id: c.product_id,
          quantity: c.quantity,
          currency: c.currency,
          foreign_sell_price: c.foreign_sell_price,
          sell_price: c.sell_price
        }))
      }
      
      await createSale(payload)
      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      alert('Gagal menyimpan penjualan: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Catat Penjualan"
      description="Catat transaksi penjualan ke pelanggan."
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-4 h-[75vh] md:h-auto overflow-y-auto pr-2 pb-16">
        
        {/* Header Info */}
        <div className="space-y-4 bg-zinc-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <Select value={customerId} onValueChange={(val) => setCustomerId(val || '')} required>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih pelanggan..." />
                </SelectTrigger>
                <SelectContent>
                  {activeCustomers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trip (Opsional)</Label>
              <Select value={tripId} onValueChange={(val) => setTripId(val || '')}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Pilih trip..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Trip</SelectItem>
                  {activeTrips.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status Pembayaran</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus((v as 'lunas' | 'piutang') || 'lunas')}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunas">Lunas</SelectItem>
                  <SelectItem value="piutang">Piutang (Belum Lunas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentStatus === 'piutang' && (
              <div className="space-y-2">
                <Label>Jatuh Tempo</Label>
                <Input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="bg-white"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2 md:col-span-2">
              <Label>Tanggal Transaksi</Label>
              <Input 
                type="date" 
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                className="bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Keranjang Belanja */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Barang yang Dijual</h3>
          
          {/* List Item di Keranjang */}
          {cart.length > 0 ? (
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 border rounded-md bg-white shadow-sm">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} x {item.currency === 'IDR' ? 'Rp' : ''} {item.foreign_sell_price.toLocaleString('en-US')} {item.currency !== 'IDR' ? item.currency : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm text-green-600">
                      Rp {(item.quantity * item.sell_price).toLocaleString('id-ID')}
                    </p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 h-8 w-8"
                      onClick={() => handleRemoveFromCart(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 bg-zinc-900 text-white rounded-md mt-2 gap-4">
                <span className="font-semibold">Total Penjualan</span>
                <div className="flex flex-col items-end gap-1">
                  {totalIDR > 0 && <span className="font-bold">Rp {totalIDR.toLocaleString('id-ID')}</span>}
                  {totalKHR > 0 && <span className="font-bold">{totalKHR.toLocaleString('en-US')} KHR</span>}
                  {totalUSD > 0 && <span className="font-bold">$ {totalUSD.toLocaleString('en-US')}</span>}
                  
                  {/* Jika ada KHR atau USD, tampilkan estimasi total IDR-nya di bawah */}
                  {(totalKHR > 0 || totalUSD > 0) && (
                    <span className="text-xs opacity-70 mt-1">
                      (Estimasi Total: Rp {grandTotalIDR.toLocaleString('id-ID')})
                    </span>
                  )}
                  {/* Jika keranjang kosong, defaultnya 0 */}
                  {cart.length === 0 && <span className="font-bold">Rp 0</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">Keranjang masih kosong</p>
          )}

          {/* Form Tambah Item */}
          <div className="bg-muted/40 p-4 border border-amber-500/30 rounded-xl space-y-3 shadow-inner">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Tambah Barang ke Keranjang</h4>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Pilih Produk Rokok</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={(val) => {
                  setSelectedProductId(val || '');
                  const p = products?.find(p => p.id === val);
                  if (p) {
                    setItemPrice(p.default_sell_price || '');
                  }
                }}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Pilih Produk" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.current_stock} {p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Kuantitas</Label>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="0" 
                  className="h-10 rounded-xl font-bold tabular-nums"
                  value={itemQty} 
                  onChange={e => setItemQty(Number(e.target.value) || '')} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Mata Uang</Label>
                <Select value={itemCurrency} onValueChange={(val) => setItemCurrency(val as 'IDR' | 'KHR' | 'USD')}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KHR">Riel (KHR)</SelectItem>
                    <SelectItem value="USD">Dollar (USD)</SelectItem>
                    <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Harga Jual</Label>
                <CurrencyInput 
                  min="0" 
                  placeholder="0" 
                  value={itemPrice} 
                  onChangeValue={(val) => setItemPrice(val)} 
                  className="h-10 rounded-xl font-bold tabular-nums text-emerald-500"
                />
              </div>
            </div>
            {itemCurrency !== 'IDR' && itemPrice !== '' && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/25 space-y-1">
                <span className="font-semibold">Estimasi Konversi Rupiah:</span>
                <p className="text-sm font-bold tabular-nums">
                  Rp {
                    (itemCurrency === 'KHR' 
                      ? (Number(itemPrice) / settings.khr_to_usd_rate) * settings.usd_to_idr_rate 
                      : Number(itemPrice) * settings.usd_to_idr_rate).toLocaleString('id-ID', { maximumFractionDigits: 0 })
                  }
                </p>
              </div>
            )}
            <Button 
              type="button" 
              className="w-full h-10 rounded-xl font-semibold shadow-md shadow-amber-500/15"
              onClick={handleAddToCart}
            >
              <Plus className="h-4 w-4 mr-2" /> Masukkan Keranjang
            </Button>
          </div>

        </div>

        <div className="space-y-2 pt-2">
          <Label htmlFor="notes">Catatan Transaksi</Label>
          <Textarea 
            id="notes" 
            placeholder="Keterangan opsional..." 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>

        <div className="pt-4 mt-8 pb-4 flex gap-2">
          <Button type="button" variant="outline" className="w-1/3 h-12" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" className="w-2/3 h-12 text-lg font-bold" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
