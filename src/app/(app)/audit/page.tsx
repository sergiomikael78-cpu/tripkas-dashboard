'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList } from 'lucide-react'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'

export default function AuditLogPage() {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const role = workspace?.role
  const canView = role === 'owner' || role === 'admin'

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []
      
      const twelveDaysAgo = new Date()
      twelveDaysAgo.setDate(twelveDaysAgo.getDate() - 12)
      const twelveDaysAgoStr = twelveDaysAgo.toISOString()

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .eq('workspace_id', workspace.workspaceId)
        .gte('created_at', twelveDaysAgoStr)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId && canView
  })

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activity_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    }
  })

  const actionLabel = (action: string) => {
    switch (action) {
      case 'create_sale': return 'Catat Penjualan'
      case 'create_purchase': return 'Catat Pembelian'
      case 'create_expense': return 'Catat Pengeluaran'
      case 'adjust_stock': return 'Penyesuaian Stok'
      case 'update_product': return 'Update Produk'
      case 'create_payment': return 'Catat Pembayaran'
      default: return action.replace(/_/g, ' ')
    }
  }

  const actionBadgeVariant = (action: string) => {
    if (action.startsWith('create')) return 'default' as const
    if (action.startsWith('update')) return 'secondary' as const
    if (action.startsWith('delete')) return 'destructive' as const
    if (action === 'adjust_stock') return 'outline' as const
    return 'outline' as const
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">Anda tidak memiliki akses untuk melihat audit log.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat semua perubahan data penting di workspace Anda (12 hari terakhir).
        </p>
      </div>

      {isLoading ? (
        <p>Memuat riwayat aktivitas...</p>
      ) : !logs || logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Belum ada aktivitas yang tercatat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={actionBadgeVariant(log.action)}>{actionLabel(log.action)}</Badge>
                      <span className="text-xs text-muted-foreground">{log.entity_type}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{log.user?.full_name || 'User'}</span>
                      <span className="text-muted-foreground"> · {log.user?.email}</span>
                    </p>
                    {log.metadata && (
                      <div className="text-xs text-muted-foreground mt-1 bg-muted/50 p-2 rounded font-mono break-all">
                        {typeof log.metadata === 'string' 
                          ? log.metadata 
                          : JSON.stringify(log.metadata, null, 0).slice(0, 200)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('id-ID')}<br />
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <LuxuryDeleteDialog 
                      title="Hapus Log Aktivitas?" 
                      description="Log ini akan dihapus secara permanen."
                      onConfirm={() => deleteLogMutation.mutateAsync(log.id)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
