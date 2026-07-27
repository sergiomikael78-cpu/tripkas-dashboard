import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from './useWorkspace'

export function useReports(startDate?: string, endDate?: string) {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()

  // Report: Per Trip
  const tripReport = useQuery({
    queryKey: ['report-trip', workspace?.workspaceId, startDate, endDate],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []

      const { data: trips } = await supabase
        .from('trips')
        .select('id, code, start_date, end_date, status')
        .eq('workspace_id', workspace.workspaceId)
        .order('start_date', { ascending: false })

      if (!trips) return []

      const results = []
      for (const trip of trips) {
        // Purchase total for this trip
        const { data: purchaseItems } = await supabase
          .from('purchase_items')
          .select('subtotal, purchase:purchases!inner(trip_id)')
          .eq('purchase.trip_id', trip.id)

        let totalPurchase = 0
        purchaseItems?.forEach((pi: any) => { totalPurchase += (pi.subtotal || 0) })

        // Sale items for this trip
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('subtotal, profit, sale:sales!inner(trip_id)')
          .eq('sale.trip_id', trip.id)

        let totalSales = 0
        let totalProfit = 0
        saleItems?.forEach((si: any) => {
          totalSales += (si.subtotal || 0)
          totalProfit += (si.profit || 0)
        })

        // Expenses for this trip
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount')
          .eq('trip_id', trip.id)

        let totalExpenses = 0
        expenses?.forEach((e: any) => { totalExpenses += (e.amount || 0) })

        results.push({
          ...trip,
          totalPurchase,
          totalSales,
          totalProfit,
          totalExpenses,
          netProfit: totalProfit - totalExpenses
        })
      }
      return results
    },
    enabled: !!workspace?.workspaceId
  })

  // Report: Per Supplier
  const supplierReport = useQuery({
    queryKey: ['report-supplier', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []

      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('workspace_id', workspace.workspaceId)
        .order('name')

      if (!suppliers) return []

      const results = []
      for (const supplier of suppliers) {
        const { data: purchaseItems } = await supabase
          .from('purchase_items')
          .select('subtotal, quantity, purchase:purchases!inner(supplier_id)')
          .eq('purchase.supplier_id', supplier.id)

        let totalPurchase = 0
        let totalQty = 0
        let txCount = 0
        purchaseItems?.forEach((pi: any) => {
          totalPurchase += (pi.subtotal || 0)
          totalQty += (pi.quantity || 0)
          txCount++
        })

        results.push({
          ...supplier,
          totalPurchase,
          totalQty,
          txCount
        })
      }
      return results
    },
    enabled: !!workspace?.workspaceId
  })

  // Report: Per Customer
  const customerReport = useQuery({
    queryKey: ['report-customer', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, type')
        .eq('workspace_id', workspace.workspaceId)
        .order('name')

      if (!customers) return []

      const results = []
      for (const customer of customers) {
        const { data: sales } = await supabase
          .from('sales')
          .select(`
            id,
            payment_status,
            sale_items:sale_items(subtotal, profit)
          `)
          .eq('customer_id', customer.id)

        let totalSales = 0
        let totalProfit = 0
        let piutangAmount = 0
        let piutangCount = 0

        sales?.forEach((sale: any) => {
          let saleTotal = 0
          sale.sale_items?.forEach((si: any) => {
            totalSales += (si.subtotal || 0)
            totalProfit += (si.profit || 0)
            saleTotal += (si.subtotal || 0)
          })
          if (sale.payment_status === 'piutang') {
            piutangAmount += saleTotal
            piutangCount++
          }
        })

        results.push({
          ...customer,
          totalSales,
          totalProfit,
          piutangAmount,
          piutangCount,
          txCount: sales?.length || 0
        })
      }
      return results
    },
    enabled: !!workspace?.workspaceId
  })

  // Report: Pendapatan Mata Uang Asing Hari Ini
  const dailyCurrencyReport = useQuery({
    queryKey: ['report-currency-daily', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []

      const today = new Date().toISOString().split('T')[0]

      const { data: sales } = await supabase
        .from('sales')
        .select(`
          id,
          sale_items (
            currency,
            foreign_sell_price,
            quantity
          )
        `)
        .eq('workspace_id', workspace.workspaceId)
        .eq('sale_date', today)

      if (!sales) return []

      let totalKhr = 0
      let totalUsd = 0

      sales.forEach((sale: any) => {
        sale.sale_items?.forEach((item: any) => {
          const itemTotal = (item.foreign_sell_price || 0) * (item.quantity || 0)
          if (item.currency === 'KHR') {
            totalKhr += itemTotal
          } else if (item.currency === 'USD') {
            totalUsd += itemTotal
          }
        })
      })

      return [
        { currency: 'KHR', total: totalKhr, label: 'Riel Kamboja (KHR)' },
        { currency: 'USD', total: totalUsd, label: 'Dollar (USD)' }
      ]
    },
    enabled: !!workspace?.workspaceId
  })

  return {
    tripReport,
    supplierReport,
    customerReport,
    dailyCurrencyReport
  }
}
