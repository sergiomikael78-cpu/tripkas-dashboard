'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProductForm } from '@/components/products/ProductForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useProducts } from '@/hooks/useProducts'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function ProductsPage() {
  const { products, isLoading, deleteProduct } = useProducts()
  const { data: workspace } = useWorkspace();
  const role = workspace?.role;
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const canManageProducts = role === 'owner' || role === 'admin'
  const canSeeBuyPrice = role === 'owner' || role === 'admin'

  const handleCreateNew = () => {
    setSelectedProduct(null)
    setIsFormOpen(true)
  }

  const handleEdit = (product: any) => {
    if (!canManageProducts) return
    setSelectedProduct(product)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Katalog Produk</h1>
        {canManageProducts && (
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Produk
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !products ? (
          <p>Memuat data produk...</p>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground">Belum ada data produk aktif.</p>
        ) : (
          products.map((product) => (
            <Card 
              key={product.id} 
              className={canManageProducts ? "cursor-pointer hover:border-primary transition-colors" : ""}
              onClick={() => handleEdit(product)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {product.name}
                    <span className="text-xs font-normal px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full">
                      {product.unit}
                    </span>
                  </div>
                  {canManageProducts && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <LuxuryDeleteDialog 
                        title="Hapus Produk?" 
                        description="Produk ini akan dihapus permanen. Aksi ini tidak dapat dibatalkan."
                        onConfirm={() => deleteProduct(product.id)} 
                      />
                    </div>
                  )}
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  {product.brand} {product.variant ? `- ${product.variant}` : ''}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-primary">
                    Harga Jual: {product.default_sell_currency === 'IDR' ? 'Rp' : ''} {product.default_sell_price?.toLocaleString('en-US')} {product.default_sell_currency !== 'IDR' ? product.default_sell_currency : ''}
                  </p>
                  {canSeeBuyPrice && (
                    <p className="text-muted-foreground">
                      Modal: Rp {product.default_buy_price?.toLocaleString('id-ID')}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2">
                    Stok Saat Ini: <span className="font-medium text-foreground">{product.current_stock}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProductForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        productToEdit={selectedProduct} 
      />
    </div>
  )
}
