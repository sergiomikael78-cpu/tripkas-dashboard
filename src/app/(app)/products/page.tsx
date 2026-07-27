'use client'

import { useState } from 'react'
import { Plus, Package, PackageSearch, Tag, Sparkles, DollarSign, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '@/components/products/ProductForm'
import { LuxuryDeleteDialog } from '@/components/ui/luxury-delete-dialog'
import { useProducts } from '@/hooks/useProducts'
import { useWorkspace } from '@/hooks/useWorkspace'

export default function ProductsPage() {
  const { products, isLoading, deleteProduct } = useProducts()
  const { data: workspace } = useWorkspace()
  const role = workspace?.role
  
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-amber-500/80 bg-clip-text text-transparent">
              Katalog Master Produk
            </h1>
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Daftar seluruh varian rokok, harga acuan, serta posisi stok saat ini.
          </p>
        </div>

        {canManageProducts && (
          <Button onClick={handleCreateNew} className="h-10 rounded-xl px-4 gap-2 font-semibold shadow-md shadow-amber-500/20">
            <Plus className="h-4 w-4" />
            <span>Tambah Produk</span>
          </Button>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || !products ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border border-border/60 dark:border-white/10">
                <CardHeader className="pb-3 space-y-2">
                  <div className="h-5 w-32 rounded-lg bg-muted shimmer" />
                  <div className="h-3 w-20 rounded bg-muted shimmer" />
                </CardHeader>
                <CardContent className="space-y-2 pt-2">
                  <div className="h-4 w-28 rounded bg-muted shimmer" />
                  <div className="h-3.5 w-20 rounded bg-muted shimmer" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : products.length === 0 ? (
          <Card className="col-span-full border-dashed border-border/80 dark:border-white/10 bg-card/40 py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <PackageSearch className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">Belum Ada Produk Terdaftar</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Tambahkan varian merek rokok dan penetapan harga jual default untuk memulai transaksi.
                </p>
              </div>
              {canManageProducts && (
                <Button onClick={handleCreateNew} variant="outline" className="mt-2 rounded-xl text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Produk Pertama</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          products.map((product) => (
            <Card 
              key={product.id} 
              className={`relative overflow-hidden transition-all duration-300 ${
                canManageProducts 
                  ? "cursor-pointer hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5" 
                  : ""
              }`}
              onClick={() => handleEdit(product)}
            >
              <CardHeader className="pb-3 pt-5 pl-5">
                <CardTitle className="text-base flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base tracking-tight text-foreground">
                          {product.name}
                        </span>
                        <Badge variant="default" className="text-[10px] px-2 py-0.2 uppercase font-semibold">
                          {product.unit}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {product.brand} {product.variant ? `• ${product.variant}` : ''}
                      </p>
                    </div>
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
              </CardHeader>

              <CardContent className="pl-5 pb-5 pt-1 space-y-3">
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">Harga Jual Acuan</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {product.default_sell_currency === 'IDR' ? 'Rp' : ''} {product.default_sell_price?.toLocaleString('en-US')} {product.default_sell_currency !== 'IDR' ? product.default_sell_currency : ''}
                    </span>
                  </div>
                  {canSeeBuyPrice && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/30 dark:border-white/5">
                      <span className="text-[11px] font-medium text-muted-foreground">Harga Modal (HPP)</span>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        Rp {product.default_buy_price?.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>Stok Tersedia:</span>
                  </div>
                  <Badge 
                    variant={product.current_stock > 0 ? "secondary" : "destructive"}
                    className="tabular-nums font-semibold"
                  >
                    {product.current_stock} {product.unit}
                  </Badge>
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
