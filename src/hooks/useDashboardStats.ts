import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export interface DashboardStats {
  activeTrips: { id: string; code: string; start_date: string }[]
  totalPiutang: number
  totalPiutangCount: number
  totalStokNilai: number
  totalProdukAktif: number
  profitBulanIni: number
  totalPenjualanBulanIni: number
  totalPenjualanBulanIniKHR: number
  totalPenjualanBulanIniUSD: number
  totalPengeluaranBulanIni: number
}

export function useDashboardStats() {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) throw new Error('No workspace')

      // 1. Active Trips
      const { data: activeTrips } = await supabase
        .from('trips')
        .select('id, code, start_date')
        .eq('workspace_id', workspace.workspaceId)
        .eq('status', 'running')
        .order('start_date', { ascending: false })

      // 2. Piutang (sales with status piutang)
      const { data: piutangSales } = await supabase
        .from('sales')
        .select(`
          id,
          sale_items:sale_items(subtotal)
        `)
        .eq('workspace_id', workspace.workspaceId)
        .eq('payment_status', 'piutang')

      let totalPiutang = 0
      const totalPiutangCount = piutangSales?.length || 0
      piutangSales?.forEach((sale: any) => {
        sale.sale_items?.forEach((item: any) => {
          totalPiutang += (item.subtotal || 0)
        })
      })

      // 3. Products (stock value & count)
      const { data: allProducts } = await supabase
        .from('products')
        .select('current_stock, default_buy_price')
        .eq('workspace_id', workspace.workspaceId)
        .eq('is_active', true)

      let totalStokNilai = 0
      const totalProdukAktif = allProducts?.length || 0
      allProducts?.forEach((p: any) => {
        totalStokNilai += (p.current_stock || 0) * (p.default_buy_price || 0)
      })

      // 4. Sales this month (profit)
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: salesThisMonth } = await supabase
        .from('sale_items')
        .select('profit, subtotal, currency, foreign_sell_price, quantity, sale:sales!inner(workspace_id, sale_date)')
        .gte('sale.sale_date', firstDayOfMonth)
        .lte('sale.sale_date', lastDayOfMonth)

      let profitBulanIni = 0
      let totalPenjualanBulanIni = 0
      let totalPenjualanBulanIniKHR = 0
      let totalPenjualanBulanIniUSD = 0

      salesThisMonth?.forEach((si: any) => {
        if (si.sale?.workspace_id === workspace.workspaceId) {
          profitBulanIni += (si.profit || 0)
          totalPenjualanBulanIni += (si.subtotal || 0)
          
          if (si.currency === 'KHR') {
            totalPenjualanBulanIniKHR += (si.foreign_sell_price || 0) * (si.quantity || 0)
          } else if (si.currency === 'USD') {
            totalPenjualanBulanIniUSD += (si.foreign_sell_price || 0) * (si.quantity || 0)
          }
        }
      })

      // 5. Expenses this month
      const { data: expensesThisMonth } = await supabase
        .from('expenses')
        .select('amount')
        .eq('workspace_id', workspace.workspaceId)
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDayOfMonth)

      let totalPengeluaranBulanIni = 0
      expensesThisMonth?.forEach((e: any) => {
        totalPengeluaranBulanIni += (e.amount || 0)
      })

      return {
        activeTrips: activeTrips || [],
        totalPiutang,
        totalPiutangCount,
        totalStokNilai,
        totalProdukAktif,
        profitBulanIni,
        totalPenjualanBulanIni,
        totalPenjualanBulanIniKHR,
        totalPenjualanBulanIniUSD,
        totalPengeluaranBulanIni
      }
    },
    enabled: !!workspace?.workspaceId,
    refetchInterval: 30000 // auto refresh every 30s
  })
}
