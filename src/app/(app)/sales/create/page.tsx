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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { CurrencyInput } from '@/components/ui/currency-input'
import { useSales, SalePayload } from '@/hooks/useSales'
import { useProducts } from '@/hooks/useProducts'
import { useCustomers } from '@/hooks/useCustomers'
import { useTrips } from '@/hooks/useTrips'
import { useStockMovements } from '@/hooks/useStocks'
import { useSettings } from '@/hooks/useSettings'

interface CartItem {
  product_id: string
  name: string
  unit: string
  quantity: number
  currency: 'IDR' | 'KHR' | 'USD'
  foreign_sell_price: number
  sell_price: number
}

export default function CreateSalePage() {
  const router = useRouter()
  const { createSale } = useSales()
  const { products } = useProducts()
  const { customers, createCustomer } = useCustomers()
  const { trips } = useTrips()
  const { tripStocks } = useStockMovements()

  const [customerInput, setCustomerInput] = useState('')
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

  // Helper to get specific stock for a product on the selected trip/gudang
  const getProductStock = (productId: string) => {
    const product = products?.find(p => p.id === productId)
    if (!product) return 0
    
    // If we have tripStocks loaded, calculate specific stock
    if (tripStocks) {
      const selectedTripId = tripId === 'none' ? null : tripId
      const stockInfo = tripStocks.find(ts => ts.product_id === productId && ts.trip_id === selectedTripId)
      return stockInfo ? stockInfo.current_stock : 0
    }
    
    // Fallback to global stock if tripStocks is still loading
    return product.current_stock
  }

  const handleAddToCart = () => {
    if (!selectedProductId || !itemQty || !itemPrice) return
    const product = products?.find(p => p.id === selectedProductId)
    if (!product) return

    let calculatedIdr = Number(itemPrice)
    if (itemCurrency === 'KHR') {
      calculatedIdr = (Number(itemPrice) / (settings?.khr_to_usd_rate || 4000)) * (settings?.usd_to_idr_rate || 16000)
    } else if (itemCurrency === 'USD') {
      calculatedIdr = Number(itemPrice) * (settings?.usd_to_idr_rate || 16000)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerInput.trim()) {
      alert('Nama pelanggan tidak boleh kosong')
      return
    }

    if (cart.length === 0) {
      alert('Keranjang kosong! Tambahkan minimal satu barang.')
      return
    }

    try {
      setIsSubmitting(true)

      // INSTANT CUSTOMER INNOVATION:
      // Check if customer already exists by name (case-insensitive)
      let finalCustomerId = ''
      const existingCustomer = activeCustomers.find(c => c.name.toLowerCase() === customerInput.trim().toLowerCase())
      
      if (existingCustomer) {
        finalCustomerId = existingCustomer.id
      } else {
        // Auto-create customer if they don't exist
        const newCust = await createCustomer({ 
          name: customerInput.trim(), 
          type: 'warung', // default type
          notes: 'Dibuat otomatis dari pencatatan penjualan instan'
        })
        finalCustomerId = newCust.id
      }

      const payload: SalePayload = {
        customer_id: finalCustomerId,
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
      router.push('/sales')
    } catch (error: any) {
      alert('Gagal menyimpan penjualan: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/sales" />} nativeButton={false}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catat Penjualan</h1>
          <p className="text-sm text-muted-foreground mt-1">Buat transaksi penjualan instan tanpa hambatan.</p>
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
              <Label>Pelanggan (Ketik & Auto-simpan) <span className="text-red-500">*</span></Label>
              <Input 
                list="customers-list"
                placeholder="Ketik nama pelanggan..."
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                required
                className="w-full"
                autoComplete="off"
              />
              <datalist id="customers-list">
                {activeCustomers.map(c => (
                  <option key={c.id} value={c.name} />
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
                    {tripId === 'none' ? 'Tanpa Trip' : (activeTrips.find(t => t.id === tripId)?.code || tripId)}
                  </span>
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
                <SelectTrigger>
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
                <Label>Jatuh Tempo <span className="text-red-500">*</span></Label>
                <Input 
                  type="date" 
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2 md:col-span-2">
              <Label>Tanggal Transaksi <span className="text-red-500">*</span></Label>
              <Input 
                type="date" 
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Keranjang Belanja */}
        <Card>
          <CardHeader>
            <CardTitle>Barang yang Dijual</CardTitle>
            <CardDescription>Tambahkan produk ke dalam keranjang transaksi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Form Tambah Item */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-4 border">
              <div className="space-y-2">
                <Label>Produk</Label>
                <Select 
                  value={selectedProductId} 
                  onValueChange={(val) => {
                    setSelectedProductId(val || '');
                    const p = products?.find(p => p.id === val);
                    if (p) {
                      setItemPrice(p.default_sell_price || '');
                      setItemCurrency((p.default_sell_currency as any) || 'IDR');
                    }
                  }}
                >
                  <SelectTrigger>
                    <span data-slot="select-value" className={`flex flex-1 text-left line-clamp-1 ${!selectedProductId ? 'text-muted-foreground' : ''}`}>
                      {selectedProductId ? (activeProducts.find(p => p.id === selectedProductId)?.name || selectedProductId) : 'Pilih Produk'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {activeProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({getProductStock(p.id)} {p.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Kuantitas</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="0" 
                    value={itemQty} 
                    onChange={e => setItemQty(Number(e.target.value) || '')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mata Uang</Label>
                  <Select value={itemCurrency} onValueChange={(val) => setItemCurrency(val as 'IDR' | 'KHR' | 'USD')}>
                    <SelectTrigger>
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
                  <Label>Harga Jual</Label>
                  <CurrencyInput 
                    min="0" 
                    placeholder="0" 
                    value={itemPrice} 
                    onChangeValue={(val) => setItemPrice(val)} 
                  />
                </div>
              </div>
              {itemCurrency !== 'IDR' && itemPrice !== '' && (
                <div className="text-sm text-green-700 bg-green-100/50 p-2 rounded border border-green-200">
                  Estimasi IDR: <span className="font-bold">Rp {
                    (itemCurrency === 'KHR' 
                      ? (Number(itemPrice) / (settings?.khr_to_usd_rate || 4000)) * (settings?.usd_to_idr_rate || 16000) 
                      : Number(itemPrice) * (settings?.usd_to_idr_rate || 16000)).toLocaleString('id-ID', { maximumFractionDigits: 0 })
                  }</span>
                </div>
              )}
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full"
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
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-md shadow-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} x {item.currency === 'IDR' ? 'Rp' : ''} {item.foreign_sell_price.toLocaleString('en-US')} {item.currency !== 'IDR' ? item.currency : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {item.currency !== 'IDR' && (
                          <p className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                            {(item.quantity * item.foreign_sell_price).toLocaleString('en-US')} {item.currency}
                          </p>
                        )}
                        <p className={`tabular-nums ${item.currency !== 'IDR' ? 'text-xs text-muted-foreground' : 'font-semibold text-green-600 dark:text-green-500'}`}>
                          Rp {(item.quantity * item.sell_price).toLocaleString('id-ID')}
                        </p>
                      </div>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-primary text-primary-foreground rounded-md mt-4 gap-4">
                  <span className="font-semibold text-lg">Total Penjualan</span>
                  <div className="flex flex-col items-end gap-1">
                    {totalIDR > 0 && <span className="font-bold text-xl tabular-nums">Rp {totalIDR.toLocaleString('id-ID')}</span>}
                    {totalKHR > 0 && <span className="font-bold text-xl tabular-nums">{totalKHR.toLocaleString('en-US')} KHR</span>}
                    {totalUSD > 0 && <span className="font-bold text-xl tabular-nums">$ {totalUSD.toLocaleString('en-US')}</span>}
                    
                    {/* Jika ada KHR atau USD, tampilkan estimasi total IDR-nya di bawah */}
                    {(totalKHR > 0 || totalUSD > 0) && (
                      <span className="text-xs opacity-80 mt-1">
                        (Estimasi Total: Rp {grandTotalIDR.toLocaleString('id-ID')})
                      </span>
                    )}
                    {/* Jika keranjang kosong, defaultnya 0 */}
                    {cart.length === 0 && <span className="font-bold text-xl tabular-nums">Rp 0</span>}
                  </div>
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

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-1/3" render={<Link href="/sales" />} nativeButton={false}>
            Batal
          </Button>
          <Button type="submit" className="w-2/3" disabled={isSubmitting || cart.length === 0}>
            {isSubmitting ? "Menyimpan..." : "Simpan Transaksi Penjualan"}
          </Button>
        </div>
      </form>
    </div>
  )
}
