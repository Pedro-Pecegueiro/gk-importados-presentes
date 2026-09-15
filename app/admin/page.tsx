import StoreApp from '../store-app';
import { getInitialStorePayload } from '@/lib/store-initial';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const initialPayload = await getInitialStorePayload();
  return <StoreApp initialView="admin" initialPayload={initialPayload} />;
}
