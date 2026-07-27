import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function usePayments() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const createPayment = useMutation({
    mutationFn: async ({
      sale_id,
      amount,
      paid_at,
      notes,
      mark_lunas
    }: {
      sale_id: string
      amount: number
      paid_at: string
      notes?: string
      mark_lunas: boolean
    }) => {
      const { data, error } = await supabase.rpc('process_payment', {
        p_sale_id: sale_id,
        p_amount: amount,
        p_paid_at: paid_at,
        p_notes: notes || null,
        p_mark_lunas: mark_lunas
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      alert('Pembayaran berhasil dicatat')
    },
    onError: (error: any) => {
      alert('Gagal mencatat pembayaran: ' + error.message)
    }
  })

  return {
    createPayment
  }
}
