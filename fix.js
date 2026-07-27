const fs = require('fs');
const path = require('path');

const files = [
  'src/components/trips/TripForm.tsx',
  'src/components/products/ProductForm.tsx',
  'src/app/(app)/purchases/page.tsx',
  'src/app/(app)/trips/page.tsx',
  'src/app/(app)/suppliers/page.tsx',
  'src/app/(app)/products/page.tsx',
  'src/app/(app)/customers/page.tsx',
  'src/app/(app)/layout.tsx'
];

files.forEach(file => {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Fix useWorkspace usage
    content = content.replace(/const \{ role \} = useWorkspace\(\)/g, 'const { data: workspace } = useWorkspace();\n  const role = workspace?.role;');
    
    // Fix rendering bug when data is undefined
    if (file.includes('purchases/page.tsx')) {
      content = content.replace('} : purchases?.length === 0 ? (', '} : !purchases ? (\n          <p className="text-muted-foreground">Memuat data...</p>\n        ) : purchases.length === 0 ? (');
    }
    if (file.includes('trips/page.tsx')) {
      content = content.replace('} : trips?.length === 0 ? (', '} : !trips ? (\n          <p className="text-muted-foreground">Memuat data...</p>\n        ) : trips.length === 0 ? (');
    }
    if (file.includes('suppliers/page.tsx')) {
      content = content.replace('} : suppliers?.length === 0 ? (', '} : !suppliers ? (\n          <p className="text-muted-foreground">Memuat data...</p>\n        ) : suppliers.length === 0 ? (');
    }
    if (file.includes('products/page.tsx')) {
      content = content.replace('} : products?.length === 0 ? (', '} : !products ? (\n          <p className="text-muted-foreground">Memuat data...</p>\n        ) : products.length === 0 ? (');
    }
    if (file.includes('customers/page.tsx')) {
      content = content.replace('} : customers?.length === 0 ? (', '} : !customers ? (\n          <p className="text-muted-foreground">Memuat data...</p>\n        ) : customers.length === 0 ? (');
    }
    
    fs.writeFileSync(p, content);
    console.log('Fixed', file);
  } else {
    console.log('Not found', file);
  }
});
