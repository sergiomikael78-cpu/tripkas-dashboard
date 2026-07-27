'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      
      if (!session && pathname !== '/login') {
        router.push('/login')
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
      if (!session && pathname !== '/login') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, supabase])

  // Jangan render anak-anaknya jika status belum diketahui, 
  // agar tidak ada flash konten sebelum diredirect.
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Jika sedang di halaman login, biarkan render
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Jika sudah terautentikasi dan bukan di login, render anak-anaknya
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Fallback (seharusnya tidak tercapai karena useEffect akan redirect)
  return null
}
