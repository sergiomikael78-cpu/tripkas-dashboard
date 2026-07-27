import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export interface SaleItemPayload {
  product_id: string
  quantity: number
  currency: 'IDR' | 'KHR' | 'USD'
  foreign_sell_price: number
}

export interface SalePayload {
  customer_id: string
  trip_id?: string | null
  sale_date: string
  notes?: string
  payment_status: 'lunas' | 'piutang'
  due_date?: string | null
  items: SaleItemPayload[]
}

export function useSales(monthFilter?: string) {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const salesQuery = useQuery({
    queryKey: ['sales', workspace?.workspaceId, monthFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name, contact),
          trip:trips(code),
          items:sale_items(
            id,
            quantity,
            sell_price,
            currency,
            foreign_sell_price,
            subtotal,
            product:products(name, unit)
          )
        `)
        
      if (monthFilter) {
        const startOfMonth = `${monthFilter}-01`
        const dateObj = new Date(`${monthFilter}-01`)
        dateObj.setMonth(dateObj.getMonth() + 1)
        dateObj.setDate(0)
        const endOfMonth = dateObj.toISOString().split('T')[0]
        
        query = query.or(`and(sale_date.gte.${startOfMonth},sale_date.lte.${endOfMonth}),payment_status.eq.piutang`)
      }

      const { data, error } = await query
        .order('sale_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Fetch sales error:", error)
        throw error
      }
      return data || []
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: SalePayload) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      
      const { data, error } = await supabase.rpc('process_sale', {
        payload
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Update stock
      queryClient.invalidateQueries({ queryKey: ['customers'] }) // Update customer balances if any
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    }
  })

  return {
    sales: salesQuery.data,
    isLoading: salesQuery.isPending,
    isError: salesQuery.isError,
    createSale: createMutation.mutateAsync,
    deleteSale: deleteMutation.mutateAsync,
  }
}
