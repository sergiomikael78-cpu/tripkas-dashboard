'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Share, 
  Star, 
  Award, 
  ShieldCheck, 
  Smartphone, 
  Check, 
  Sparkles, 
  ArrowLeft,
  ChevronRight,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if running as PWA / standalone
    const checkStandalone = () => window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true
    
    setIsStandalone(checkStandalone())
    if (checkStandalone()) setIsInstalled(true)

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback instruction if browser handled prompt automatically
      alert("Untuk menginstal di Android: Ketuk menu titik tiga (⋮) di pojok kanan atas browser, lalu pilih 'Tambahkan ke Layar Utama' (Add to Home Screen).")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 font-sans">
      
      {/* Top Bar Navigation */}
      <div className="w-full max-w-xl flex items-center justify-between py-2 mb-6">
        <Link href="/login" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-amber-500 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Login</span>
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          App Store & PWA Download
        </span>
      </div>

      {/* Main App Store Style Card Container */}
      <div className="w-full max-w-xl bg-card border border-border/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20 space-y-6 relative overflow-hidden backdrop-blur-xl">
        
        {/* Top App Header (Icon, Name, Get Button) */}
        <div className="flex items-center gap-4 sm:gap-5 pb-6 border-b border-border/60 dark:border-white/10">
          <div className="relative shrink-0">
            <img 
              src="/icon-512x512.png" 
              alt="DataRokok.SMJ Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-xl border border-amber-500/30 object-cover" 
            />
            <span className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-lg text-[10px] font-extrabold shadow-md">
              PRO
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-1">
              DataRokok.SMJ
            </h1>
            <p className="text-xs text-amber-500 font-semibold tracking-wide uppercase mt-0.5">
              Pencatatan Penjualan & Multi-Trip
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Aplikasi Kasir & Stok Pabrik Rokok
            </p>

            <div className="mt-3">
              {isInstalled ? (
                <Button className="h-9 px-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Terpasang</span>
                </Button>
              ) : (
                <Button 
                  onClick={handleInstallClick} 
                  className="h-9 px-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>GET</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Spec Bar (Rating, Awards, Age, Category, Developer, Size) */}
        <div className="grid grid-cols-4 gap-2 text-center py-3 border-b border-border/60 dark:border-white/10 text-xs">
          
          <div className="space-y-1 border-r border-border/40 dark:border-white/5 pr-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">4 RATINGS</p>
            <p className="text-sm font-extrabold text-foreground flex items-center justify-center gap-0.5">
              4.9 <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            </p>
          </div>

          <div className="space-y-1 border-r border-border/40 dark:border-white/5 pr-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">AKSES</p>
            <p className="text-sm font-extrabold text-foreground flex items-center justify-center gap-0.5">
              <Award className="h-3.5 w-3.5 text-amber-500" /> 18+
            </p>
          </div>

          <div className="space-y-1 border-r border-border/40 dark:border-white/5 pr-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">DEVELOPER</p>
            <p className="text-sm font-extrabold text-foreground truncate px-1">
              DataRokok
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">UKURAN</p>
            <p className="text-sm font-extrabold text-foreground">
              1.2 MB
            </p>
          </div>

        </div>

        {/* What's New Release Notes Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">What's New (Pembaruan Versi)</h2>
            <span className="text-[11px] text-muted-foreground">Versi 2.0</span>
          </div>
          <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-xs text-muted-foreground space-y-2 leading-relaxed">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Pembaruan UI/UX Antigravity Gold Edition:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
              <li>Fitur Kasir POS Multi-Mata Uang (Rupiah, Riel Kamboja KHR, Dollar USD).</li>
              <li>Manajemen Operasional Trip Sales & Gudang Pusat.</li>
              <li>Tampilan responsif di Android & iOS iPhone.</li>
            </ul>
          </div>
        </div>

        {/* Action Button & Instructions */}
        <div className="pt-2">
          <Button 
            onClick={handleInstallClick}
            className="w-full h-12 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 text-sm gap-2"
          >
            <Smartphone className="h-4 w-4" />
            <span>Pasang Aplikasi Sekarang</span>
          </Button>
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Terverifikasi Bebas Virus · PWA Resmi DataRokok.SMJ</span>
        </div>

      </div>

      {/* iOS Step-by-Step Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
              <Share className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-foreground">Panduan Pasang di iPhone / iPad</h3>
              <p className="text-xs text-muted-foreground">
                Ikuti 2 langkah mudah di Safari untuk memasang ikon aplikasi di Layar Utama HP Anda:
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-2xl border border-border/60 text-left space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">1</span>
                <p>Ketuk tombol **Share** (<Share className="inline h-3.5 w-3.5 text-amber-500" />) di bagian bawah atau atas layar Safari.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">2</span>
                <p>Gulir ke bawah lalu pilih **Add to Home Screen** (*Tambah ke Layar Utama*).</p>
              </div>
            </div>

            <Button onClick={() => setShowIOSModal(false)} className="w-full rounded-xl font-bold">
              Saya Mengerti
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
