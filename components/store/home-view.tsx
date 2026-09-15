import type * as React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Gift,
  HeartHandshake,
  MessageCircle,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ProductCard } from '@/components/store/product-card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  PRODUCT_CATEGORIES,
  STORE_NAME,
} from '@/lib/store-config';
import { formatProductCount } from '@/lib/store-format';
import type { Banner, Product } from '@/lib/store-types';
import { cn } from '@/lib/utils';

export function HomeView({
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
  const kitItems = (kitProducts.length ? kitProducts : products).slice(0, 2);

  return (
    <main>
      <section className="relative isolate min-h-[72svh] overflow-hidden bg-[#2b1b12] text-white">
        <img
          src={heroImage}
          alt=""
          width={1600}
          height={900}
          decoding="async"
          fetchPriority="high"
          sizes="100vw"
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
            <h1 className="font-heading text-4xl font-bold leading-[1.02] drop-shadow-sm sm:text-6xl sm:leading-[0.95] lg:text-7xl">
              {STORE_NAME}
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-white/88">
              {heroBanner?.subtitle ??
                'Perfumes, cosméticos, acessórios e kits com atendimento direto pelo WhatsApp.'}
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/72 sm:text-base">
              Escolha na vitrine e conte com a GK para confirmar
              disponibilidade, entrega e pagamento antes de concluir.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/catalogo"
                className={cn(
                  buttonVariants(),
                  'h-11 bg-primary px-5 text-primary-foreground hover:bg-primary/90',
                )}
                onClick={(event) => {
                  event.preventDefault();
                  onCatalog();
                }}
              >
                {heroBanner?.ctaLabel ?? 'Explorar produtos'}
                <ArrowRight />
              </a>
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
        <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 lg:grid-cols-4">
          {PRODUCT_CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCatalogCategory(item)}
              className="group relative flex min-h-28 min-w-0 flex-col items-start justify-between rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:bg-primary/[0.035] hover:shadow-lg sm:min-h-32 sm:p-5"
            >
              <span className="min-w-0 max-w-full sm:pr-9">
                <span className="block break-words font-heading text-base font-bold leading-tight sm:text-xl">
                  {item}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {formatProductCount(categoryCounts.get(item) ?? 0)}
                </span>
              </span>
              <span className="absolute right-4 top-4 hidden size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground sm:grid">
                <Package className="size-4 sm:size-5" />
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
          <div className="grid snap-x snap-mandatory auto-cols-[min(86vw,18rem)] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-3 sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:pb-0">
            {kitItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                compact
                onProduct={onProduct}
                onAdd={onAdd}
              />
            ))}
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
                width={640}
                height={640}
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
              rel="noopener noreferrer"
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
      <div className="mt-7 grid snap-x snap-mandatory auto-cols-[min(86vw,18rem)] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain pb-3 sm:mt-8 sm:grid-flow-row sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
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
    <div className="border-b border-border py-7 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0">
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
        <Button
          className="w-full sm:w-auto"
          variant="outline"
          onClick={onAction}
        >
          {actionLabel}
          <ArrowRight />
        </Button>
      )}
    </div>
  );
}
