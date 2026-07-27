import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useStockHistory(workspaceId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['stock-history', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          created_at,
          quantity,
          type
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by Date (YYYY-MM-DD)
      const grouped = data.reduce((acc: Record<string, { date: string, masuk: number, keluar: number }>, curr) => {
        const dateStr = new Date(curr.created_at).toLocaleDateString('en-CA') // YYYY-MM-DD
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, masuk: 0, keluar: 0 }
        }
        
        if (curr.quantity > 0) {
          acc[dateStr].masuk += curr.quantity
        } else {
          acc[dateStr].keluar += Math.abs(curr.quantity)
        }
        
        return acc
      }, {})

      return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
    },
    enabled: !!workspaceId
  })
}
