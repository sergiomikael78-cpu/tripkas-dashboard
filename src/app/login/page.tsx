'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, Mail, Loader2, Sparkles, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email dan Password wajib diisi untuk mendaftar.')
      return
    }
    
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0]
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      if (data.session) {
        alert('Pendaftaran berhasil! Workspace Anda telah dibuat.')
        router.push('/')
        router.refresh()
      } else {
        alert('Silakan cek email Anda untuk konfirmasi, lalu login.')
        setLoading(false)
      }
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden selection:bg-amber-500/20 selection:text-amber-400">
      {/* Animated Light Background Mesh */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '1.5s' }} />

      <Card className="relative z-10 w-full max-w-md border border-border/80 dark:border-white/10 bg-card/85 backdrop-blur-2xl shadow-2xl shadow-black/40 rounded-2xl overflow-hidden transition-all duration-300">
        {/* Glow Header Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500" />
        
        <CardHeader className="space-y-3 pt-8 pb-4 text-center">
          <div className="mx-auto relative flex items-center justify-center">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 opacity-30 blur-sm" />
            <div className="relative p-2.5 rounded-2xl bg-card border border-amber-500/30 shadow-md">
              <img src="/icon-512x512.png" alt="DataRokok.SMJ" className="w-12 h-12 object-cover rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              DataRokok.SMJ
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Sistem Pencatatan Trading Multi-Trip
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 pt-2">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in slide-in-from-top-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Pengguna
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@datarokok.smj"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Kata Sandi
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2.5">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl text-sm font-semibold shadow-lg shadow-amber-500/25 transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Memverifikasi Akses...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Masuk (Login)</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-medium transition-all duration-300"
                disabled={loading}
                onClick={handleSignUp}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span>Daftar Baru (Sign Up)</span>
                </div>
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-[11px] text-muted-foreground/60">
            &copy; 2026 DataRokok.SMJ • Enterprise Trading Platform
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
