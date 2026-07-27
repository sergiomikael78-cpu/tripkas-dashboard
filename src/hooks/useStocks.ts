import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export type StockMovement = {
  id: string
  workspace_id: string
  product_id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reference_type: 'purchase' | 'sale' | 'manual'
  reference_id: string | null
  reason: string | null
  created_by: string
  created_at: string
  product?: {
    id: string
    name: string
    unit: string
  }
}

export type TripStock = {
  workspace_id: string
  trip_id: string | null
  product_id: string
  current_stock: number
  product?: {
    id: string
    name: string
    unit: string
    brand: string
    variant: string
  }
}

export function useStockMovements(productId?: string, monthFilter?: string) {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const movementsQuery = useQuery({
    queryKey: ['stock-movements', workspace?.workspaceId, productId, monthFilter],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []

      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, name, unit)
        `)
        .eq('workspace_id', workspace.workspaceId)
        
      if (monthFilter) {
        const startOfMonth = `${monthFilter}-01T00:00:00Z`
        const dateObj = new Date(`${monthFilter}-01`)
        dateObj.setMonth(dateObj.getMonth() + 1)
        const nextMonth = dateObj.toISOString()
        
        query = query.gte('created_at', startOfMonth).lt('created_at', nextMonth)
      }

      query = query.order('created_at', { ascending: false }).limit(500)

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as StockMovement[]
    },
    enabled: !!workspace?.workspaceId
  })

  const tripStocksQuery = useQuery({
    queryKey: ['trip-stocks', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []
      
      const { data, error } = await supabase
        .from('trip_stocks_view')
        .select(`
          *,
          product:products(id, name, unit, brand, variant)
        `)
        .eq('workspace_id', workspace.workspaceId)

      if (error) throw error
      return data as TripStock[]
    },
    enabled: !!workspace?.workspaceId
  })

  const adjustStock = useMutation({
    mutationFn: async ({
      product_id,
      quantity_delta,
      reason,
      trip_id
    }: {
      product_id: string
      quantity_delta: number
      reason: string
      trip_id?: string | null
    }) => {
      const { data, error } = await supabase.rpc('adjust_stock', {
        p_product_id: product_id,
        p_quantity_delta: quantity_delta,
        p_reason: reason,
        p_trip_id: trip_id || null
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['trip-stocks'] })
    }
  })

  const deleteStockMovement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stock_movements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['trip-stocks'] })
    }
  })

  return {
    movements: movementsQuery.data,
    tripStocks: tripStocksQuery.data,
    isLoading: movementsQuery.isPending || tripStocksQuery.isPending,
    isError: movementsQuery.isError || tripStocksQuery.isError,
    adjustStock,
    deleteStockMovement: deleteStockMovement.mutateAsync
  }
}

