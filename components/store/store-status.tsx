import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StoreLoadingState() {
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando a loja</span>
      </div>
    </main>
  );
}

export function StoreErrorState({
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
