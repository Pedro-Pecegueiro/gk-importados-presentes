'use client';

import type * as React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Edit3,
  ImagePlus,
  Loader2,
  Package,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { StoreLoadingState } from '@/components/store/store-status';
import { useAdminPanel } from '@/hooks/use-admin-panel';
import { priceCentsFromInput } from '@/lib/admin-forms';
import { PRODUCT_CATEGORIES } from '@/lib/store-config';
import {
  formatMoney,
  formatProductCount,
  isPrototypeImage,
} from '@/lib/store-format';
import type { StorePayload } from '@/lib/store-types';

export function AdminView({
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
  const {
    code,
    setCode,
    busy,
    adminError,
    setAdminError,
    productForm,
    setProductForm,
    priceInput,
    setPriceInput,
    adminProductSearch,
    setAdminProductSearch,
    bannerForm,
    setBannerForm,
    settingsForm,
    setSettingsForm,
    visibleAdminProducts,
    availableProductCount,
    featuredProductCount,
    pendingImageCount,
    resetProductForm,
    startProductEdit,
    resetBannerForm,
    startBannerEdit,
    unlock,
    saveProduct,
    saveBanner,
    deleteProductItem,
    deleteBannerItem,
    toggleProduct,
    uploadImage,
    saveSettings,
  } = useAdminPanel({
    payload,
    setAdminAuthenticated,
    refresh,
    setNotice,
  });

  if (adminAuthenticated === null) {
    return <StoreLoadingState />;
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
