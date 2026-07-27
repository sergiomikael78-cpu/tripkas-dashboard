'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useCustomers } from '@/hooks/useCustomers'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function CustomersPage() {
  const [showInactive, setShowInactive] = useState(false)
  const { customers, isLoading, deleteCustomer } = useCustomers({ includeInactive: showInactive })
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Pelanggan</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowInactive(!showInactive)}
            size="sm"
          >
            {showInactive ? "Sembunyikan Nonaktif" : "Tampilkan Nonaktif"}
          </Button>
          {canManageCustomers && (
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !customers ? (
          <p>Memuat data pelanggan...</p>
        ) : customers.length === 0 ? (
          <p className="text-muted-foreground">Belum ada data pelanggan aktif.</p>
        ) : (
          customers.map((customer) => (
            <Card 
              key={customer.id} 
              className={canManageCustomers ? "cursor-pointer hover:border-primary transition-colors" : ""}
              onClick={() => handleEdit(customer)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap gap-2 justify-between items-center text-lg">
                  <div className="flex items-center gap-2">
                    {customer.name}
                    {!customer.is_active && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Nonaktif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      customer.type === 'warung' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {customer.type}
                    </span>
                    {canManageCustomers && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <LuxuryDeleteDialog 
                          title="Hapus Pelanggan?" 
                          description="Data pelanggan ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan."
                          onConfirm={() => deleteCustomer(customer.id)} 
                        />
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {customer.contact && <p>Kontak: {customer.contact}</p>}
                  {customer.notes && <p className="truncate">Catatan: {customer.notes}</p>}
                </div>
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
