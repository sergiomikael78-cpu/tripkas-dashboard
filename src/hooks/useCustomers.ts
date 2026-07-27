import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export type CustomerType = 'teman' | 'warung'

export function useCustomers(options?: { includeInactive?: boolean }) {
  const { includeInactive = false } = options || {}
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const customersQuery = useQuery({
    queryKey: ['customers', workspace?.workspaceId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
        
      const { data, error } = await query

      if (error) {
        console.error("Fetch customers error:", error)
        throw error
      }
      return data || []
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (newCustomer: { name: string; type: CustomerType; contact?: string; notes?: string }) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          ...newCustomer, 
          workspace_id: workspace.workspaceId
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; type?: CustomerType; contact?: string; notes?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    }
  })

  return {
    customers: customersQuery.data,
    isLoading: customersQuery.isPending,
    isError: customersQuery.isError,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
  }
}
