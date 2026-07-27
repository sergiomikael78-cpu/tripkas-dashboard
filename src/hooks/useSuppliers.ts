import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export function useSuppliers(options?: { includeInactive?: boolean }) {
  const { includeInactive = false } = options || {}
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', workspace?.workspaceId, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error("Fetch suppliers error:", error)
        throw error
      }
      return data || []
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (newSupplier: { name: string; contact?: string; notes?: string }) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ 
          ...newSupplier, 
          workspace_id: workspace.workspaceId
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; contact?: string; notes?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })

  return {
    suppliers: suppliersQuery.data,
    isLoading: suppliersQuery.isPending,
    isError: suppliersQuery.isError,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
  }
}
