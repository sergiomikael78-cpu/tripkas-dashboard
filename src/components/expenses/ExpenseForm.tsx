import { useState } from 'react'
import { useExpenses, ExpenseCategory } from '@/hooks/useExpenses'
import { useTrips } from '@/hooks/useTrips'
import { useSettings } from '@/hooks/useSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Coins, Calculator } from 'lucide-react'

export function ExpenseForm({ 
  open, 
  onOpenChange 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const { createExpense } = useExpenses()
  const { trips } = useTrips()
  const { settings } = useSettings()

  const [category, setCategory] = useState<ExpenseCategory>('operasional_harian')
  const [currency, setCurrency] = useState('IDR')
  const [amount, setAmount] = useState<number | ''>('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [tripId, setTripId] = useState('')
  const [notes, setNotes] = useState('')

  // Filter trips that are active
  const activeTrips = trips?.filter(t => t.status === 'running') || []

  // Live Conversion Logic
  const numericAmount = Number(amount) || 0
  let idrAmount = numericAmount
  const khrRate = settings?.khr_to_usd_rate || 4000
  const usdRate = settings?.usd_to_idr_rate || 16000

  if (currency === 'KHR') {
    idrAmount = (numericAmount / khrRate) * usdRate
  } else if (currency === 'USD') {
    idrAmount = numericAmount * usdRate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Nominal harus lebih dari 0')
      return
    }

    if (category === 'trip' && !tripId) {
      alert('Pilih Trip terlebih dahulu')
      return
    }

    createExpense.mutate({
      category,
      amount: Math.round(idrAmount),
      currency,
      foreign_amount: currency !== 'IDR' ? numericAmount : undefined,
      khr_to_usd_rate_snapshot: currency !== 'IDR' ? khrRate : undefined,
      usd_to_idr_rate_snapshot: currency !== 'IDR' ? usdRate : undefined,
      expense_date: expenseDate,
      trip_id: category === 'trip' ? tripId : null,
      notes: notes || undefined
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setAmount('')
        setTripId('')
        setNotes('')
        setCategory('operasional_harian')
        setCurrency('IDR')
      }
    })
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Catat Pengeluaran Baru"
      description="Tambahkan catatan biaya operasional harian atau beban trip."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-xs font-semibold">Kategori Biaya</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operasional_harian">Operasional Harian</SelectItem>
              <SelectItem value="trip">Biaya Trip (Jalan/Bensin/Makan)</SelectItem>
              <SelectItem value="lainnya">Pengeluaran Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {category === 'trip' && (
          <div className="space-y-2">
            <Label htmlFor="trip" className="text-xs font-semibold">Pilih Trip Aktif</Label>
            <Select value={tripId} onValueChange={(val) => setTripId(val as string)}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Pilih Trip" />
              </SelectTrigger>
              <SelectContent>
                {activeTrips.length === 0 ? (
                  <SelectItem value="disabled" disabled>Tidak ada trip aktif</SelectItem>
                ) : (
                  activeTrips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.code} - {trip.driver_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="currency" className="text-xs font-semibold">Mata Uang Pengeluaran</Label>
          <Select value={currency} onValueChange={(val) => setCurrency(val || 'IDR')}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Pilih Mata Uang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
              <SelectItem value="KHR">Riel Kamboja (KHR)</SelectItem>
              <SelectItem value="USD">Dollar (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-xs font-semibold">Nominal Biaya ({currency})</Label>
          <CurrencyInput 
            id="amount" 
            value={amount}
            onChangeValue={(val) => setAmount(val ?? '')}
            placeholder="Misal: 150000"
            required
            min="1"
            className="h-10 rounded-xl font-bold tabular-nums text-rose-500"
          />
        </div>

        {currency !== 'IDR' && Boolean(amount) && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Calculator className="h-4 w-4" />
              <span>Estimasi Konversi Rupiah:</span>
            </div>
            <p className="text-base font-bold tabular-nums">
              Rp {Math.round(idrAmount).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] opacity-75">
              *Diambil dari kurs aktif ($1: Rp{usdRate.toLocaleString()}, KHR: {khrRate})
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="expenseDate" className="text-xs font-semibold">Tanggal Transaksi</Label>
          <Input 
            id="expenseDate" 
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Catatan / Keterangan (Opsional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Beli bensin, bayar makan driver, tol, dll..."
            rows={3}
            className="rounded-xl"
          />
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createExpense.isPending}
            className="rounded-xl"
          >
            Batal
          </Button>
          <Button type="submit" disabled={createExpense.isPending} className="rounded-xl font-semibold shadow-md shadow-amber-500/20">
            {createExpense.isPending ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
