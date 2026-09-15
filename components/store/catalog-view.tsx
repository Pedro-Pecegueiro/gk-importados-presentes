import { Search } from 'lucide-react';
import { CategoryPill, ProductCard } from '@/components/store/product-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { PRODUCT_CATEGORIES, STORE_CONTACT_COPY } from '@/lib/store-config';
import { formatProductCount } from '@/lib/store-format';
import type { Product } from '@/lib/store-types';

export function CatalogView({
  products,
  allProducts,
  search,
  category,
  categoryCounts,
  onSearch,
  onCategory,
  onProduct,
  onAdd,
}: {
  products: Product[];
  allProducts: Product[];
  search: string;
  category: string;
  categoryCounts: Map<string, number>;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
        <div>
          <Badge variant="outline" className="mb-4 border-primary/35">
            Catálogo
          </Badge>
          <h1 className="font-heading text-3xl font-semibold leading-tight sm:text-5xl">
            Monte sua sacola e fale diretamente com a GK.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {STORE_CONTACT_COPY}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <span className="sr-only">Pesquisar produto</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                type="search"
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Pesquisar por perfume, body splash ou kit..."
                autoComplete="off"
                enterKeyHint="search"
                aria-describedby="catalog-results"
              />
            </label>
            <NativeSelect
              className="w-full"
              value={category}
              onChange={(event) => onCategory(event.target.value)}
              aria-label="Filtrar categoria"
            >
              <NativeSelectOption value="Todos">
                Todas as categorias
              </NativeSelectOption>
              {PRODUCT_CATEGORIES.map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {item}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
            <CategoryPill
              active={category === 'Todos'}
              label={`Todos (${allProducts.length})`}
              onClick={() => onCategory('Todos')}
            />
            {PRODUCT_CATEGORIES.map((item) => (
              <CategoryPill
                key={item}
                active={category === item}
                label={`${item} (${categoryCounts.get(item) ?? 0})`}
                onClick={() => onCategory(item)}
              />
            ))}
          </div>
          <p
            id="catalog-results"
            className="mt-3 text-xs font-medium text-muted-foreground"
            aria-live="polite"
          >
            {formatProductCount(products.length)} encontrado
            {products.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProduct={onProduct}
            onAdd={onAdd}
          />
        ))}
      </div>

      {products.length === 0 && (
        <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center">
          <Search className="mx-auto mb-4 size-9 text-muted-foreground" />
          <h2 className="font-heading text-xl font-semibold">
            Nenhum produto encontrado
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tente buscar outro nome ou trocar a categoria.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => {
              onSearch('');
              onCategory('Todos');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </main>
  );
}
