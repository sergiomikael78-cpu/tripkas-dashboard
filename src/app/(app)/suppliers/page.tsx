'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function SuppliersPage() {
  const [showInactive, setShowInactive] = useState(false)
  const { suppliers, isLoading, deleteSupplier } = useSuppliers({ includeInactive: showInactive })
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)

  const canManageSuppliers = role === 'owner' || role === 'admin'

  const handleCreateNew = () => {
    setSelectedSupplier(null)
    setIsFormOpen(true)
  }

  const handleEdit = (supplier: any) => {
    if (!canManageSuppliers) return
    setSelectedSupplier(supplier)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Daftar Supplier</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowInactive(!showInactive)}
            size="sm"
          >
            {showInactive ? "Sembunyikan Nonaktif" : "Tampilkan Nonaktif"}
          </Button>
          {canManageSuppliers && (
            <Button onClick={handleCreateNew} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Tambah Supplier
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !suppliers ? (
          <p>Memuat data supplier...</p>
        ) : suppliers.length === 0 ? (
          <p className="text-muted-foreground">Belum ada data supplier aktif.</p>
        ) : (
          suppliers.map((supplier) => (
            <Card 
              key={supplier.id} 
              className={canManageSuppliers ? "cursor-pointer hover:border-primary transition-colors" : ""}
              onClick={() => handleEdit(supplier)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {supplier.name}
                    {!supplier.is_active && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Nonaktif</span>
                    )}
                  </div>
                  {canManageSuppliers && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <LuxuryDeleteDialog 
                        title="Hapus Supplier?" 
                        description="Supplier ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan."
                        onConfirm={() => deleteSupplier(supplier.id)} 
                      />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {supplier.contact && <p>Kontak: {supplier.contact}</p>}
                  {supplier.notes && <p className="truncate">Catatan: {supplier.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SupplierForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        supplierToEdit={selectedSupplier} 
      />
    </div>
  )
}
