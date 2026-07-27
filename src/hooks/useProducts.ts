import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export type ProductUnit = 'pak' | 'slop' | 'karton'

export function useProducts(options?: { includeInactive?: boolean }) {
  const { includeInactive = false } = options || {}
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: ['products', workspace?.workspaceId, includeInactive],
    queryFn: async () => {
      // NOTE: READ from products_view as instructed (handles hiding default_buy_price for staff)
      let query = supabase
        .from('products_view')
        .select('*')
        .order('name', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (newProduct: { 
      name: string; 
      brand?: string; 
      variant?: string; 
      unit: ProductUnit; 
      default_buy_price: number; 
      default_sell_price: number; 
      default_sell_currency?: string;
      notes?: string 
    }) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      // NOTE: INSERT to products (base table)
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          ...newProduct, 
          workspace_id: workspace.workspaceId,
          is_active: true
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string; 
      brand?: string; 
      variant?: string; 
      unit?: ProductUnit; 
      default_buy_price?: number; 
      default_sell_price?: number; 
      default_sell_currency?: string;
      is_active?: boolean;
      notes?: string 
    }) => {
      // NOTE: UPDATE to products (base table)
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })

  return {
    products: productsQuery.data,
    isLoading: productsQuery.isPending,
    isError: productsQuery.isError,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
  }
}
