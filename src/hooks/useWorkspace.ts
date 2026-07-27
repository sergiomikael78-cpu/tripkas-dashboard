import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export type UserRole = 'owner' | 'admin' | 'partner' | 'staff'

export interface WorkspaceContextData {
  userId: string | null
  workspaceId: string | null
  role: UserRole | null
}

export function useWorkspace() {
  const supabase = createClient()

  return useQuery<WorkspaceContextData>({
    queryKey: ['workspace-context'],
    queryFn: async () => {
      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { userId: null, workspaceId: null, role: null }
      }

      // 2. Get workspace member info
      const { data: member, error: memberError } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .single()

      if (memberError || !member) {
        return { userId: user.id, workspaceId: null, role: null }
      }

      return {
        userId: user.id,
        workspaceId: member.workspace_id,
        role: member.role as UserRole
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}
