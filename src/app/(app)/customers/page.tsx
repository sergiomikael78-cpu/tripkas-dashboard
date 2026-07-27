'use client'

import { useState } from 'react'
import { Plus, Users, Phone, FileText, Sparkles, Eye, EyeOff, Store, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useCustomers } from '@/hooks/useCustomers'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function CustomersPage() {
  const [showInactive, setShowInactive] = useState(false)
  const { customers, isLoading, deleteCustomer } = useCustomers({ includeInactive: showInactive })
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const canManageCustomers = role === 'owner' || role === 'admin' || role === 'partner'

  const handleCreateNew = () => {
    setSelectedCustomer(null)
    setIsFormOpen(true)
  }

  const handleEdit = (customer: any) => {
    if (!canManageCustomers) return
    setSelectedCustomer(customer)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Master Data Pelanggan
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Kelola pembeli grosir, toko, maupun warung langganan rokok Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={() => setShowInactive(!showInactive)}
            className="h-10 rounded-xl px-3 text-xs gap-1.5 font-medium border-border/80"
          >
            {showInactive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span>{showInactive ? "Sembunyikan Nonaktif" : "Tampilkan Nonaktif"}</span>
          </Button>

          {canManageCustomers && (
            <Button onClick={handleCreateNew} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
              <Plus className="h-4 w-4" />
              <span>Tambah Pelanggan</span>
            </Button>
          )}
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !customers ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardHeader className="pb-3 space-y-2">
                  <div className="h-5 w-36 rounded-lg bg-muted shimmer" />
                  <div className="h-3.5 w-20 rounded bg-muted shimmer" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-3.5 w-28 rounded bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : customers.length === 0 ? (
          <Card className="col-span-full border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Belum Ada Pelanggan Terdaftar</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Tambahkan pelanggan (warung/grosir) untuk mempermudah pencatatan piutang dan penjualan.
                </p>
              </div>
              {canManageCustomers && (
                <Button onClick={handleCreateNew} variant="outline" className="mt-2 rounded-xl text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Pelanggan Pertama</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card 
              key={customer.id} 
              className={`relative overflow-hidden transition-all duration-300 ${
                canManageCustomers 
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5" 
                  : ""
              } ${!customer.is_active ? "opacity-60 bg-muted/20" : ""}`}
              onClick={() => handleEdit(customer)}
            >
              <CardHeader className="pb-3 pt-5 pl-5">
                <CardTitle className="text-base flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                      {customer.type === 'warung' ? <Store className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-base tracking-tight text-foreground block">
                        {customer.name}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge 
                          variant={customer.type === 'warung' ? 'secondary' : 'default'} 
                          className="text-[10px] px-2 py-0.2 uppercase font-semibold"
                        >
                          {customer.type}
                        </Badge>
                        {!customer.is_active && (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0.2">
                            Nonaktif
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageCustomers && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <LuxuryDeleteDialog 
                        title="Hapus Pelanggan?" 
                        description="Data pelanggan ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan."
                        onConfirm={() => deleteCustomer(customer.id)} 
                      />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="pl-5 pb-5 pt-1 space-y-2 text-xs text-muted-foreground">
                {customer.contact ? (
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    <span>{customer.contact}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground/50 italic">Tidak ada nomor kontak</p>
                )}

                {customer.notes && (
                  <div className="flex items-start gap-2 pt-1.5 border-t border-border/40 dark:border-white/5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed">{customer.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CustomerForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        customerToEdit={selectedCustomer} 
      />
    </div>
  )
}
