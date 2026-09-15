import { cache } from 'react';
import { getStorePayload } from '@/lib/store-data';

export const getInitialStorePayload = cache(async () => {
  try {
    return await getStorePayload();
  } catch (error) {
    console.error(
      'Não foi possível carregar os dados iniciais da loja.',
      error,
    );
    return null;
  }
});
