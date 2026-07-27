import { useState } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Checkbox } from '@/components/ui/checkbox'

export function PaymentForm({ 
  open, 
  onOpenChange,
  saleId,
  customerName,
  totalAmount
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void 
  saleId: string | null
  customerName: string
  totalAmount: number
}) {
  const { createPayment } = usePayments()

  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [markLunas, setMarkLunas] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!saleId) return
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Nominal harus lebih dari 0')
      return
    }

    createPayment.mutate({
      sale_id: saleId,
      amount: Number(amount),
      paid_at: paidAt,
      notes: notes || undefined,
      mark_lunas: markLunas
    }, {
      onSuccess: () => {
        onOpenChange(false)
        setAmount('')
        setNotes('')
        setMarkLunas(false)
      }
    })
  }

  return (
    <ResponsiveFormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Pembayaran Piutang"
      description={`Catat pembayaran dari ${customerName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="bg-muted p-3 rounded-md text-sm">
          <p><strong>Pelanggan:</strong> {customerName}</p>
          <p><strong>Total Penjualan:</strong> Rp {totalAmount.toLocaleString('id-ID')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Nominal Pembayaran (Rp)</Label>
          <CurrencyInput 
            id="amount" 
            value={amount}
            onChangeValue={(val) => setAmount(String(val))}
            placeholder="Misal: 500000"
            required
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidAt">Tanggal Pembayaran</Label>
          <Input 
            id="paidAt" 
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transfer BCA, Titip sopir, dll..."
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="markLunas" 
            checked={markLunas} 
            onCheckedChange={(c) => setMarkLunas(c as boolean)} 
          />
          <Label htmlFor="markLunas" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Tandai transaksi ini sebagai LUNAS
          </Label>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createPayment.isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
