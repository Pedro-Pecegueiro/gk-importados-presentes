import type * as React from 'react';
import { useEffect, useState } from 'react';
import {
  bannerInputFromForm,
  bannerToForm,
  createEmptyBannerForm,
  createEmptyProductForm,
  priceInputFromCents,
  productInputFromForm,
  productToForm,
  type BannerFormState,
  type ProductFormState,
} from '@/lib/admin-forms';
import { isPrototypeImage, normalizeText } from '@/lib/store-format';
import type { Banner, Product, StorePayload } from '@/lib/store-types';

type UseAdminPanelOptions = {
  payload: StorePayload;
  setAdminAuthenticated: (value: boolean) => void;
  refresh: () => Promise<void>;
  setNotice: (value: string) => void;
};

export function useAdminPanel({
  payload,
  setAdminAuthenticated,
  refresh,
  setNotice,
}: UseAdminPanelOptions) {
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
    createEmptyProductForm(suggestedProductSortOrder),
  );
  const [priceInput, setPriceInput] = useState('');
  const [adminProductSearch, setAdminProductSearch] = useState('');
  const [bannerForm, setBannerForm] = useState<BannerFormState>(() => ({
    ...createEmptyBannerForm(),
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
    setProductForm(createEmptyProductForm(nextOrder));
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
    setBannerForm(createEmptyBannerForm(nextOrder));
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
        ...createEmptyBannerForm(),
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

  return {
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
  };
}
