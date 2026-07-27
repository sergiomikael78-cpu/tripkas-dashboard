import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export function useTrips() {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const tripsQuery = useQuery({
    queryKey: ['trips', workspace?.workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId,
  })

  const createMutation = useMutation({
    mutationFn: async (newTrip: { code: string; start_date: string; notes?: string }) => {
      if (!workspace?.workspaceId || !workspace?.userId) throw new Error('Missing workspace or user')
      const { data, error } = await supabase
        .from('trips')
        .insert([{ 
          ...newTrip, 
          workspace_id: workspace.workspaceId,
          created_by: workspace.userId
        }])
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('Gagal: Masih ada trip yang sedang berjalan di workspace ini. Tutup trip tersebut terlebih dahulu.')
        }
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; code?: string; start_date?: string; end_date?: string | null; status?: 'running' | 'closed'; notes?: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      alert('Trip berhasil dihapus')
    },
    onError: (error: any) => {
      alert('Gagal menghapus Trip. Pastikan Trip ini belum memiliki transaksi (Pembelian/Penjualan). Detail: ' + error.message)
    }
  })

  return {
    trips: tripsQuery.data,
    isLoading: tripsQuery.isPending,
    isError: tripsQuery.isError,
    createTrip: createMutation.mutateAsync,
    updateTrip: updateMutation.mutateAsync,
    deleteTrip: deleteMutation.mutateAsync,
  }
}
