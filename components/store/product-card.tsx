import { ArrowRight, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatMoney, isPrototypeImage } from '@/lib/store-format';
import type { Product } from '@/lib/store-types';

export function ProductCard({
  product,
  compact = false,
  onProduct,
  onAdd,
}: {
  product: Product;
  compact?: boolean;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl">
      <button
        type="button"
        onClick={() => onProduct(product)}
        className="relative block w-full overflow-hidden text-left"
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
            compact ? 'h-52' : 'h-64'
          }`}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {!product.available && (
            <Badge className="bg-destructive text-white">Indisponível</Badge>
          )}
          {product.bestseller && (
            <Badge className="bg-[#2f4f3c] text-white">Mais vendido</Badge>
          )}
        </div>
        {isPrototypeImage(product.imageUrl) && (
          <span className="absolute bottom-3 left-3 rounded-md bg-[#24170f]/88 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            Imagem ilustrativa
          </span>
        )}
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 border-primary/25">
              {product.category}
            </Badge>
            <h3 className="line-clamp-2 font-heading text-xl font-bold leading-tight">
              {product.name}
            </h3>
          </div>
          {product.featured && (
            <Star className="size-5 shrink-0 text-primary" />
          )}
        </div>
        <p className="mt-3 line-clamp-2 min-h-11 text-sm leading-6 text-muted-foreground">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <strong className="font-heading text-xl">
            {formatMoney(product.priceCents)}
          </strong>
          <Button
            size="sm"
            disabled={!product.available}
            onClick={() => onAdd(product)}
          >
            <ShoppingBag />
            Adicionar
          </Button>
        </div>
        <Button
          variant="ghost"
          className="mt-2 h-8 w-full justify-start px-0 text-primary"
          onClick={() => onProduct(product)}
        >
          Ver detalhes
          <ArrowRight />
        </Button>
      </div>
    </article>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-grid h-9 grid-cols-[36px_40px_36px] overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-4" />
      </button>
      <span className="grid place-items-center text-sm font-semibold">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function CategoryPill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
