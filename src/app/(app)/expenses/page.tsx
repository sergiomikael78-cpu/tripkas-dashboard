'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useExpenses } from '@/hooks/useExpenses'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function ExpensesPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const [monthFilter, setMonthFilter] = useState(defaultMonth)

  const { expenses, isLoading, deleteExpense } = useExpenses(monthFilter)
  const { data: workspace } = useWorkspace()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const canManageExpenses = workspace?.role === 'owner' || workspace?.role === 'admin' || workspace?.role === 'partner'

  const formatCategory = (category: string) => {
    switch (category) {
      case 'trip': return 'Biaya Trip'
      case 'operasional_harian': return 'Operasional Harian'
      case 'lainnya': return 'Lainnya'
      default: return category
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Pengeluaran</h1>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-40 bg-zinc-900 border-zinc-800 text-white"
          />
          {canManageExpenses && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Catat Pengeluaran
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading || !expenses ? (
          <p>Memuat data pengeluaran...</p>
        ) : expenses.length === 0 ? (
          <p className="text-muted-foreground">Belum ada catatan pengeluaran.</p>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{formatCategory(expense.category)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground mr-2">
                      {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                    </span>
                    {canManageExpenses && (
                      <LuxuryDeleteDialog 
                        title="Hapus Pengeluaran?" 
                        description="Catatan pengeluaran ini akan dihapus permanen. Apakah Anda yakin?"
                        onConfirm={() => deleteExpense(expense.id)} 
                      />
                    )}
                  </div>
                </CardTitle>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="text-lg font-bold text-red-500">
                    - Rp {expense.amount.toLocaleString('id-ID')}
                  </div>
                  {expense.currency && expense.currency !== 'IDR' && (
                    <div className="text-sm font-medium text-amber-600">
                      (Asli: {expense.foreign_amount?.toLocaleString('en-US')} {expense.currency})
                    </div>
                  )}
                  {expense.trip && (
                    <div className="text-sm text-muted-foreground">
                      Trip: {expense.trip.code}
                    </div>
                  )}
                </div>
              </CardHeader>
              {expense.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {expense.notes}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <ExpenseForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
      />
    </div>
  )
}
