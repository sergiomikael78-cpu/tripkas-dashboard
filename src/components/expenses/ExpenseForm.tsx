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
      title="Catat Pengeluaran"
      description="Tambahkan catatan pengeluaran operasional atau trip baru."
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="category">Kategori Pengeluaran</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operasional_harian">Operasional Harian</SelectItem>
              <SelectItem value="trip">Biaya Trip (Jalan/Bensin/dll)</SelectItem>
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {category === 'trip' && (
          <div className="space-y-2">
            <Label htmlFor="trip">Pilih Trip Aktif</Label>
            <Select value={tripId} onValueChange={(val) => setTripId(val as string)}>
              <SelectTrigger>
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
          <Label htmlFor="currency">Mata Uang</Label>
          <Select value={currency} onValueChange={(val) => setCurrency(val || 'IDR')}>
            <SelectTrigger>
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
          <Label htmlFor="amount">Nominal ({currency})</Label>
          <CurrencyInput 
            id="amount" 
            value={amount}
            onChangeValue={(val) => setAmount(val ?? '')}
            placeholder="Misal: 150000"
            required
            min="1"
          />
        </div>

        {currency !== 'IDR' && amount && (
          <div className="p-3 bg-green-50/50 border border-green-200 rounded-md text-sm text-green-800 space-y-1">
            <p className="font-semibold text-green-900">Estimasi Rupiah:</p>
            <p>
              Rp {Math.round(idrAmount).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] opacity-70">
              *Diambil dari kurs aktif (USD: Rp{usdRate.toLocaleString()}, KHR: {khrRate})
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="expenseDate">Tanggal</Label>
          <Input 
            id="expenseDate" 
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Beli bensin, bayar listrik, dll..."
            rows={3}
          />
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createExpense.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
