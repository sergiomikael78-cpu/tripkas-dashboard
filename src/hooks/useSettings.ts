import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export interface WorkspaceSettings {
  workspace_id: string
  khr_to_usd_rate: number
  usd_to_idr_rate: number
  updated_at: string
}

export function useSettings() {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['settings', workspace?.workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', workspace?.workspaceId)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      return data as WorkspaceSettings | null
    },
    enabled: !!workspace?.workspaceId,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<WorkspaceSettings>) => {
      if (!workspace?.workspaceId) throw new Error('Missing workspace')
      
      const { data, error } = await supabase
        .from('workspace_settings')
        .upsert({
          workspace_id: workspace.workspaceId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })

  return {
    settings: settingsQuery.data || { khr_to_usd_rate: 4000, usd_to_idr_rate: 16000 },
    isLoading: settingsQuery.isPending,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending
  }
}
