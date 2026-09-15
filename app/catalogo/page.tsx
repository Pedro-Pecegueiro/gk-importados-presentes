import StoreApp from '../store-app';
import { getInitialStorePayload } from '@/lib/store-initial';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  const initialPayload = await getInitialStorePayload();
  return <StoreApp initialView="catalog" initialPayload={initialPayload} />;
}
