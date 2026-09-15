import { ArrowRight, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatMoney, isPrototypeImage } from '@/lib/store-format';
import type { Product } from '@/lib/store-types';
import { cn } from '@/lib/utils';

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
    <article className="group flex h-full snap-start flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl">
      <button
        type="button"
        onClick={() => onProduct(product)}
        className={`relative block w-full shrink-0 overflow-hidden text-left ${
          compact ? 'aspect-[4/3]' : 'aspect-[7/6]'
        }`}
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          width={720}
          height={720}
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 86vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 border-primary/25">
              {product.category}
            </Badge>
            <h3 className="line-clamp-2 break-words font-heading text-xl font-bold leading-tight">
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
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <strong className="shrink-0 font-heading text-xl">
            {formatMoney(product.priceCents)}
          </strong>
          <Button
            size="sm"
            className="h-10 px-3"
            disabled={!product.available}
            onClick={() => onAdd(product)}
          >
            <ShoppingBag />
            Adicionar
          </Button>
        </div>
        <a
          href={`/produto/${encodeURIComponent(product.slug)}`}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'mt-1 h-10 w-full justify-start px-0 text-primary',
          )}
          onClick={(event) => {
            event.preventDefault();
            onProduct(product);
          }}
        >
          Ver detalhes
          <ArrowRight />
        </a>
      </div>
    </article>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-grid h-10 grid-cols-[40px_40px_40px] overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid place-items-center text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-4" />
      </button>
      <span
        className="grid place-items-center text-sm font-semibold"
        aria-live="polite"
        aria-label={`Quantidade: ${value}`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
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
      aria-pressed={active}
      className={`min-h-10 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
