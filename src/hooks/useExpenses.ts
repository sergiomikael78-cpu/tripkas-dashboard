import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export type ExpenseCategory = 'trip' | 'operasional_harian' | 'lainnya'

export interface ExpensePayload {
  category: ExpenseCategory
  amount: number
  currency?: string
  foreign_amount?: number
  khr_to_usd_rate_snapshot?: number
  usd_to_idr_rate_snapshot?: number
  expense_date: string
  notes?: string
  trip_id?: string | null
}

export type Expense = {
  id: string
  workspace_id: string
  trip_id?: string | null
  category: ExpenseCategory
  amount: number
  currency: string
  foreign_amount?: number
  khr_to_usd_rate_snapshot?: number
  usd_to_idr_rate_snapshot?: number
  expense_date: string
  notes?: string
  created_by: string
  created_at: string
  trip?: {
    id: string
    code: string
  }
}

export function useExpenses(monthFilter?: string) {
  const queryClient = useQueryClient()
  const { data: workspace } = useWorkspace()
  const supabase = createClient()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', workspace?.workspaceId, monthFilter],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          trip:trips(id, code)
        `)
        .eq('workspace_id', workspace.workspaceId)

      if (monthFilter) {
        const startOfMonth = `${monthFilter}-01`
        const dateObj = new Date(`${monthFilter}-01`)
        dateObj.setMonth(dateObj.getMonth() + 1)
        dateObj.setDate(0)
        const endOfMonth = dateObj.toISOString().split('T')[0]
        
        query = query.gte('expense_date', startOfMonth).lte('expense_date', endOfMonth)
      }

      const { data, error } = await query
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Expense[]
    },
    enabled: !!workspace?.workspaceId
  })

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'workspace_id' | 'created_by' | 'created_at' | 'trip'>) => {
      if (!workspace?.workspaceId) throw new Error('No workspace selected')

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          workspace_id: workspace.workspaceId,
          created_by: user.id,
          ...expense
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      alert('Pengeluaran berhasil dicatat')
    },
    onError: (error: any) => {
      alert('Gagal mencatat pengeluaran: ' + error.message)
    }
  })

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      alert('Pengeluaran berhasil dihapus')
    },
    onError: (error: any) => {
      alert('Gagal menghapus pengeluaran: ' + error.message)
    }
  })

  return {
    expenses,
    isLoading,
    createExpense,
    deleteExpense: deleteExpense.mutateAsync
  }
}
