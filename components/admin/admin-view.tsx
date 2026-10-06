'use client';

import type * as React from 'react';
import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Edit3,
  ImagePlus,
  Loader2,
  MessageCircle,
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
import { PRODUCT_CATEGORIES, STORE_NAME } from '@/lib/store-config';
import {
  formatMoney,
  formatProductCount,
  isPrototypeImage,
} from '@/lib/store-format';
import type { StorePayload } from '@/lib/store-types';

type AdminSection = 'products' | 'banner' | 'contact';

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
  const [activeSection, setActiveSection] = useState<AdminSection>('products');
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
            Informe sua senha administrativa para cadastrar produtos, trocar
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
            <div
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
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
    <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end md:pb-8">
        <div>
          <Badge variant="outline" className="mb-4 border-primary/35">
            Administração
          </Badge>
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">
            Gerencie a vitrine da loja
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cadastre produtos, atualize fotos e escolha o que deve aparecer em
            destaque para os clientes.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full md:w-auto"
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

      {adminError && (
        <div
          className="fixed left-1/2 top-24 z-50 flex w-[min(92vw,520px)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm text-destructive shadow-xl"
          role="alert"
        >
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

      <nav
        className="sticky top-[76px] z-30 mt-6 grid grid-cols-3 gap-1 rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur sm:static sm:gap-2 sm:p-2"
        aria-label="Áreas do painel"
      >
        <AdminSectionButton
          active={activeSection === 'products'}
          icon={<Package />}
          label="Produtos"
          onClick={() => setActiveSection('products')}
        />
        <AdminSectionButton
          active={activeSection === 'banner'}
          icon={<ImagePlus />}
          label="Banner"
          onClick={() => setActiveSection('banner')}
        />
        <AdminSectionButton
          active={activeSection === 'contact'}
          icon={<MessageCircle />}
          label="WhatsApp"
          onClick={() => setActiveSection('contact')}
        />
      </nav>

      {activeSection === 'products' && (
        <>
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
            <section
              id="formulario-produto"
              className="scroll-mt-40 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <h2 className="font-heading text-2xl font-semibold">
                {productForm.id ? 'Editar produto' : 'Cadastrar produto'}
              </h2>
              <form onSubmit={saveProduct} className="mt-5 space-y-4">
                <Field label="Nome">
                  <Input
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm({
                        ...productForm,
                        name: event.target.value,
                      })
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
                        width={800}
                        height={500}
                        decoding="async"
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
                      Use JPG, PNG ou WebP de até 4 MB. Prefira uma foto
                      vertical, bem iluminada e sem textos sobre o produto.
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
                    Números menores aparecem primeiro. O próximo valor sugerido
                    já foi preenchido para você.
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

            <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
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
                    onChange={(event) =>
                      setAdminProductSearch(event.target.value)
                    }
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
                        width={160}
                        height={160}
                        loading="lazy"
                        decoding="async"
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
                          variant={
                            product.available ? 'secondary' : 'destructive'
                          }
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
                          className="inline-flex min-h-10 items-center gap-1 rounded-md px-1.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          onClick={() => toggleProduct(product, 'available')}
                        >
                          <Check className="size-3" />
                          {product.available
                            ? 'Marcar indisponível'
                            : 'Marcar disponível'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center gap-1 rounded-md px-1.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
        </>
      )}

      {activeSection === 'banner' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
          <section
            id="formulario-banner"
            className="scroll-mt-40 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <h2 className="font-heading text-2xl font-semibold">
              {bannerForm.id ? 'Editar banner principal' : 'Novo banner'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Altere a foto e os textos do destaque que aparece no início do
              site. A prévia abaixo mostra como o conteúdo ficará.
            </p>
            <form onSubmit={saveBanner} className="mt-5 space-y-4">
              <Field label="Frase de destaque">
                <Input
                  value={bannerForm.title}
                  onChange={(event) =>
                    setBannerForm({ ...bannerForm, title: event.target.value })
                  }
                  required
                  maxLength={120}
                  placeholder="Exemplo: Presentes elegantes para cada ocasião"
                />
              </Field>
              <Field label="Texto principal">
                <Textarea
                  value={bannerForm.subtitle}
                  onChange={(event) =>
                    setBannerForm({
                      ...bannerForm,
                      subtitle: event.target.value,
                    })
                  }
                  required
                  maxLength={280}
                  className="min-h-24"
                />
              </Field>
              <Field label="Texto complementar">
                <Textarea
                  value={bannerForm.supportingText}
                  onChange={(event) =>
                    setBannerForm({
                      ...bannerForm,
                      supportingText: event.target.value,
                    })
                  }
                  required
                  maxLength={320}
                  className="min-h-24"
                />
              </Field>
              <Field label="Texto do botão">
                <Input
                  value={bannerForm.ctaLabel}
                  onChange={(event) =>
                    setBannerForm({
                      ...bannerForm,
                      ctaLabel: event.target.value,
                    })
                  }
                  maxLength={40}
                />
              </Field>
              <Field label="Imagem do banner">
                <div className="grid gap-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-[#2b1b12] text-white sm:aspect-[16/9]">
                    <img
                      src={bannerForm.imageUrl}
                      alt="Pré-visualização do banner"
                      width={960}
                      height={540}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(31_18_12/94%),rgb(31_18_12/65%)_60%,rgb(31_18_12/20%))]" />
                    <div className="absolute inset-0 flex max-w-[88%] flex-col justify-center p-4 sm:max-w-[68%] sm:p-6">
                      <span className="w-fit rounded-full border border-white/30 bg-black/20 px-2 py-1 text-[9px] font-bold sm:text-[10px]">
                        {bannerForm.title}
                      </span>
                      <strong className="mt-3 font-heading text-2xl leading-none sm:text-3xl">
                        {STORE_NAME}
                      </strong>
                      <span className="mt-3 text-xs font-semibold leading-5 sm:text-sm">
                        {bannerForm.subtitle}
                      </span>
                      <span className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/75 sm:text-xs">
                        {bannerForm.supportingText}
                      </span>
                      <span className="mt-3 w-fit rounded-md bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground sm:text-xs">
                        {bannerForm.ctaLabel}
                      </span>
                    </div>
                    {isPrototypeImage(bannerForm.imageUrl) && (
                      <span className="absolute right-2 top-2 rounded-md bg-[#24170f]/88 px-2 py-1 text-[10px] font-semibold text-white">
                        Foto atual
                      </span>
                    )}
                  </div>
                  <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/35 bg-primary/5 px-3 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/10">
                    <ImagePlus className="size-4 text-primary" />
                    {busy ? 'Enviando...' : 'Escolher nova imagem do celular'}
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
                  <details className="rounded-lg border border-border px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-medium text-muted-foreground">
                      Usar o endereço de uma imagem
                    </summary>
                    <Input
                      value={bannerForm.imageUrl}
                      onChange={(event) =>
                        setBannerForm({
                          ...bannerForm,
                          imageUrl: event.target.value,
                        })
                      }
                      maxLength={500}
                      className="mt-3"
                      aria-label="Endereço da imagem do banner"
                    />
                  </details>
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
                  {bannerForm.id ? 'Salvar alterações' : 'Cadastrar banner'}
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

          <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
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
                    width={192}
                    height={160}
                    loading="lazy"
                    decoding="async"
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
      )}

      {activeSection === 'contact' && (
        <section className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
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
              rel="noopener noreferrer"
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
      )}
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

function AdminSectionButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="truncate">{label}</span>
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
