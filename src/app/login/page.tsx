'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-zinc-800">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 -z-10" />
            <img src="/icon-512x512.png" alt="DataRokok.SMJ" className="w-24 h-24 rounded-2xl shadow-xl transform transition-transform hover:scale-105" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">DataRokok.SMJ</h1>
          <p className="text-zinc-400">Dashboard Pencatatan Penjualan</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 text-red-400 text-sm rounded-md border border-red-900/50 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nama@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="bg-zinc-950 border-zinc-800 text-white focus-visible:ring-primary h-12"
            />
          </div>
          
          <div className="pt-6 flex flex-col gap-3">
            <Button type="submit" className="w-full h-12 text-md font-semibold shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? "Memproses..." : "Masuk (Login)"}
            </Button>
            <Button type="button" variant="outline" className="w-full h-12 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white" disabled={loading} onClick={handleSignUp}>
              Daftar Baru (Sign Up)
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
