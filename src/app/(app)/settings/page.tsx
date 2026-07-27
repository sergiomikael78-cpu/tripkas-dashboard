'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
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

  if (isLoading) return <div className="p-4">Memuat pengaturan...</div>

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan kurs mata uang untuk transaksi Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kurs Mata Uang</CardTitle>
          <CardDescription>
            Nilai tukar ini akan digunakan secara otomatis saat Anda mencatat penjualan dengan mata uang asing.
            <br />
            <strong>Rumus KHR ke IDR:</strong> (Nominal KHR / Kurs Dollar ke Riel) × Kurs Dollar ke Rupiah
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="space-y-3 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 shadow-inner">
            <Label className="text-zinc-300 font-semibold tracking-wide">Kurs Dollar ke Riel (USD to KHR)</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-400">1 USD = </span>
              <CurrencyInput 
                value={khrRate} 
                onChangeValue={(val) => setKhrRate(Number(val))} 
                className="max-w-[200px] bg-zinc-950/50 border-zinc-700/50 focus:border-primary/50"
              />
              <span className="text-sm font-medium text-zinc-400">KHR</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Contoh: 4000. Artinya 1 Dollar sama dengan 4000 Riel.
            </p>
          </div>

          <div className="space-y-3 bg-zinc-900/40 p-5 rounded-xl border border-zinc-800/50 shadow-inner">
            <Label className="text-zinc-300 font-semibold tracking-wide">Kurs Dollar ke Rupiah (USD to IDR)</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-400">1 USD = Rp</span>
              <CurrencyInput 
                value={usdRate} 
                onChangeValue={(val) => setUsdRate(Number(val))} 
                className="max-w-[200px] bg-zinc-950/50 border-zinc-700/50 focus:border-primary/50"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Contoh: 18000. Artinya 1 Dollar sama dengan Rp 18.000.
            </p>
          </div>

          {khrRate && usdRate && (
            <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-zinc-900/40 border border-emerald-900/50 rounded-xl shadow-inner">
              <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Simulasi Perhitungan Live:
              </h4>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Jika Anda menjual barang seharga <strong className="text-white">135,000 KHR</strong>:
                <br />
                <span className="text-zinc-500">= (135,000 / {khrRate}) × Rp {usdRate.toLocaleString('id-ID')}</span>
                <br />
                <span className="text-lg text-emerald-300 font-bold mt-1 block">
                  = Rp {((135000 / Number(khrRate)) * Number(usdRate)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={isUpdating} className="w-full md:w-auto h-11 px-8 rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
