'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Share } from 'lucide-react'

// Define the type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(true) // Assume true to avoid flash of prompt on load

  useEffect(() => {
    // Check if the app is already running in standalone mode (installed)
    const checkStandalone = () => window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone());

    if (checkStandalone()) return; // Don't show anything if already installed

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS instruction prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    }

    // Android/Chrome: Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the customized install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) {
    return null; // Don't render anything if already installed or dismissed
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pb-20 md:pb-6 animate-in slide-in-from-bottom-5">
      <div className="bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/10 blur-xl scale-150 rounded-full pointer-events-none" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-2 text-zinc-400 hover:text-white transition-colors z-10"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex-shrink-0 relative z-10">
          <img src="/icon-512x512.png" alt="Logo" className="w-14 h-14 rounded-xl shadow-lg border border-zinc-800" />
        </div>

        <div className="flex-grow relative z-10 text-center sm:text-left">
          <h3 className="text-white font-bold text-sm sm:text-base mb-1">
            Install Aplikasi DataRokok.SMJ
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm leading-tight">
            {isIOS 
              ? "Tambahkan ke layar utama untuk tampilan fullscreen tanpa link website."
              : "Download aplikasi ini agar lebih cepat dan tampil fullscreen tanpa link website."}
          </p>
        </div>

        <div className="flex-shrink-0 relative z-10 mt-2 sm:mt-0 w-full sm:w-auto">
          {isIOS ? (
            <div className="bg-zinc-800/80 rounded-lg p-2 text-xs text-zinc-300 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1">Ketuk <Share className="w-3 h-3" /> lalu <b>Add to Home Screen</b></span>
            </div>
          ) : (
            <Button 
              onClick={handleInstallClick} 
              className="w-full sm:w-auto shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              Download App
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
