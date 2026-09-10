'use client';

import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Edit3,
  Gift,
  ImagePlus,
  Loader2,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  PRODUCT_CATEGORIES,
  STORE_CONTACT_COPY,
  STORE_NAME,
  WHATSAPP_NUMBER,
} from '@/lib/store-config';
import type {
  Banner,
  BannerInput,
  Product,
  ProductInput,
  StorePayload,
} from '@/lib/store-types';

type StoreAppProps = {
  initialView: 'home' | 'catalog' | 'admin';
  initialProductSlug?: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type ProductFormState = ProductInput & {
  id?: string;
};

type BannerFormState = BannerInput & {
  id?: string;
};

type WebMcpTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: object;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: unknown): unknown;
};

declare global {
  interface Document {
    modelContext?: {
      registerTool(
        tool: WebMcpTool,
        options?: { signal?: AbortSignal },
      ): void | Promise<void>;
    };
  }
}

const cartStorageKey = 'gk-importados-sacola';
const adminStorageKey = 'gk-importados-admin-key';

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatMoney(cents: number) {
  return money.format(cents / 100);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inputRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Entrada invalida.');
  }

  return input as Record<string, unknown>;
}

function emptyProductForm(): ProductFormState {
  return {
    name: '',
    description: '',
    details: '',
    priceCents: 0,
    category: PRODUCT_CATEGORIES[0],
    imageUrl: '/gk-cuidados.png',
    available: true,
    featured: false,
    bestseller: false,
    giftKit: false,
    sortOrder: 100,
  };
}

function emptyBannerForm(): BannerFormState {
  return {
    title: '',
    subtitle: '',
    ctaLabel: 'Ver catalogo',
    imageUrl: '/gk-kit-presente.png',
    active: true,
    sortOrder: 100,
  };
}

function productToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    details: product.details,
    priceCents: product.priceCents,
    category: product.category,
    imageUrl: product.imageUrl,
    available: product.available,
    featured: product.featured,
    bestseller: product.bestseller,
    giftKit: product.giftKit,
    sortOrder: product.sortOrder,
  };
}

function bannerToForm(banner: Banner): BannerFormState {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    imageUrl: banner.imageUrl,
    active: banner.active,
    sortOrder: banner.sortOrder,
  };
}

function productInputFromForm(form: ProductFormState): ProductInput {
  return {
    name: form.name,
    description: form.description,
    details: form.details,
    priceCents: form.priceCents,
    category: form.category,
    imageUrl: form.imageUrl,
    available: form.available,
    featured: form.featured,
    bestseller: form.bestseller,
    giftKit: form.giftKit,
    sortOrder: form.sortOrder,
  };
}

function bannerInputFromForm(form: BannerFormState): BannerInput {
  return {
    title: form.title,
    subtitle: form.subtitle,
    ctaLabel: form.ctaLabel,
    imageUrl: form.imageUrl,
    active: form.active,
    sortOrder: form.sortOrder,
  };
}

export default function StoreApp({
  initialView,
  initialProductSlug,
}: StoreAppProps) {
  const [view, setView] = useState(initialView);
  const [payload, setPayload] = useState<StorePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [adminKey, setAdminKey] = useState('');
  const [openedInitialProduct, setOpenedInitialProduct] = useState(false);

  async function loadStore() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/store', { cache: 'no-store' });
      const data = (await response.json()) as StorePayload & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Nao foi possivel carregar a loja.');
      }

      setPayload(data);
    } catch (storeError) {
      setError(
        storeError instanceof Error
          ? storeError.message
          : 'Nao foi possivel carregar a loja.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStore();
  }, []);

  useEffect(() => {
    const storedCart = window.localStorage.getItem(cartStorageKey);
    const storedAdminKey = window.sessionStorage.getItem(adminStorageKey);

    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart) as CartItem[];
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch {
        window.localStorage.removeItem(cartStorageKey);
      }
    }

    if (storedAdminKey) {
      setAdminKey(storedAdminKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!payload || !initialProductSlug || openedInitialProduct) {
      return;
    }

    const product = payload.products.find(
      (item) => item.slug === initialProductSlug,
    );

    if (product) {
      setSelectedProduct(product);
      setDetailOpen(true);
      setView('catalog');
    }

    setOpenedInitialProduct(true);
  }, [initialProductSlug, openedInitialProduct, payload]);

  const products = useMemo(() => payload?.products ?? [], [payload?.products]);
  const banners = useMemo(() => payload?.banners ?? [], [payload?.banners]);
  const activeBanners = banners.filter((banner) => banner.active);
  const heroBanner = activeBanners[0];
  const whatsappNumber =
    payload?.settings.WHATSAPP_NUMBER.replace(/\D/g, '') || WHATSAPP_NUMBER;

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = normalizeText(search);

    return products.filter((product) => {
      const matchesCategory =
        category === 'Todos' || product.category === category;
      const haystack = normalizeText(
        `${product.name} ${product.description} ${product.category}`,
      );

      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [category, products, search]);

  const featuredProducts = products.filter((product) => product.featured);
  const bestsellerProducts = products.filter((product) => product.bestseller);
  const kitProducts = products.filter((product) => product.giftKit);

  const cartLines = cart
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter(Boolean) as Array<{ product: Product; quantity: number }>;

  const cartCount = cartLines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cartLines.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );

  const orderMessage = useMemo(() => {
    if (cartLines.length === 0) {
      return 'Ola! Gostaria de saber mais sobre os produtos da GK Importados e Presentes.';
    }

    const productLines = cartLines
      .map(
        (line) =>
          `${line.quantity}x ${line.product.name} - ${formatMoney(
            line.product.priceCents * line.quantity,
          )}`,
      )
      .join('\n');

    return `Ola! Gostaria de fazer um pedido:\n\nPedido:\n\n${productLines}\n\nTotal: ${formatMoney(
      subtotal,
    )}\n\nGostaria de confirmar a disponibilidade dos produtos e dar continuidade ao pedido.`;
  }, [cartLines, subtotal]);

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    orderMessage,
  )}`;

  useEffect(() => {
    const context = document.modelContext;

    if (!context?.registerTool || products.length === 0) {
      return;
    }

    const registerTool = context.registerTool.bind(context);
    const lifecycle = new AbortController();

    function register(tool: WebMcpTool) {
      try {
        void Promise.resolve(
          registerTool(tool, { signal: lifecycle.signal }),
        ).catch(console.error);
      } catch (toolError) {
        console.error(toolError);
      }
    }

    register({
      name: 'read_gk_catalog',
      title: 'Ler catalogo GK',
      description:
        'Lista produtos, categorias, disponibilidade e precos visiveis no catalogo da GK Importados e Presentes.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return {
          products: products.map((product) => ({
            slug: product.slug,
            name: product.name,
            category: product.category,
            available: product.available,
            priceCents: product.priceCents,
          })),
        };
      },
    });

    register({
      name: 'stage_gk_catalog_filter',
      title: 'Filtrar catalogo GK',
      description:
        'Abre o catalogo visivel e aplica uma busca e categoria para o cliente escolher produtos.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          category: { type: 'string' },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const record = inputRecord(input);
        const query = typeof record.query === 'string' ? record.query : '';
        const nextCategory =
          typeof record.category === 'string' &&
          ['Todos', ...PRODUCT_CATEGORIES].includes(record.category)
            ? record.category
            : 'Todos';

        setView('catalog');
        setSearch(query);
        setCategory(nextCategory);
        window.history.pushState(null, '', '/catalogo');

        return {
          view: 'catalog',
          query,
          category: nextCategory,
        };
      },
    });

    register({
      name: 'add_gk_product_to_bag',
      title: 'Adicionar a sacola GK',
      description:
        'Adiciona um produto disponivel a sacola usando o slug do produto e a quantidade desejada.',
      inputSchema: {
        type: 'object',
        properties: {
          productSlug: { type: 'string' },
          quantity: { type: 'number', minimum: 1, maximum: 20 },
        },
        required: ['productSlug'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const record = inputRecord(input);
        const productSlug =
          typeof record.productSlug === 'string' ? record.productSlug : '';
        const quantity =
          typeof record.quantity === 'number'
            ? Math.min(Math.max(Math.round(record.quantity), 1), 20)
            : 1;
        const product = products.find((item) => item.slug === productSlug);

        if (!product) {
          throw new Error('Produto nao encontrado.');
        }

        if (!product.available) {
          throw new Error('Produto indisponivel.');
        }

        addToCart(product, quantity);
        setCartOpen(true);

        return {
          productSlug,
          quantity,
          status: 'added',
        };
      },
    });

    return () => lifecycle.abort();
  }, [products]);

  function setRoute(nextView: 'home' | 'catalog' | 'admin') {
    const pathByView = {
      home: '/',
      catalog: '/catalogo',
      admin: '/admin',
    };

    setView(nextView);
    setMobileNavOpen(false);
    window.history.pushState(null, '', pathByView[nextView]);
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setDetailOpen(true);
    window.history.pushState(null, '', `/produto/${product.slug}`);
  }

  function closeProduct(open: boolean) {
    setDetailOpen(open);

    if (!open) {
      setSelectedProduct(null);
      if (window.location.pathname.startsWith('/produto/')) {
        window.history.replaceState(null, '', '/catalogo');
      }
    }
  }

  function addToCart(product: Product, quantity = 1) {
    if (!product.available) {
      setNotice('Produto indisponivel no momento.');
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { productId: product.id, quantity }];
    });
    setNotice(`${product.name} foi adicionado a sacola.`);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) =>
        current.filter((item) => item.productId !== productId),
      );
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function openWhatsAppOrder() {
    if (cartLines.length === 0) {
      return;
    }

    window.open(whatsappHref, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Ir para a pagina inicial"
          >
            <img
              src="/gk-logo.png"
              alt="Logo GK Importados e Presentes"
              className="h-12 w-12 rounded-full border border-primary/25 object-cover shadow-[0_0_22px_rgb(181_126_62/24%)]"
            />
            <span className="hidden min-w-0 sm:block">
              <span className="block font-heading text-lg font-semibold leading-tight text-foreground">
                GK Importados
              </span>
              <span className="block text-xs uppercase tracking-[0.24em] text-muted-foreground">
                e Presentes
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            <Button
              variant={view === 'home' ? 'secondary' : 'ghost'}
              onClick={() => setRoute('home')}
            >
              Inicio
            </Button>
            <Button
              variant={view === 'catalog' ? 'secondary' : 'ghost'}
              onClick={() => setRoute('catalog')}
            >
              Catalogo
            </Button>
            <Button
              variant={view === 'admin' ? 'secondary' : 'ghost'}
              onClick={() => setRoute('admin')}
            >
              Painel
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 px-3"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag />
              <span className="hidden sm:inline">Sacola</span>
              {cartCount > 0 && (
                <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="md:hidden"
              onClick={() => setMobileNavOpen((current) => !current)}
              aria-label="Abrir menu"
            >
              {mobileNavOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <div className="mx-auto grid max-w-7xl grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => setRoute('home')}>
                Inicio
              </Button>
              <Button variant="secondary" onClick={() => setRoute('catalog')}>
                Catalogo
              </Button>
              <Button variant="secondary" onClick={() => setRoute('admin')}>
                Painel
              </Button>
            </div>
          </div>
        )}
      </header>

      {notice && (
        <div className="fixed left-1/2 top-24 z-50 w-[min(92vw,440px)] -translate-x-1/2 rounded-lg border border-primary/25 bg-card px-4 py-3 text-sm shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <span>{notice}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setNotice('')}
              aria-label="Fechar aviso"
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      {loading && !payload ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStore} />
      ) : (
        <>
          {view === 'home' && (
            <HomeView
              heroBanner={heroBanner}
              products={products}
              featuredProducts={featuredProducts}
              bestsellerProducts={bestsellerProducts}
              kitProducts={kitProducts}
              categoryCounts={categoryCounts}
              onCatalog={() => setRoute('catalog')}
              onProduct={openProduct}
              onAdd={addToCart}
            />
          )}

          {view === 'catalog' && (
            <CatalogView
              products={filteredProducts}
              allProducts={products}
              search={search}
              category={category}
              categoryCounts={categoryCounts}
              onSearch={setSearch}
              onCategory={setCategory}
              onProduct={openProduct}
              onAdd={addToCart}
            />
          )}

          {view === 'admin' && payload && (
            <AdminView
              payload={payload}
              adminKey={adminKey}
              setAdminKey={setAdminKey}
              refresh={loadStore}
              setNotice={setNotice}
            />
          )}
        </>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-[min(100vw,460px)] border-l-primary/20 bg-card">
          <SheetHeader className="border-b border-border px-5 py-5">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="size-5 text-primary" />
              Sua sacola
            </SheetTitle>
            <SheetDescription>
              O pedido sera enviado pelo WhatsApp para confirmacao manual da loja.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5">
            {cartLines.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-4 size-10 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold">
                  Sua sacola esta vazia
                </h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Escolha perfumes, cuidados ou kits e finalize a conversa pelo
                  WhatsApp.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => {
                    setCartOpen(false);
                    setRoute('catalog');
                  }}
                >
                  Ver catalogo
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-5">
                {cartLines.map((line) => (
                  <div
                    key={line.product.id}
                    className="grid grid-cols-[76px_1fr] gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <img
                      src={line.product.imageUrl}
                      alt=""
                      className="h-20 w-20 rounded-md object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="line-clamp-2 text-sm font-semibold">
                            {line.product.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatMoney(line.product.priceCents)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => updateCartQuantity(line.product.id, 0)}
                          aria-label={`Remover ${line.product.name}`}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(quantity) =>
                            updateCartQuantity(line.product.id, quantity)
                          }
                        />
                        <strong className="text-sm">
                          {formatMoney(line.product.priceCents * line.quantity)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background/70 p-5">
            <div className="mb-4 flex items-center justify-between text-base">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <Button
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={cartLines.length === 0}
              onClick={openWhatsAppOrder}
            >
              <MessageCircle />
              Finalizar pedido pelo WhatsApp
            </Button>
            <Button
              variant="ghost"
              className="mt-2 h-10 w-full"
              onClick={() => {
                setCartOpen(false);
                setRoute('catalog');
              }}
            >
              Continuar comprando
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={detailOpen} onOpenChange={closeProduct}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border border-primary/15 bg-card p-0 sm:max-w-4xl">
          {selectedProduct && (
            <div className="grid gap-0 md:grid-cols-[0.96fr_1fr]">
              <div className="relative min-h-80 overflow-hidden rounded-t-xl bg-muted md:rounded-l-xl md:rounded-tr-none">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="h-full min-h-80 w-full object-cover"
                />
                {!selectedProduct.available && (
                  <Badge className="absolute left-4 top-4 bg-destructive text-white">
                    Indisponivel
                  </Badge>
                )}
              </div>
              <div className="p-6 md:p-8">
                <DialogHeader>
                  <Badge variant="outline" className="w-fit">
                    {selectedProduct.category}
                  </Badge>
                  <DialogTitle className="font-heading text-3xl leading-tight">
                    {selectedProduct.name}
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    {selectedProduct.description}
                  </DialogDescription>
                </DialogHeader>

                <p className="mt-5 text-sm leading-7 text-muted-foreground">
                  {selectedProduct.details}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Preco</span>
                    <strong className="block font-heading text-2xl">
                      {formatMoney(selectedProduct.priceCents)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <QuantityStepper
                      value={detailQuantity}
                      onChange={setDetailQuantity}
                      min={1}
                    />
                    <Button
                      className="h-10"
                      disabled={!selectedProduct.available}
                      onClick={() => {
                        addToCart(selectedProduct, detailQuantity);
                        setCartOpen(true);
                      }}
                    >
                      <ShoppingBag />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
          'Ola! Gostaria de saber mais sobre os produtos da GK Importados e Presentes.',
        )}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 left-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#1f8f55] text-white shadow-[0_16px_35px_rgb(31_143_85/34%)] transition hover:-translate-y-0.5 hover:bg-[#177847] sm:left-6"
        aria-label="Conversar pelo WhatsApp"
      >
        <MessageCircle className="size-5" />
      </a>

      <Button
        className="fixed bottom-5 right-4 z-40 h-12 rounded-full px-4 shadow-[0_16px_35px_rgb(55_33_19/24%)] sm:right-6"
        onClick={() => setCartOpen(true)}
      >
        <ShoppingBag />
        <span>{cartCount}</span>
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando a loja</span>
      </div>
    </main>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4">
      <div className="max-w-md rounded-lg border border-destructive/20 bg-card p-6 text-center shadow-sm">
        <h1 className="font-heading text-xl font-semibold">
          Nao foi possivel abrir a loja
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button className="mt-5" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}

function HomeView({
  heroBanner,
  products,
  featuredProducts,
  bestsellerProducts,
  kitProducts,
  categoryCounts,
  onCatalog,
  onProduct,
  onAdd,
}: {
  heroBanner?: Banner;
  products: Product[];
  featuredProducts: Product[];
  bestsellerProducts: Product[];
  kitProducts: Product[];
  categoryCounts: Map<string, number>;
  onCatalog: () => void;
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const heroImage = heroBanner?.imageUrl ?? '/gk-kit-presente.png';

  return (
    <main>
      <section className="relative isolate min-h-[72svh] overflow-hidden bg-[#2b1b12] text-white">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(31_18_12/92%),rgb(31_18_12/68%)_38%,rgb(31_18_12/16%))]" />
        <div className="mx-auto flex min-h-[72svh] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-5 border-white/20 bg-white/12 text-white">
              Curadoria de perfumaria e presentes
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">
              {STORE_NAME}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/82">
              {heroBanner?.subtitle ??
                'Perfumes, cosméticos, acessórios, chocolates e kits com atendimento direto pelo WhatsApp.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-11 bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                onClick={onCatalog}
              >
                Ver catalogo
                <ArrowRight />
              </Button>
              <a
                className={buttonVariants({
                  variant: 'outline',
                  className:
                    'h-11 border-white/35 bg-white/8 px-5 text-white hover:bg-white/18 hover:text-white',
                })}
                href="#kits"
              >
                Kits e presentes
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Highlight
            icon={<Sparkles />}
            title="Selecao com acabamento premium"
            text="Produtos escolhidos para presentear bem e facilitar a decisao."
          />
          <Highlight
            icon={<MessageCircle />}
            title="Pedido direto pelo WhatsApp"
            text="A loja confirma disponibilidade antes de concluir a venda."
          />
          <Highlight
            icon={<Gift />}
            title="Kits prontos e personalizaveis"
            text="Combinacoes para datas especiais, lembrancas e mimos."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Categorias"
          title="Encontre pelo tipo de presente"
          actionLabel="Abrir catalogo"
          onAction={onCatalog}
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={onCatalog}
              className="group flex min-h-32 items-start justify-between rounded-lg border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <span>
                <span className="block font-heading text-xl font-semibold">
                  {item}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {categoryCounts.get(item) ?? 0} produtos
                </span>
              </span>
              <Package className="size-5 text-primary transition group-hover:scale-110" />
            </button>
          ))}
        </div>
      </section>

      <ProductBand
        title="Produtos em destaque"
        eyebrow="Vitrine"
        products={featuredProducts}
        fallback={products.slice(0, 4)}
        onProduct={onProduct}
        onAdd={onAdd}
      />

      <ProductBand
        title="Mais vendidos e recomendados"
        eyebrow="Curadoria"
        products={bestsellerProducts}
        fallback={products.slice(2, 6)}
        onProduct={onProduct}
        onAdd={onAdd}
      />

      <section
        id="kits"
        className="border-y border-border bg-[linear-gradient(135deg,#fffaf2,#f8efe4_54%,#efe0cf)]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <Badge variant="outline" className="mb-4 w-fit border-primary/35">
              Kits e presentes
            </Badge>
            <h2 className="font-heading text-4xl font-semibold leading-tight text-[#2f2118]">
              Combinações prontas para surpreender com cuidado.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#684f3f]">
              Monte uma sacola com kits, perfumes e complementos. A loja recebe
              o pedido no WhatsApp e confirma tudo antes da finalização.
            </p>
            <Button className="mt-7 w-fit" onClick={onCatalog}>
              Escolher produtos
              <ArrowRight />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(kitProducts.length ? kitProducts : products.slice(0, 2)).map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  compact
                  onProduct={onProduct}
                  onAdd={onAdd}
                />
              ),
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CatalogView({
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
        <div>
          <Badge variant="outline" className="mb-4 border-primary/35">
            Catalogo
          </Badge>
          <h1 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">
            Escolha os produtos e envie sua sacola pelo WhatsApp.
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
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Pesquisar por perfume, kit, chocolate..."
              />
            </label>
            <NativeSelect
              className="w-full"
              value={category}
              onChange={(event) => onCategory(event.target.value)}
              aria-label="Filtrar categoria"
            >
              <NativeSelectOption value="Todos">Todas as categorias</NativeSelectOption>
              {PRODUCT_CATEGORIES.map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {item}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      )}
    </main>
  );
}

function AdminView({
  payload,
  adminKey,
  setAdminKey,
  refresh,
  setNotice,
}: {
  payload: StorePayload;
  adminKey: string;
  setAdminKey: (value: string) => void;
  refresh: () => Promise<void>;
  setNotice: (value: string) => void;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [productForm, setProductForm] = useState<ProductFormState>(
    emptyProductForm,
  );
  const [bannerForm, setBannerForm] = useState<BannerFormState>(emptyBannerForm);
  const [settingsForm, setSettingsForm] = useState(
    payload.settings.WHATSAPP_NUMBER,
  );

  useEffect(() => {
    setSettingsForm(payload.settings.WHATSAPP_NUMBER);
  }, [payload.settings.WHATSAPP_NUMBER]);

  function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = code.trim();
    setAdminKey(trimmed);
    window.sessionStorage.setItem(adminStorageKey, trimmed);
    setAdminError('');
  }

  async function adminFetch<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('x-admin-key', adminKey);

    if (options.body && !(options.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });
    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorPayload =
        data && typeof data === 'object'
          ? (data as { error?: unknown })
          : {};
      const message =
        typeof errorPayload.error === 'string'
          ? errorPayload.error
          : 'Nao foi possivel salvar a alteracao.';

      if (response.status === 401) {
        setAdminKey('');
        window.sessionStorage.removeItem(adminStorageKey);
      }

      throw new Error(message);
    }

    return data as T;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAdminError('');

    try {
      const editing = Boolean(productForm.id);
      await adminFetch<{ product: Product }>(
        editing ? `/api/products/${productForm.id}` : '/api/products',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(productInputFromForm(productForm)),
        },
      );
      setProductForm(emptyProductForm());
      setNotice(editing ? 'Produto atualizado.' : 'Produto cadastrado.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAdminError('');

    try {
      const editing = Boolean(bannerForm.id);
      await adminFetch<{ banner: Banner }>(
        editing ? `/api/banners/${bannerForm.id}` : '/api/banners',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(bannerInputFromForm(bannerForm)),
        },
      );
      setBannerForm(emptyBannerForm());
      setNotice(editing ? 'Banner atualizado.' : 'Banner cadastrado.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProductItem(product: Product) {
    if (!window.confirm(`Excluir ${product.name}?`)) {
      return;
    }

    setBusy(true);
    setAdminError('');

    try {
      await adminFetch(`/api/products/${product.id}`, { method: 'DELETE' });
      setNotice('Produto excluido.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel excluir.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteBannerItem(banner: Banner) {
    if (!window.confirm(`Excluir o banner "${banner.title}"?`)) {
      return;
    }

    setBusy(true);
    setAdminError('');

    try {
      await adminFetch(`/api/banners/${banner.id}`, { method: 'DELETE' });
      setNotice('Banner excluido.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel excluir.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(
    product: Product,
    field: 'available' | 'featured' | 'bestseller' | 'giftKit',
  ) {
    setBusy(true);
    setAdminError('');

    try {
      const next = { ...productToForm(product), [field]: !product[field] };
      await adminFetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify(productInputFromForm(next)),
      });
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(
    file: File | undefined,
    apply: (imageUrl: string) => void,
  ) {
    if (!file) {
      return;
    }

    setBusy(true);
    setAdminError('');

    try {
      const data = new FormData();
      data.append('file', file);
      const result = await adminFetch<{ imageUrl: string }>('/api/uploads', {
        method: 'POST',
        body: data,
      });
      apply(result.imageUrl);
      setNotice('Imagem enviada.');
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel enviar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAdminError('');

    try {
      await adminFetch('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({ WHATSAPP_NUMBER: settingsForm }),
      });
      setNotice('WhatsApp atualizado.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Nao foi possivel salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!adminKey) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <form
          onSubmit={unlock}
          className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <Badge variant="outline" className="mb-4 border-primary/35">
            Painel administrativo
          </Badge>
          <h1 className="font-heading text-3xl font-semibold">
            Gerencie a vitrine da loja
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Informe o codigo administrativo para cadastrar produtos, trocar
            imagens, atualizar banners e configurar o WhatsApp.
          </p>
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium">Codigo</span>
            <Input
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite o codigo administrativo"
              className="h-11"
            />
          </label>
          <Button className="mt-5 h-11 w-full">
            Entrar no painel
            <ArrowRight />
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <Badge variant="outline" className="mb-4 border-primary/35">
            Administracao
          </Badge>
          <h1 className="font-heading text-4xl font-semibold">
            Produtos, kits e banners
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Atualize a vitrine sem mexer no codigo. Produtos indisponiveis
            continuam visiveis, mas nao entram na sacola.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setAdminKey('');
            window.sessionStorage.removeItem(adminStorageKey);
          }}
        >
          Sair do painel
        </Button>
      </div>

      {adminError && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {adminError}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            {productForm.id ? 'Editar produto' : 'Cadastrar produto'}
          </h2>
          <form onSubmit={saveProduct} className="mt-5 space-y-4">
            <Field label="Nome">
              <Input
                value={productForm.name}
                onChange={(event) =>
                  setProductForm({ ...productForm, name: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Descricao curta">
              <Textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    description: event.target.value,
                  })
                }
                required
              />
            </Field>
            <Field label="Detalhes do produto">
              <Textarea
                value={productForm.details}
                onChange={(event) =>
                  setProductForm({ ...productForm, details: event.target.value })
                }
                required
                className="min-h-24"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preco">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={(productForm.priceCents / 100).toFixed(2)}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      priceCents: Math.round(Number(event.target.value) * 100),
                    })
                  }
                  required
                />
              </Field>
              <Field label="Categoria">
                <NativeSelect
                  className="w-full"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      category: event.target.value,
                    })
                  }
                >
                  {PRODUCT_CATEGORIES.map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {item}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field label="Imagem">
              <div className="grid gap-3">
                <Input
                  value={productForm.imageUrl}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      imageUrl: event.target.value,
                    })
                  }
                  placeholder="/gk-cuidados.png ou URL da imagem"
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-3 text-sm text-muted-foreground transition hover:bg-primary/10">
                  <ImagePlus className="size-4 text-primary" />
                  Enviar nova imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], (imageUrl) =>
                        setProductForm({ ...productForm, imageUrl }),
                      )
                    }
                  />
                </label>
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchField
                label="Disponivel"
                checked={productForm.available}
                onCheckedChange={(checked) =>
                  setProductForm({ ...productForm, available: checked })
                }
              />
              <SwitchField
                label="Destacar"
                checked={productForm.featured}
                onCheckedChange={(checked) =>
                  setProductForm({ ...productForm, featured: checked })
                }
              />
              <SwitchField
                label="Mais vendido"
                checked={productForm.bestseller}
                onCheckedChange={(checked) =>
                  setProductForm({ ...productForm, bestseller: checked })
                }
              />
              <SwitchField
                label="Kit de presente"
                checked={productForm.giftKit}
                onCheckedChange={(checked) =>
                  setProductForm({ ...productForm, giftKit: checked })
                }
              />
            </div>
            <Field label="Ordem de exibicao">
              <Input
                type="number"
                min="0"
                value={productForm.sortOrder}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    sortOrder: Number(event.target.value),
                  })
                }
              />
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="h-10 flex-1" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {productForm.id ? 'Salvar produto' : 'Cadastrar produto'}
              </Button>
              {productForm.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProductForm(emptyProductForm())}
                >
                  Cancelar edicao
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-2xl font-semibold">
              Produtos cadastrados
            </h2>
            <Badge variant="secondary">{payload.products.length} itens</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {payload.products.map((product) => (
              <div
                key={product.id}
                className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[72px_1fr_auto]"
              >
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-20 w-20 rounded-md object-cover"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <Badge
                      variant={product.available ? 'secondary' : 'destructive'}
                    >
                      {product.available ? 'Disponivel' : 'Indisponivel'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.category} - {formatMoney(product.priceCents)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleProduct(product, 'available')}
                    >
                      <Check className="size-3" />
                      Alternar disponibilidade
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleProduct(product, 'featured')}
                    >
                      <Star className="size-3" />
                      Destacar
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setProductForm(productToForm(product))}
                    aria-label={`Editar ${product.name}`}
                  >
                    <Edit3 />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => deleteProductItem(product)}
                    aria-label={`Excluir ${product.name}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            {bannerForm.id ? 'Editar banner' : 'Gerenciar banners'}
          </h2>
          <form onSubmit={saveBanner} className="mt-5 space-y-4">
            <Field label="Titulo">
              <Input
                value={bannerForm.title}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, title: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Texto">
              <Textarea
                value={bannerForm.subtitle}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, subtitle: event.target.value })
                }
                required
              />
            </Field>
            <Field label="Botao">
              <Input
                value={bannerForm.ctaLabel}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, ctaLabel: event.target.value })
                }
              />
            </Field>
            <Field label="Imagem do banner">
              <div className="grid gap-3">
                <Input
                  value={bannerForm.imageUrl}
                  onChange={(event) =>
                    setBannerForm({ ...bannerForm, imageUrl: event.target.value })
                  }
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-3 text-sm text-muted-foreground transition hover:bg-primary/10">
                  <ImagePlus className="size-4 text-primary" />
                  Enviar imagem do banner
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], (imageUrl) =>
                        setBannerForm({ ...bannerForm, imageUrl }),
                      )
                    }
                  />
                </label>
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchField
                label="Banner ativo"
                checked={bannerForm.active}
                onCheckedChange={(checked) =>
                  setBannerForm({ ...bannerForm, active: checked })
                }
              />
              <Field label="Ordem">
                <Input
                  type="number"
                  min="0"
                  value={bannerForm.sortOrder}
                  onChange={(event) =>
                    setBannerForm({
                      ...bannerForm,
                      sortOrder: Number(event.target.value),
                    })
                  }
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="h-10 flex-1" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {bannerForm.id ? 'Salvar banner' : 'Cadastrar banner'}
              </Button>
              {bannerForm.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBannerForm(emptyBannerForm())}
                >
                  Cancelar edicao
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            Banners da pagina inicial
          </h2>
          <div className="mt-5 space-y-3">
            {payload.banners.map((banner) => (
              <div
                key={banner.id}
                className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[96px_1fr_auto]"
              >
                <img
                  src={banner.imageUrl}
                  alt=""
                  className="h-20 w-24 rounded-md object-cover"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{banner.title}</h3>
                    <Badge variant={banner.active ? 'secondary' : 'outline'}>
                      {banner.active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {banner.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setBannerForm(bannerToForm(banner))}
                    aria-label={`Editar ${banner.title}`}
                  >
                    <Edit3 />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => deleteBannerItem(banner)}
                    aria-label={`Excluir ${banner.title}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-heading text-2xl font-semibold">
          Configuracao do WhatsApp
        </h2>
        <form
          onSubmit={saveSettings}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]"
        >
          <Field label="WHATSAPP_NUMBER">
            <Input
              value={settingsForm}
              onChange={(event) => setSettingsForm(event.target.value)}
              placeholder="Exemplo: 5511999999999"
              className="h-11"
            />
          </Field>
          <Button className="h-11 self-end" disabled={busy}>
            Salvar WhatsApp
          </Button>
        </form>
      </section>
    </main>
  );
}

function ProductBand({
  eyebrow,
  title,
  products,
  fallback,
  onProduct,
  onAdd,
}: {
  eyebrow: string;
  title: string;
  products: Product[];
  fallback: Product[];
  onProduct: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const items = products.length ? products : fallback;

  if (!items.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProduct={onProduct}
            onAdd={onAdd}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
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
    <article className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl">
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
            <Badge className="bg-destructive text-white">Indisponivel</Badge>
          )}
          {product.bestseller && (
            <Badge className="bg-[#2f4f3c] text-white">Mais vendido</Badge>
          )}
        </div>
      </button>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2 border-primary/25">
              {product.category}
            </Badge>
            <h3 className="line-clamp-2 font-heading text-xl font-semibold leading-tight">
              {product.name}
            </h3>
          </div>
          {product.featured && <Star className="size-5 shrink-0 text-primary" />}
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

function QuantityStepper({
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
      <span className="grid place-items-center text-sm font-semibold">{value}</span>
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

function Highlight({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-border py-7 sm:border-r sm:px-6 sm:last:border-r-0">
      <div className="mb-4 inline-grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  actionLabel,
  onAction,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Badge variant="outline" className="mb-3 border-primary/35">
          {eyebrow}
        </Badge>
        <h2 className="font-heading text-3xl font-semibold leading-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
          <ArrowRight />
        </Button>
      )}
    </div>
  );
}

function CategoryPill({
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function SwitchField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function Footer() {
  return (
    <footer className="bg-[#24170f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/gk-logo.png"
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <strong className="font-heading text-lg">{STORE_NAME}</strong>
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">
                Importados e presentes
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/68">
            Uma vitrine preparada para escolher com calma e conversar com a loja
            antes da confirmacao final.
          </p>
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">Atendimento</h2>
          <p className="mt-3 text-sm leading-6 text-white/68">
            Pedidos finalizados pelo WhatsApp. A disponibilidade e a entrega sao
            confirmadas manualmente.
          </p>
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold">Categorias</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.slice(0, 5).map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
