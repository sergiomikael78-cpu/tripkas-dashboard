'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Sparkles, Activity, Calendar, ShieldAlert } from 'lucide-react'
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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Log System</h1>
          <p className="text-xs text-muted-foreground">Otorisasi dibatasi untuk Owner dan Admin.</p>
        </div>
        <Card className="border-dashed border-rose-500/30 bg-rose-500/5 py-8 text-center">
          <CardContent className="space-y-2">
            <ShieldAlert className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-500">Akses Ditolak</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Anda tidak memiliki izin (peran Partner/Staff) untuk melihat catatan audit log aktivitas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
            Audit Log & Rekam Aktivitas
          </h1>
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Riwayat kronologis semua tindakan dan perubahan data sensitif di workspace Anda (12 hari terakhir).
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border border-border/60 dark:border-white/10">
              <CardContent className="pt-4 pb-4 space-y-2">
                <div className="h-4 w-32 rounded bg-muted shimmer" />
                <div className="h-3.5 w-48 rounded bg-muted shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !logs || logs.length === 0 ? (
        <Card className="border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">Belum Ada Aktivitas</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Belum terdapat catatan audit log yang tercatat dalam 12 hari terakhir.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log: any) => (
            <Card key={log.id} className="hover:border-amber-500/30 transition-all duration-300">
              <CardContent className="pt-4 pb-4 pl-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionBadgeVariant(log.action)} className="text-[10px] px-2 py-0.2 uppercase font-semibold">
                        {actionLabel(log.action)}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                        {log.entity_type}
                      </span>
                    </div>

                    <p className="text-xs text-foreground">
                      <strong className="font-bold">{log.user?.full_name || 'User Sistem'}</strong>
                      <span className="text-muted-foreground"> ({log.user?.email || 'System'})</span>
                    </p>

                    {log.metadata && (
                      <div className="text-[11px] text-muted-foreground mt-1 bg-muted/40 p-2.5 rounded-xl border border-border/30 dark:border-white/5 font-mono break-all leading-relaxed">
                        {typeof log.metadata === 'string' 
                          ? log.metadata 
                          : JSON.stringify(log.metadata, null, 0).slice(0, 200)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-[11px] text-muted-foreground/80 text-right tabular-nums">
                      {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}<br />
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    <LuxuryDeleteDialog 
                      title="Hapus Log Aktivitas?" 
                      description="Log ini akan dihapus secara permanen dari sistem audit."
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
