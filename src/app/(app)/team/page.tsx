'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { UserPlus, Shield, Copy, Check } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tim & Akses</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola anggota dan hak akses workspace Anda.</p>
        </div>
        {isOwner && (
          <Button onClick={() => {
            setInviteEmail('')
            setGeneratedLink(null)
            setIsInviteOpen(true)
          }}>
            <UserPlus className="mr-2 h-4 w-4" /> Undang User
          </Button>
        )}
      </div>

      {/* Permission Matrix Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Matriks Hak Akses</p>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><strong>Owner:</strong> Akses penuh ke semua fitur, data, laporan, dan kelola tim.</p>
                <p><strong>Admin:</strong> Sama dengan Owner kecuali kelola tim.</p>
                <p><strong>Partner:</strong> Input pembelian, penjualan, pengeluaran. Tidak bisa lihat margin/modal.</p>
                <p><strong>Staff:</strong> Hanya input penjualan dasar.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Anggota Tim Aktif</h3>
        <div className="space-y-3">
          {isLoading ? (
            <p>Memuat anggota tim...</p>
          ) : !members || members.length === 0 ? (
            <p className="text-muted-foreground">Belum ada anggota tim.</p>
          ) : (
            members.map((member: any) => (
              <Card key={member.id}>
                <CardContent className="pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{member.user?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{member.user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bergabung: {new Date(member.joined_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
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
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-lg border-b pb-2">Undangan Menunggu</h3>
          <div className="space-y-3">
            {invitations.map((invite: any) => (
              <Card key={invite.id}>
                <CardContent className="pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Berakhir: {new Date(invite.expires_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{roleLabel(invite.role)}</Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(`${window.location.origin}/invite?token=${invite.token}`)}
                      title="Salin Link Undangan"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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

      {/* Invite Form */}
      <ResponsiveFormSheet
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        title="Undang Anggota Tim"
        description="Buat link undangan untuk anggota baru."
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
              />
            </div>
            <div className="space-y-2">
              <Label>Role Akses</Label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || 'partner')}>
                <SelectTrigger>
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
              <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? 'Membuat Undangan...' : 'Buat Link Undangan'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-6 pb-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Undangan Berhasil Dibuat!</h3>
              <p className="text-sm text-muted-foreground">
                Salin link di bawah ini dan kirimkan ke <strong>{inviteEmail}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 bg-muted p-2 rounded-md border">
              <Input value={generatedLink} readOnly className="bg-transparent border-0 focus-visible:ring-0" />
              <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Button className="w-full mt-4" variant="outline" onClick={() => setIsInviteOpen(false)}>
              Selesai
            </Button>
          </div>
        )}
      </ResponsiveFormSheet>
    </div>
  )
}
