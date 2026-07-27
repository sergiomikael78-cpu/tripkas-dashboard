'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { Save, Sparkles, Coins, RefreshCcw, Calculator } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

export default function SettingsPage() {
  const { settings, updateSettings, isLoading, isUpdating } = useSettings()
  const [khrRate, setKhrRate] = useState<number | ''>('')
  const [usdRate, setUsdRate] = useState<number | ''>('')

  useEffect(() => {
    if (settings) {
      setKhrRate(settings.khr_to_usd_rate)
      setUsdRate(settings.usd_to_idr_rate)
    }
  }, [settings])

  const handleSave = async () => {
    try {
      await updateSettings({
        khr_to_usd_rate: Number(khrRate),
        usd_to_idr_rate: Number(usdRate)
      })
      alert('Pengaturan kurs berhasil disimpan')
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded-xl shimmer" />
        <Card className="border border-border/60 dark:border-white/10">
          <CardContent className="p-6 space-y-4">
            <div className="h-20 bg-muted rounded-xl shimmer" />
            <div className="h-20 bg-muted rounded-xl shimmer" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
            Pengaturan Kurs Mata Uang
          </h1>
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Konfigurasi acuan konversi mata uang asing (KHR & USD) ke Rupiah untuk transaksi kasir.
        </p>
      </div>

      <Card className="border border-border/70 dark:border-white/10 bg-card/80 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40 dark:border-white/5 bg-muted/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <span>Nilai Tukar Kurs Acuan</span>
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Nilai tukar ini akan digunakan secara otomatis saat Anda mencatat penjualan kasir dengan KHR atau USD.
            <br />
            <span className="font-semibold text-foreground">Rumus KHR ke IDR:</span> (Nominal KHR ÷ Kurs KHR/USD) × Kurs USD/IDR
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          {/* Rate 1: USD to KHR */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-card border border-border/60 dark:border-white/10 shadow-sm">
            <Label className="text-xs font-bold text-foreground tracking-wide flex items-center justify-between">
              <span>Kurs Dollar ke Riel (USD to KHR)</span>
              <span className="text-[10px] text-amber-500 font-normal">Standard Acuan KHR</span>
            </Label>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground shrink-0">1 USD =</span>
              <CurrencyInput 
                value={khrRate} 
                onChangeValue={(val) => setKhrRate(Number(val))} 
                className="max-w-[180px] h-10 rounded-xl bg-background border-border/80 font-bold tabular-nums text-sm"
              />
              <span className="text-xs font-bold text-foreground">KHR</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Contoh: <strong className="text-foreground font-semibold">4000</strong> (Artinya $1 = 4,000 Riel KHR)
            </p>
          </div>

          {/* Rate 2: USD to IDR */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-card border border-border/60 dark:border-white/10 shadow-sm">
            <Label className="text-xs font-bold text-foreground tracking-wide flex items-center justify-between">
              <span>Kurs Dollar ke Rupiah (USD to IDR)</span>
              <span className="text-[10px] text-amber-500 font-normal">Standard Acuan IDR</span>
            </Label>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground shrink-0">1 USD = Rp</span>
              <CurrencyInput 
                value={usdRate} 
                onChangeValue={(val) => setUsdRate(Number(val))} 
                className="max-w-[180px] h-10 rounded-xl bg-background border-border/80 font-bold tabular-nums text-sm"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Contoh: <strong className="text-foreground font-semibold">18000</strong> (Artinya $1 = Rp 18.000 IDR)
            </p>
          </div>

          {/* Live Simulation Card */}
          {Boolean(khrRate) && Boolean(usdRate) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-card border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <Calculator className="h-4 w-4" />
                <span>Simulasi Konversi Real-Time Kasir:</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
                <p>Penjualan 1 Slop Rokok seharga <strong className="text-foreground">135,000 KHR</strong>:</p>
                <p className="font-mono text-[11px] text-muted-foreground/80">
                  = (135,000 ÷ {Number(khrRate).toLocaleString('id-ID')}) × Rp {Number(usdRate).toLocaleString('id-ID')}
                </p>
                <p className="text-base font-bold text-emerald-500 tabular-nums tracking-tight pt-1">
                  = Rp {((135000 / Number(khrRate)) * Number(usdRate)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={isUpdating} 
            className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold tracking-wide shadow-md shadow-amber-500/20 gap-2"
          >
            {isUpdating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isUpdating ? 'Menyimpan Kurs...' : 'Simpan Pengaturan Kurs'}</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
