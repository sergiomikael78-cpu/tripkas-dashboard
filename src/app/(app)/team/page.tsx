'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveFormSheet } from '@/components/ui/responsive-form-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Shield, Copy, Check, Sparkles, UserCheck, Clock, Users } from 'lucide-react'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'

export default function TeamPage() {
  const { data: workspace } = useWorkspace()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const role = workspace?.role
  const isOwner = role === 'owner'

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('partner')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch workspace members
  const { data: members, isLoading } = useQuery({
    queryKey: ['team-members', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          id,
          role,
          joined_at,
          user:users(id, full_name, email)
        `)
        .eq('workspace_id', workspace.workspaceId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId
  })

  // Fetch pending invitations
  const { data: invitations, isLoading: isInvitesLoading } = useQuery({
    queryKey: ['invitations', workspace?.workspaceId],
    queryFn: async () => {
      if (!workspace?.workspaceId) return []
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('workspace_id', workspace.workspaceId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!workspace?.workspaceId && isOwner
  })

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string, role: string }) => {
      const { data, error } = await supabase.rpc('create_invitation', {
        p_email: email,
        p_role: role
      })
      if (error) throw error
      return data // Returns the token
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
      const link = `${window.location.origin}/invite?token=${token}`
      setGeneratedLink(link)
    },
    onError: (error: any) => {
      alert('Gagal membuat undangan: ' + error.message)
    }
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workspace_members').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    }
  })

  const cancelInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invitations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    }
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setGeneratedLink(null)
    setCopied(false)
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const roleBadgeVariant = (r: string) => {
    switch (r) {
      case 'owner': return 'default' as const
      case 'admin': return 'default' as const
      case 'partner': return 'secondary' as const
      case 'staff': return 'outline' as const
      default: return 'outline' as const
    }
  }

  const roleLabel = (r: string) => {
    switch (r) {
      case 'owner': return 'Owner'
      case 'admin': return 'Admin'
      case 'partner': return 'Partner'
      case 'staff': return 'Staff'
      default: return r
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Tim & Hak Akses Workspace
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Kelola anggota tim, undang rekan kerja, dan atur batasan otoritas pengguna.
          </p>
        </div>

        {isOwner && (
          <Button 
            onClick={() => {
              setInviteEmail('')
              setGeneratedLink(null)
              setIsInviteOpen(true)
            }}
            className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20"
          >
            <UserPlus className="h-4 w-4" />
            <span>Undang User</span>
          </Button>
        )}
      </div>

      {/* Permission Matrix Info Card */}
      <Card className="border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card dark:border-amber-500/20 shadow-md">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-foreground text-sm">Matriks Hak Akses Tim</p>
              <div className="grid gap-1.5 md:grid-cols-2 text-muted-foreground">
                <p><strong className="text-foreground">Owner:</strong> Akses penuh ke semua fitur, data margin profit, dan pengelola tim.</p>
                <p><strong className="text-foreground">Admin:</strong> Sama dengan Owner (penuh) kecuali menambah/menghapus tim.</p>
                <p><strong className="text-foreground">Partner:</strong> Input pembelian, penjualan & pengeluaran. (Hidden margin & profit).</p>
                <p><strong className="text-foreground">Staff:</strong> Hanya input penjualan kasir dasar.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-border/50 dark:border-white/5 pb-2">
          <Users className="h-4 w-4 text-amber-500" />
          <h3 className="font-bold text-base text-foreground">Anggota Tim Aktif</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {isLoading ? (
            <>
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="border border-border/60 dark:border-white/10"><CardContent className="h-20 shimmer" /></Card>
              ))}
            </>
          ) : !members || members.length === 0 ? (
            <p className="text-xs text-muted-foreground col-span-full">Belum ada anggota tim.</p>
          ) : (
            members.map((member: any) => (
              <Card key={member.id} className="hover:border-amber-500/30 transition-all duration-300">
                <CardContent className="pt-4 pb-4 pl-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/60 border border-border/40 shrink-0">
                      <UserCheck className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{member.user?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                        Bergabung: {new Date(member.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadgeVariant(member.role)} className="text-[10px] px-2.5 py-0.5 uppercase font-semibold">
                      {roleLabel(member.role)}
                    </Badge>
                    {isOwner && member.role !== 'owner' && (
                      <LuxuryDeleteDialog 
                        title="Hapus Anggota Tim?" 
                        description="Anggota ini akan dihapus dari workspace dan tidak lagi memiliki akses."
                        onConfirm={() => removeMemberMutation.mutateAsync(member.id)} 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {isOwner && invitations && invitations.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-border/50 dark:border-white/5 pb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-base text-foreground">Undangan Menunggu Konfirmasi</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {invitations.map((invite: any) => (
              <Card key={invite.id} className="border-dashed border-border/80 dark:border-white/10 bg-card/50">
                <CardContent className="pt-4 pb-4 pl-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{invite.email}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Kadaluarsa: {new Date(invite.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {roleLabel(invite.role)}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(`${window.location.origin}/invite?token=${invite.token}`)}
                      title="Salin Link Undangan"
                      className="h-8 w-8 rounded-lg"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <LuxuryDeleteDialog 
                      title="Batalkan Undangan?" 
                      description="Link undangan ini akan hangus dan tidak bisa digunakan lagi."
                      onConfirm={() => cancelInviteMutation.mutateAsync(invite.id)} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invite Form Sheet */}
      <ResponsiveFormSheet
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Undang Anggota Tim Baru"
        description="Buat link undangan khusus untuk rekan kerja Anda."
      >
        {!generatedLink ? (
          <form onSubmit={handleInvite} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Email Calon Anggota</Label>
              <Input 
                type="email" 
                placeholder="email@contoh.com" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                required 
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Akses</Label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || 'partner')}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Silakan rujuk ke Matriks Hak Akses untuk detail izin per role.
              </p>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full h-10 rounded-xl font-bold shadow-md shadow-amber-500/20" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Membuat Undangan...' : 'Buat Link Undangan'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-6 pb-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-2xl border border-emerald-500/30 flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Undangan Berhasil Dibuat!</h3>
              <p className="text-xs text-muted-foreground">
                Salin link di bawah ini dan kirimkan ke <strong className="text-foreground">{inviteEmail}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 bg-muted/60 p-2.5 rounded-xl border border-border/50">
              <Input value={generatedLink} readOnly className="bg-transparent border-0 focus-visible:ring-0 text-xs font-mono" />
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedLink)} className="rounded-lg shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button className="w-full rounded-xl" variant="outline" onClick={() => setIsInviteOpen(false)}>
              Selesai
            </Button>
          </div>
        )}
      </ResponsiveFormSheet>
    </div>
  )
}
