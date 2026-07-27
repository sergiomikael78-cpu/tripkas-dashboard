'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Check, Loader2 } from 'lucide-react'

function InviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function checkInvite() {
      if (!token) {
        setError('Link undangan tidak valid (Token tidak ditemukan).')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_invitation_by_token', { p_token: token })
      
      if (error || !data) {
        setError('Link undangan tidak valid, kadaluarsa, atau sudah digunakan.')
      } else {
        setInvite(data)
      }
      setIsLoading(false)
    }

    checkInvite()
  }, [token, supabase])

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!fullName || !password) {
      setError('Nama Lengkap dan Password wajib diisi.')
      setIsSubmitting(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: invite.email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          invite_token: token
        }
      }
    })

    if (error) {
      setError(error.message)
      setIsSubmitting(false)
    } else {
      alert('Pendaftaran berhasil! Anda sekarang tergabung dalam workspace.')
      router.push('/')
      router.refresh()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memeriksa undangan...</p>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-sm border text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900">Undangan Tidak Valid</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button onClick={() => router.push('/login')} className="w-full mt-4">
          Ke Halaman Login
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border">
      <div className="mb-6 text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Terima Undangan</h1>
        <p className="text-muted-foreground text-sm">
          Anda diundang bergabung ke bisnis <strong>{invite.workspace_name}</strong> sebagai <strong className="capitalize">{invite.role}</strong>.
        </p>
      </div>
      
      <form onSubmit={handleAcceptInvite} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            type="email" 
            value={invite.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email ini tidak bisa diubah karena sudah terdaftar di undangan.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input 
            id="fullName" 
            type="text" 
            placeholder="Misal: Budi Santoso"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password Baru</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            minLength={6}
          />
        </div>
        
        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Memproses..." : "Daftar & Bergabung"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function InvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <InviteContent />
      </Suspense>
    </div>
  )
}
