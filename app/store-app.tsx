'use client';

import type * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Check,
  Edit3,
  Gift,
  HeartHandshake,
  ImagePlus,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  PRODUCT_CATEGORIES,
  STORE_ADDRESS,
  STORE_CONTACT_COPY,
  STORE_MAP_URL,
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

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatMoney(cents: number) {
  return money.format(cents / 100);
}

function formatProductCount(count: number) {
  return `${count} ${count === 1 ? 'produto' : 'produtos'}`;
}

function isPrototypeImage(imageUrl: string) {
  return imageUrl === '/gk-cuidados.png' || imageUrl === '/gk-kit-presente.png';
}

function formatWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.startsWith('55') ? digits.slice(2) : digits;

  if (localNumber.length === 11) {
    return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2, 7)}-${localNumber.slice(7)}`;
  }

  return value;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inputRecord(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Entrada inválida.');
  }

  return input as Record<string, unknown>;
}

function emptyProductForm(sortOrder = 100): ProductFormState {
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
    sortOrder,
  };
}

function emptyBannerForm(): BannerFormState {
  return {
    title: '',
    subtitle: '',
    ctaLabel: 'Ver catálogo',
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

function priceInputFromCents(priceCents: number) {
  return priceCents > 0 ? (priceCents / 100).toFixed(2).replace('.', ',') : '';
}

function priceCentsFromInput(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const amount = Number.parseFloat(normalized);

  return Number.isFinite(amount) ? Math.max(Math.round(amount * 100), 0) : 0;
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
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      );
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
      return 'Olá! Gostaria de saber mais sobre os produtos da GK Importados e Presentes.';
    }

    const productLines = cartLines
      .map(
        (line, index) =>
          `${index + 1}. *${line.product.name}*\n   Quantidade: ${line.quantity}\n   Valor unitário: ${formatMoney(
            line.product.priceCents,
          )}\n   Subtotal: ${formatMoney(
            line.product.priceCents * line.quantity,
          )}`,
      )
      .join('\n\n');

    return `Olá! Gostaria de solicitar estes produtos da *GK Importados e Presentes*:\n\n*MEU PEDIDO*\n\n${productLines}\n\n*TOTAL DOS PRODUTOS: ${formatMoney(
      subtotal,
    )}*\n\nPor favor, confirme a disponibilidade e me informe as opções de entrega e pagamento.`;
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
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={loadStore} />
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

          {payload && <Footer whatsappNumber={whatsappNumber} />}
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

                <p className="mt-5 text-sm leading-7 text-muted-foreground">
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

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4">
      <div className="max-w-md rounded-lg border border-destructive/20 bg-card p-6 text-center shadow-sm">
        <h1 className="font-heading text-xl font-semibold">
          Não foi possível abrir a loja
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
  onCatalogCategory,
  onAbout,
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
  onCatalogCategory: (category: string) => void;
  onAbout: () => void;
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
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(31_18_12/94%),rgb(31_18_12/72%)_42%,rgb(31_18_12/20%))]" />
        <div className="mx-auto flex min-h-[72svh] max-w-7xl items-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
              <HeartHandshake className="size-4 text-[#e0b46f]" />
              {heroBanner?.title ??
                'Atendimento humano do início à confirmação'}
            </div>
            <h1 className="font-heading text-5xl font-bold leading-[0.95] drop-shadow-sm sm:text-6xl lg:text-7xl">
              {STORE_NAME}
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/88">
              {heroBanner?.subtitle ??
                'Perfumes, cosméticos, acessórios, chocolates e kits com atendimento direto pelo WhatsApp.'}
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/72 sm:text-base">
              Escolha na vitrine e conte com a GK para confirmar
              disponibilidade, entrega e pagamento antes de concluir.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-11 bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                onClick={onCatalog}
              >
                {heroBanner?.ctaLabel ?? 'Explorar produtos'}
                <ArrowRight />
              </Button>
              <Button
                variant="outline"
                className="h-11 border-white/35 bg-white/8 px-5 text-white hover:bg-white/18 hover:text-white"
                onClick={onAbout}
              >
                Conhecer a GK
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          <Highlight
            icon={<Sparkles />}
            title="Curadoria para escolher melhor"
            text="Uma seleção cuidadosa de perfumaria, autocuidado e presentes."
          />
          <Highlight
            icon={<MessageCircle />}
            title="Atendimento humano no WhatsApp"
            text="Tire dúvidas e confirme cada detalhe diretamente com a loja."
          />
          <Highlight
            icon={<ShieldCheck />}
            title="Originalidade e procedência"
            text="Produtos autênticos, selecionados com responsabilidade e cuidado."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Categorias"
          title="Encontre pelo tipo de presente"
          actionLabel="Abrir catálogo"
          onAction={onCatalog}
        />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCatalogCategory(item)}
              className="group flex min-h-32 items-start justify-between rounded-lg border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/[0.035] hover:shadow-lg"
            >
              <span>
                <span className="block font-heading text-xl font-bold">
                  {item}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {formatProductCount(categoryCounts.get(item) ?? 0)}
                </span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Package className="size-5" />
              </span>
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
              Cestas prontas
            </Badge>
            <h2 className="font-heading text-4xl font-semibold leading-tight text-[#2f2118]">
              Cestas prontas para surpreender com cuidado.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#684f3f]">
              Escolha uma de nossas cestas prontas. A loja recebe o pedido no
              WhatsApp e confirma tudo antes da finalização.
            </p>
            <Button
              className="mt-7 w-fit"
              onClick={() => onCatalogCategory('Kits de presente')}
            >
              Ver cestas prontas
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

      <AboutSection />
    </main>
  );
}

function AboutSection() {
  return (
    <section
      id="sobre"
      className="scroll-mt-32 border-y border-[#2f4f3c]/15 bg-[#f4f7f3]"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <div className="mb-7 flex items-center gap-4">
              <img
                src="/gk-logo.png"
                alt="Logo da GK Importados e Presentes"
                className="size-16 rounded-full border border-primary/30 object-cover shadow-[0_12px_35px_rgb(55_33_19/15%)]"
              />
              <div className="h-px flex-1 bg-[#2f4f3c]/20" />
            </div>
            <h2 className="font-heading text-4xl font-bold leading-tight text-[#24170f] sm:text-5xl">
              Sobre a GK Importados e Presentes
            </h2>
            <p className="mt-6 text-base leading-8 text-[#493b32]">
              Bem-vindo à GK Importados e Presentes, sua vitrine digital
              exclusiva de perfumaria e presentes. Nascida em Suzano, São Paulo,
              nossa loja tem como maior paixão conectar pessoas através de
              fragrâncias marcantes e opções de presentes que criam memórias
              inesquecíveis.
            </p>
            <p className="mt-5 text-base leading-8 text-[#493b32]">
              Sabemos que escolher um perfume importado ou o presente ideal
              exige confiança. Por isso, não somos apenas um site comum.
              Trabalhamos com um modelo de{' '}
              <strong className="font-bold text-[#24170f]">
                curadoria e atendimento humanizado
              </strong>
              . Aqui, a sua escolha na vitrine se transforma em um atendimento
              VIP pelo WhatsApp. Você não fala com robôs; nós cuidamos do seu
              pedido de ponta a ponta, atuando como verdadeiros consultores para
              garantir que sua escolha seja perfeita.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-2xl font-bold text-[#24170f] sm:text-3xl">
              O nosso compromisso com você:
            </h3>
            <ul className="mt-6 grid gap-4">
              <li className="grid gap-4 rounded-lg border border-[#2f4f3c]/18 bg-white p-5 shadow-[0_10px_30px_rgb(47_79_60/7%)] sm:grid-cols-[44px_1fr]">
                <span className="grid size-11 place-items-center rounded-lg bg-[#2f4f3c] text-white">
                  <ShieldCheck className="size-5" />
                </span>
                <p className="text-sm leading-7 text-[#493b32] sm:text-base">
                  <strong className="font-bold text-[#24170f]">
                    100% de Originalidade:
                  </strong>{' '}
                  Trabalhamos exclusivamente com produtos autênticos e de
                  procedência garantida. O respeito por você e pela alta
                  perfumaria é inegociável.
                </p>
              </li>
              <li className="grid gap-4 rounded-lg border border-[#2f4f3c]/18 bg-white p-5 shadow-[0_10px_30px_rgb(47_79_60/7%)] sm:grid-cols-[44px_1fr]">
                <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <MessageCircle className="size-5" />
                </span>
                <p className="text-sm leading-7 text-[#493b32] sm:text-base">
                  <strong className="font-bold text-[#24170f]">
                    Atendimento Personalizado:
                  </strong>{' '}
                  Da dúvida sobre uma nota olfativa até o cálculo do envio,
                  nossa comunicação direta pelo WhatsApp garante transparência
                  total e segurança antes de qualquer pagamento.
                </p>
              </li>
              <li className="grid gap-4 rounded-lg border border-[#2f4f3c]/18 bg-white p-5 shadow-[0_10px_30px_rgb(47_79_60/7%)] sm:grid-cols-[44px_1fr]">
                <span className="grid size-11 place-items-center rounded-lg bg-[#24170f] text-[#e0b46f]">
                  <Gift className="size-5" />
                </span>
                <p className="text-sm leading-7 text-[#493b32] sm:text-base">
                  <strong className="font-bold text-[#24170f]">
                    Cuidado em Cada Detalhe:
                  </strong>{' '}
                  Preparamos cada encomenda com dedicação extrema, para que a
                  experiência de receber ou presentear alguém seja impecável
                  desde a embalagem.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-l-4 border-[#e0b46f] bg-[#2f4f3c] px-6 py-7 text-white sm:px-8">
          <p className="max-w-5xl text-base leading-8 text-white/88">
            Acreditamos que a confiança se constrói com proximidade. Convidamos
            você a acompanhar nossos bastidores, as novidades e a satisfação de
            quem já comprou conosco através do nosso Instagram:{' '}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#f2ca88] underline decoration-[#f2ca88]/45 underline-offset-4 transition hover:text-white"
            >
              {INSTAGRAM_HANDLE}
              <ArrowUpRight className="size-4" />
            </a>
            .
          </p>
          <p className="mt-3 max-w-5xl text-base font-semibold leading-8 text-white">
            Explore nossa seleção, adicione seus favoritos à sacola e nos chame.
            Será um prazer ajudar você a encontrar a fragrância ou o presente
            ideal.
          </p>
        </div>
      </div>
    </section>
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
            Catálogo
          </Badge>
          <h1 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">
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
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="Pesquisar por perfume, body splash ou kit..."
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
  adminAuthenticated,
  setAdminAuthenticated,
  refresh,
  setNotice,
}: {
  payload: StorePayload;
  adminAuthenticated: boolean | null;
  setAdminAuthenticated: (value: boolean) => void;
  refresh: () => Promise<void>;
  setNotice: (value: string) => void;
}) {
  const suggestedProductSortOrder = Math.min(
    Math.max(0, ...payload.products.map((product) => product.sortOrder)) + 10,
    9999,
  );
  const suggestedBannerSortOrder = Math.min(
    Math.max(0, ...payload.banners.map((banner) => banner.sortOrder)) + 10,
    9999,
  );
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [productForm, setProductForm] = useState<ProductFormState>(() =>
    emptyProductForm(suggestedProductSortOrder),
  );
  const [priceInput, setPriceInput] = useState('');
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [bannerForm, setBannerForm] = useState<BannerFormState>(() => ({
    ...emptyBannerForm(),
    sortOrder: suggestedBannerSortOrder,
  }));
  const [settingsForm, setSettingsForm] = useState(
    payload.settings.WHATSAPP_NUMBER,
  );

  useEffect(() => {
    setSettingsForm(payload.settings.WHATSAPP_NUMBER);
  }, [payload.settings.WHATSAPP_NUMBER]);

  const normalizedAdminSearch = normalizeText(adminProductSearch.trim());
  const visibleAdminProducts = payload.products.filter((product) =>
    normalizeText(`${product.name} ${product.category}`).includes(
      normalizedAdminSearch,
    ),
  );
  const availableProductCount = payload.products.filter(
    (product) => product.available,
  ).length;
  const featuredProductCount = payload.products.filter(
    (product) => product.featured,
  ).length;
  const pendingImageCount = payload.products.filter((product) =>
    isPrototypeImage(product.imageUrl),
  ).length;

  function resetProductForm(nextOrder = suggestedProductSortOrder) {
    setProductForm(emptyProductForm(nextOrder));
    setPriceInput('');
  }

  function startProductEdit(product: Product) {
    setProductForm(productToForm(product));
    setPriceInput(priceInputFromCents(product.priceCents));
    window.setTimeout(() => {
      document.getElementById('formulario-produto')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  function resetBannerForm(nextOrder = suggestedBannerSortOrder) {
    setBannerForm({ ...emptyBannerForm(), sortOrder: nextOrder });
  }

  function startBannerEdit(banner: Banner) {
    setBannerForm(bannerToForm(banner));
    window.setTimeout(() => {
      document.getElementById('formulario-banner')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  async function unlock(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAdminError('');

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: code }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        authenticated?: boolean;
        error?: string;
      };

      if (!response.ok || data.authenticated !== true) {
        throw new Error(data.error || 'Não foi possível entrar no painel.');
      }

      setCode('');
      setAdminAuthenticated(true);
    } catch (error) {
      setAdminAuthenticated(false);
      setAdminError(
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar no painel.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function adminFetch<T>(
    url: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);

    if (options.body && !(options.body instanceof FormData)) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorPayload =
        data && typeof data === 'object' ? (data as { error?: unknown }) : {};
      const message =
        typeof errorPayload.error === 'string'
          ? errorPayload.error
          : 'Não foi possível salvar a alteração.';

      if (response.status === 401) {
        setAdminAuthenticated(false);
      }

      throw new Error(message);
    }

    return data as T;
  }

  async function saveProduct(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (productForm.priceCents <= 0) {
      setAdminError('Informe um preço maior que zero para o produto.');
      return;
    }

    setBusy(true);
    setAdminError('');

    try {
      const editing = Boolean(productForm.id);
      const result = await adminFetch<{ product: Product }>(
        editing ? `/api/products/${productForm.id}` : '/api/products',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(productInputFromForm(productForm)),
        },
      );
      resetProductForm(
        editing
          ? suggestedProductSortOrder
          : Math.min(result.product.sortOrder + 10, 9999),
      );
      setNotice(editing ? 'Produto atualizado.' : 'Produto cadastrado.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveBanner(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAdminError('');

    try {
      const editing = Boolean(bannerForm.id);
      const result = await adminFetch<{ banner: Banner }>(
        editing ? `/api/banners/${bannerForm.id}` : '/api/banners',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(bannerInputFromForm(bannerForm)),
        },
      );
      setBannerForm({
        ...emptyBannerForm(),
        sortOrder: editing
          ? suggestedBannerSortOrder
          : Math.min(result.banner.sortOrder + 10, 9999),
      });
      setNotice(editing ? 'Banner atualizado.' : 'Banner cadastrado.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Não foi possível salvar.',
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
      setNotice('Produto excluído.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Não foi possível excluir.',
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
      setNotice('Banner excluído.');
      await refresh();
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : 'Não foi possível excluir.',
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
        error instanceof Error ? error.message : 'Não foi possível atualizar.',
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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAdminError('Use uma imagem JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setAdminError('A imagem deve ter até 4 MB.');
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
        error instanceof Error ? error.message : 'Não foi possível enviar.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: React.SyntheticEvent<HTMLFormElement>) {
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
        error instanceof Error ? error.message : 'Não foi possível salvar.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (adminAuthenticated === null) {
    return <LoadingState />;
  }

  if (!adminAuthenticated) {
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
            Informe o código administrativo para cadastrar produtos, trocar
            imagens, atualizar banners e configurar o WhatsApp.
          </p>
          <label className="mt-6 block">
            <span className="mb-2 block text-sm font-medium">
              Senha administrativa
            </span>
            <Input
              type="password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
              className="h-11"
            />
          </label>
          {adminError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {adminError}
            </div>
          )}
          <Button
            type="submit"
            className="mt-5 h-11 w-full"
            disabled={busy || !code}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                Entrar no painel
                <ArrowRight />
              </>
            )}
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
            Administração
          </Badge>
          <h1 className="font-heading text-4xl font-semibold">
            Gerencie a vitrine da loja
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cadastre produtos, atualize fotos e escolha o que deve aparecer em
            destaque para os clientes.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await fetch('/api/admin/session', {
                method: 'DELETE',
                credentials: 'same-origin',
              });
            } finally {
              setAdminAuthenticated(false);
            }
          }}
        >
          Sair do painel
        </Button>
      </div>

      <div
        className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Resumo da vitrine"
      >
        <AdminMetric
          icon={<Package />}
          label="Produtos"
          value={payload.products.length}
        />
        <AdminMetric
          icon={<Check />}
          label="Disponíveis"
          value={availableProductCount}
        />
        <AdminMetric
          icon={<Star />}
          label="Em destaque"
          value={featuredProductCount}
        />
        <AdminMetric
          icon={<ImagePlus />}
          label="Fotos provisórias"
          value={pendingImageCount}
        />
      </div>

      {adminError && (
        <div className="fixed left-1/2 top-24 z-50 flex w-[min(92vw,520px)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-xl">
          <span>{adminError}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setAdminError('')}
            aria-label="Fechar erro"
          >
            <X />
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section
          id="formulario-produto"
          className="scroll-mt-24 rounded-lg border border-border bg-card p-5 shadow-sm"
        >
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
                maxLength={120}
              />
            </Field>
            <Field label="Descrição curta">
              <Textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    description: event.target.value,
                  })
                }
                required
                maxLength={240}
              />
            </Field>
            <Field label="Detalhes do produto">
              <Textarea
                value={productForm.details}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    details: event.target.value,
                  })
                }
                required
                maxLength={900}
                className="min-h-24"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Preço">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={priceInput}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPriceInput(value);
                      setProductForm({
                        ...productForm,
                        priceCents: priceCentsFromInput(value),
                      });
                    }}
                    placeholder="0,00"
                    className="pl-10"
                    required
                  />
                </div>
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
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={productForm.imageUrl}
                    alt="Pré-visualização do produto"
                    className="h-full w-full object-cover"
                  />
                  {isPrototypeImage(productForm.imageUrl) && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-[#24170f]/88 px-2.5 py-1 text-xs font-semibold text-white">
                      Foto provisória
                    </span>
                  )}
                </div>
                <Input
                  value={productForm.imageUrl}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      imageUrl: event.target.value,
                    })
                  }
                  placeholder="/gk-cuidados.png ou URL da imagem"
                  maxLength={500}
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-3 text-sm text-muted-foreground transition hover:bg-primary/10">
                  <ImagePlus className="size-4 text-primary" />
                  {busy ? 'Enviando ou salvando...' : 'Enviar nova imagem'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], (imageUrl) =>
                        setProductForm((current) => ({
                          ...current,
                          imageUrl,
                        })),
                      )
                    }
                  />
                </label>
                <p className="text-xs leading-5 text-muted-foreground">
                  Use JPG, PNG ou WebP de até 4 MB. Prefira uma foto vertical,
                  bem iluminada e sem textos sobre o produto.
                </p>
              </div>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchField
                label="Disponível"
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
            <Field label="Ordem de exibição (opcional)">
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
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                Números menores aparecem primeiro. O próximo valor sugerido já
                foi preenchido para você.
              </span>
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="h-10 flex-1" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {productForm.id ? 'Salvar produto' : 'Cadastrar produto'}
              </Button>
              {productForm.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetProductForm()}
                >
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold">
                Produtos cadastrados
              </h2>
              <Badge variant="secondary">
                {formatProductCount(visibleAdminProducts.length)}
              </Badge>
            </div>
            <label className="relative block">
              <span className="sr-only">Buscar produto cadastrado</span>
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={adminProductSearch}
                onChange={(event) => setAdminProductSearch(event.target.value)}
                placeholder="Buscar por nome ou categoria..."
                className="pl-9"
              />
            </label>
          </div>
          <div className="mt-5 space-y-3">
            {visibleAdminProducts.map((product) => (
              <div
                key={product.id}
                className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[72px_1fr_auto]"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-md">
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {isPrototypeImage(product.imageUrl) && (
                    <span className="absolute inset-x-0 bottom-0 bg-[#24170f]/85 py-0.5 text-center text-[9px] font-bold text-white">
                      PROVISÓRIA
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <Badge
                      variant={product.available ? 'secondary' : 'destructive'}
                    >
                      {product.available ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.category} · {formatMoney(product.priceCents)} ·
                    Ordem {product.sortOrder}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleProduct(product, 'available')}
                    >
                      <Check className="size-3" />
                      {product.available
                        ? 'Marcar indisponível'
                        : 'Marcar disponível'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleProduct(product, 'featured')}
                    >
                      <Star className="size-3" />
                      {product.featured
                        ? 'Remover destaque'
                        : 'Colocar em destaque'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => startProductEdit(product)}
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
            {visibleAdminProducts.length === 0 && (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                <Search className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">
                  Nenhum produto encontrado
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tente buscar por outro nome ou categoria.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section
          id="formulario-banner"
          className="scroll-mt-24 rounded-lg border border-border bg-card p-5 shadow-sm"
        >
          <h2 className="font-heading text-2xl font-semibold">
            {bannerForm.id ? 'Editar banner' : 'Cadastrar banner'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O título, o texto, o botão e a imagem aparecem no destaque principal
            da página inicial.
          </p>
          <form onSubmit={saveBanner} className="mt-5 space-y-4">
            <Field label="Título">
              <Input
                value={bannerForm.title}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, title: event.target.value })
                }
                required
                maxLength={120}
              />
            </Field>
            <Field label="Texto">
              <Textarea
                value={bannerForm.subtitle}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, subtitle: event.target.value })
                }
                required
                maxLength={280}
              />
            </Field>
            <Field label="Texto do botão">
              <Input
                value={bannerForm.ctaLabel}
                onChange={(event) =>
                  setBannerForm({ ...bannerForm, ctaLabel: event.target.value })
                }
                maxLength={40}
              />
            </Field>
            <Field label="Imagem do banner">
              <div className="grid gap-3">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={bannerForm.imageUrl}
                    alt="Pré-visualização do banner"
                    className="h-full w-full object-cover"
                  />
                  {isPrototypeImage(bannerForm.imageUrl) && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-[#24170f]/88 px-2.5 py-1 text-xs font-semibold text-white">
                      Foto provisória
                    </span>
                  )}
                </div>
                <Input
                  value={bannerForm.imageUrl}
                  onChange={(event) =>
                    setBannerForm({
                      ...bannerForm,
                      imageUrl: event.target.value,
                    })
                  }
                  maxLength={500}
                />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-3 text-sm text-muted-foreground transition hover:bg-primary/10">
                  <ImagePlus className="size-4 text-primary" />
                  {busy ? 'Enviando ou salvando...' : 'Enviar imagem do banner'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={busy}
                    onChange={(event) =>
                      uploadImage(event.target.files?.[0], (imageUrl) =>
                        setBannerForm((current) => ({
                          ...current,
                          imageUrl,
                        })),
                      )
                    }
                  />
                </label>
                <p className="text-xs leading-5 text-muted-foreground">
                  Use uma imagem horizontal JPG, PNG ou WebP de até 4 MB, sem
                  textos importantes nas bordas.
                </p>
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
                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                  Se houver mais de um banner ativo, o menor número aparece
                  primeiro.
                </span>
              </Field>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="h-10 flex-1" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {bannerForm.id ? 'Salvar banner' : 'Cadastrar banner'}
              </Button>
              {bannerForm.id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetBannerForm()}
                >
                  Cancelar edição
                </Button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-2xl font-semibold">
            Banners da página inicial
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O banner ativo com a menor ordem é exibido primeiro.
          </p>
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    Ordem {banner.sortOrder} · Botão: {banner.ctaLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => startBannerEdit(banner)}
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
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Configuração do WhatsApp
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Este número recebe os pedidos enviados pela sacola.
            </p>
          </div>
          <a
            href={`https://wa.me/${settingsForm.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80"
          >
            Testar número
            <ArrowUpRight className="size-4" />
          </a>
        </div>
        <form
          onSubmit={saveSettings}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]"
        >
          <Field label="Número do WhatsApp">
            <Input
              value={settingsForm}
              onChange={(event) => setSettingsForm(event.target.value)}
              placeholder="Exemplo: 5511999999999"
              inputMode="numeric"
              maxLength={24}
              required
              className="h-11"
            />
          </Field>
          <Button type="submit" className="h-11 self-end" disabled={busy}>
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

function AdminMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span>
        <strong className="block font-heading text-2xl leading-none">
          {value}
        </strong>
        <span className="mt-1 block text-xs font-medium text-muted-foreground sm:text-sm">
          {label}
        </span>
      </span>
    </div>
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

function Footer({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer className="border-t border-[#c99552]/35 bg-[#24170f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/gk-logo.png"
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <strong className="font-heading text-lg font-bold">
                {STORE_NAME}
              </strong>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/65">
                Importados e presentes
              </p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-base font-bold">
            Contato e localização
          </h2>
          <div className="mt-3 space-y-3 text-sm text-white/78">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <AtSign className="size-4 shrink-0" />
              <span>{INSTAGRAM_HANDLE}</span>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>WhatsApp: {formatWhatsAppNumber(whatsappNumber)}</span>
            </a>
            <address className="not-italic">
              <a
                href={STORE_MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2 leading-6 transition hover:text-white"
              >
                <MapPin className="mt-1 size-4 shrink-0" />
                <span>{STORE_ADDRESS}</span>
              </a>
            </address>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-base font-bold">Categorias</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => (
              <span
                key={category}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
              >
                {category}
              </span>
            ))}
          </div>
          <a
            href="/#sobre"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f2ca88] transition hover:text-white"
          >
            Sobre a GK Importados e Presentes
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
