import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export interface PurchaseItemPayload {
  product_id: string
  quantity: number
  buy_price: number
}

export interface PurchasePayload {
  trip_id: string | null
  supplier_id: string
  purchase_date: string
  notes?: string
  items: PurchaseItemPayload[]
}

export function usePurchases(monthFilter?: string) {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const purchasesQuery = useQuery({
    queryKey: ['purchases', workspace?.workspaceId, monthFilter],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(name),
          trip:trips(code),
          items:purchase_items(
            id,
            quantity,
            buy_price,
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
        
        query = query.gte('purchase_date', startOfMonth).lte('purchase_date', endOfMonth)
      }

      const { data, error } = await query
        .order('purchase_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (payload: PurchasePayload) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      
      const { data, error } = await supabase.rpc('process_purchase', {
        payload
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Update product prices & stock
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('purchases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    }
  })

  return {
    purchases: purchasesQuery.data,
    isLoading: purchasesQuery.isPending,
    isError: purchasesQuery.isError,
    createPurchase: createMutation.mutateAsync,
    deletePurchase: deleteMutation.mutateAsync,
  }
}
