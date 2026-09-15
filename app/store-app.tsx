'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Menu,
  MessageCircle,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { AdminView } from '@/components/admin/admin-view';
import { CatalogView } from '@/components/store/catalog-view';
import { HomeView } from '@/components/store/home-view';
import { QuantityStepper } from '@/components/store/product-card';
import { StoreFooter } from '@/components/store/store-footer';
import {
  StoreErrorState,
  StoreLoadingState,
} from '@/components/store/store-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PRODUCT_CATEGORIES, WHATSAPP_NUMBER } from '@/lib/store-config';
import {
  buildWhatsAppOrderMessage,
  calculateCartSubtotal,
  countCartItems,
  resolveCartLines,
  type CartItem,
} from '@/lib/store-cart';
import {
  countProductsByCategory,
  filterCatalogProducts,
} from '@/lib/store-catalog';
import { formatMoney, isPrototypeImage } from '@/lib/store-format';
import type { Product, StorePayload } from '@/lib/store-types';

type StoreAppProps = {
  initialView: 'home' | 'catalog' | 'admin';
  initialProductSlug?: string;
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

function inputRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Entrada inválida.');
  }

  return input as Record<string, unknown>;
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
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [adminAuthenticated, setAdminAuthenticated] = useState<boolean | null>(
    null,
  );
  const [openedInitialProduct, setOpenedInitialProduct] = useState(false);

  async function loadStore() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/store', { cache: 'no-store' });
      const data = (await response.json()) as StorePayload & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível carregar a loja.');
      }

      setPayload(data);
    } catch (storeError) {
      setError(
        storeError instanceof Error
          ? storeError.message
          : 'Não foi possível carregar a loja.',
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

    setCartReady(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkAdminSession() {
      try {
        const response = await fetch('/api/admin/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const data = (await response.json()) as { authenticated?: boolean };

        if (active) {
          setAdminAuthenticated(response.ok && data.authenticated === true);
        }
      } catch {
        if (active) {
          setAdminAuthenticated(false);
        }
      }
    }

    void checkAdminSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cartReady) {
      return;
    }

    window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }, [cart, cartReady]);

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

  useEffect(() => {
    function syncViewWithAddress() {
      const path = window.location.pathname;

      if (path === '/admin') {
        setView('admin');
        setDetailOpen(false);
        return;
      }

      if (path.startsWith('/produto/')) {
        let slug = '';

        try {
          slug = decodeURIComponent(path.slice('/produto/'.length));
        } catch {
          setView('catalog');
          setSelectedProduct(null);
          setDetailOpen(false);
          return;
        }
        const product = products.find((item) => item.slug === slug);

        setView('catalog');
        setSelectedProduct(product ?? null);
        setDetailOpen(Boolean(product));
        return;
      }

      setDetailOpen(false);
      setSelectedProduct(null);
      setView(path === '/catalogo' ? 'catalog' : 'home');
    }

    window.addEventListener('popstate', syncViewWithAddress);
    return () => window.removeEventListener('popstate', syncViewWithAddress);
  }, [products]);

  const banners = useMemo(() => payload?.banners ?? [], [payload?.banners]);
  const activeBanners = banners.filter((banner) => banner.active);
  const heroBanner = activeBanners[0];
  const whatsappNumber =
    payload?.settings.WHATSAPP_NUMBER.replace(/\D/g, '') || WHATSAPP_NUMBER;

  const categoryCounts = useMemo(
    () => countProductsByCategory(products),
    [products],
  );

  const filteredProducts = useMemo(
    () => filterCatalogProducts(products, search, category),
    [category, products, search],
  );

  const featuredProducts = products.filter((product) => product.featured);
  const bestsellerProducts = products.filter((product) => product.bestseller);
  const kitProducts = products.filter((product) => product.giftKit);

  const cartLines = useMemo(
    () => resolveCartLines(cart, products),
    [cart, products],
  );
  const cartCount = countCartItems(cartLines);
  const subtotal = calculateCartSubtotal(cartLines);
  const orderMessage = useMemo(
    () => buildWhatsAppOrderMessage(cartLines),
    [cartLines],
  );

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
      title: 'Ler catálogo GK',
      description:
        'Lista produtos, categorias, disponibilidade e preços visíveis no catálogo da GK Importados e Presentes.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
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
      title: 'Filtrar catálogo GK',
      description:
        'Abre o catálogo visível e aplica uma busca e categoria para o cliente escolher produtos.',
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
      title: 'Adicionar à sacola GK',
      description:
        'Adiciona um produto disponível à sacola usando o identificador do produto e a quantidade desejada.',
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
          throw new Error('Produto não encontrado.');
        }

        if (!product.available) {
          throw new Error('Produto indisponível.');
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

  function openCatalog(nextCategory = 'Todos') {
    setCategory(nextCategory);
    setSearch('');
    setRoute('catalog');
  }

  function openHomeSection(sectionId: string) {
    setView('home');
    setMobileNavOpen(false);
    window.history.pushState(null, '', `/#${sectionId}`);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
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
      setNotice('Produto indisponível no momento.');
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
    setNotice(`${product.name} foi adicionado à sacola.`);
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

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-[#f3f0eb] text-foreground">
        <header className="border-b border-border bg-[#24170f] text-white">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="/gk-logo.png"
                alt="Logo GK Importados e Presentes"
                className="h-12 w-12 rounded-full border border-white/20 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-heading text-lg font-bold">
                  Painel GK
                </p>
                <p className="truncate text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  Área administrativa
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => setRoute('home')}
            >
              <Store />
              <span className="hidden sm:inline">Ver loja</span>
            </Button>
          </div>
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
          <StoreLoadingState />
        ) : error ? (
          <StoreErrorState message={error} onRetry={loadStore} />
        ) : payload ? (
          <AdminView
            payload={payload}
            adminAuthenticated={adminAuthenticated}
            setAdminAuthenticated={setAdminAuthenticated}
            refresh={loadStore}
            setNotice={setNotice}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 shadow-[0_8px_30px_rgb(55_33_19/6%)] backdrop-blur-xl">
        <div className="bg-[#2f4f3c] text-white">
          <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold sm:justify-between sm:px-6 lg:px-8">
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="size-3.5" />
              Atendimento personalizado pelo WhatsApp
            </span>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                'Olá! Gostaria de receber atendimento personalizado da GK Importados e Presentes.',
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 underline decoration-white/40 underline-offset-4 transition hover:decoration-white sm:inline-flex"
            >
              Falar com a loja
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="group flex min-w-0 items-center gap-3 text-left"
            aria-label="Ir para a página inicial"
          >
            <img
              src="/gk-logo.png"
              alt="Logo GK Importados e Presentes"
              className="h-12 w-12 rounded-full border border-primary/25 object-cover shadow-[0_0_22px_rgb(181_126_62/24%)] transition group-hover:scale-105"
            />
            <span className="hidden min-w-0 sm:block">
              <strong className="block font-heading text-lg font-bold leading-tight text-foreground">
                GK Importados
              </strong>
              <strong className="mt-0.5 block text-[13px] font-black uppercase tracking-[0.16em] text-foreground/75">
                E PRESENTES
              </strong>
            </span>
          </button>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Principal"
          >
            <Button
              variant={view === 'home' ? 'secondary' : 'ghost'}
              onClick={() => setRoute('home')}
            >
              Início
            </Button>
            <Button
              variant={view === 'catalog' ? 'secondary' : 'ghost'}
              onClick={() => openCatalog()}
            >
              Catálogo
            </Button>
            <Button variant="ghost" onClick={() => openHomeSection('sobre')}>
              Sobre nós
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
                Início
              </Button>
              <Button variant="secondary" onClick={() => openCatalog()}>
                Catálogo
              </Button>
              <Button
                variant="secondary"
                onClick={() => openHomeSection('sobre')}
              >
                Sobre nós
              </Button>
            </div>
          </div>
        )}
      </header>

      {notice && (
        <div className="fixed left-1/2 top-32 z-50 w-[min(92vw,440px)] -translate-x-1/2 rounded-lg border border-primary/25 bg-card px-4 py-3 text-sm shadow-xl">
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
        <StoreLoadingState />
      ) : error ? (
        <StoreErrorState message={error} onRetry={loadStore} />
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
              onCatalog={() => openCatalog()}
              onCatalogCategory={openCatalog}
              onAbout={() => openHomeSection('sobre')}
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

          {payload && <StoreFooter whatsappNumber={whatsappNumber} />}
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
              Sua sacola ainda não é um pedido. Envie os itens para receber a
              confirmação da loja.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5">
            {cartLines.length === 0 ? (
              <div className="flex min-h-80 flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-4 size-10 text-muted-foreground" />
                <h2 className="font-heading text-lg font-semibold">
                  Sua sacola está vazia
                </h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Adicione os produtos que deseja consultar. A confirmação
                  acontece diretamente pelo WhatsApp.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => {
                    setCartOpen(false);
                    setRoute('catalog');
                  }}
                >
                  Ver catálogo
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
              <span>Total dos produtos</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <Button
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={cartLines.length === 0}
              onClick={openWhatsAppOrder}
            >
              <MessageCircle />
              Enviar pedido pelo WhatsApp
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              Disponibilidade, entrega e pagamento serão confirmados no
              atendimento.
            </p>
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
                    Indisponível
                  </Badge>
                )}
                {isPrototypeImage(selectedProduct.imageUrl) && (
                  <span className="absolute bottom-4 left-4 rounded-md bg-[#24170f]/88 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                    Imagem ilustrativa
                  </span>
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

                <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {selectedProduct.details}
                </p>

                {isPrototypeImage(selectedProduct.imageUrl) && (
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    Consulte pelo WhatsApp a apresentação disponível deste
                    produto.
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Preço</span>
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
          'Olá! Gostaria de saber mais sobre os produtos da GK Importados e Presentes.',
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
