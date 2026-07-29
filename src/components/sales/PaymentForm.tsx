import { useState } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { UserCheck, Calendar, FileText, Wallet } from 'lucide-react'

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

  const [amount, setAmount] = useState<number | ''>('')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [markLunas, setMarkLunas] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!saleId) return
    
    if (!markLunas && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      alert('Nominal harus lebih dari 0')
      return
    }

    createPayment.mutate({
      sale_id: saleId,
      amount: markLunas ? 0 : Number(amount),
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
      title="Catat Pembayaran Piutang"
      description={`Penerimaan cicilan atau pelunasan tagihan dari ${customerName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 dark:border-white/5 space-y-1 text-xs">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <UserCheck className="h-4 w-4 text-amber-500" />
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/30">
            <span>Total Tagihan Penjualan:</span>
            <span className="font-bold text-foreground tabular-nums text-sm">
              KHR {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {!markLunas && (
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs font-semibold">Nominal Pembayaran (KHR)</Label>
            <CurrencyInput 
              id="amount" 
              value={amount}
              onChangeValue={(val) => setAmount(val ?? '')}
              placeholder="Misal: 500000"
              required={!markLunas}
              min="1"
              className="h-10 rounded-xl font-bold tabular-nums text-emerald-500"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="paidAt" className="text-xs font-semibold">Tanggal Penerimaan Pembayaran</Label>
          <Input 
            id="paidAt" 
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            required
            className="h-10 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-semibold">Catatan Transaksi (Opsional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Transfer BCA, Titip Sopir, Cash Tunai..."
            rows={2}
            className="rounded-xl"
          />
        </div>

        <div className="flex items-center space-x-2 pt-2 p-3 rounded-xl bg-card border border-border/40">
          <Checkbox 
            id="markLunas" 
            checked={markLunas} 
            onCheckedChange={(c) => setMarkLunas(c as boolean)} 
          />
          <Label htmlFor="markLunas" className="text-xs font-semibold cursor-pointer text-foreground">
            Tandai tagihan transaksi ini sebagai LUNAS
          </Label>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={createPayment.isPending}
            className="rounded-xl"
          >
            Batal
          </Button>
          <Button type="submit" disabled={createPayment.isPending} className="rounded-xl font-semibold shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white">
            {createPayment.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </Button>
        </div>
      </form>
    </ResponsiveFormSheet>
  )
}
