import { ArrowRight, AtSign, MapPin, MessageCircle } from 'lucide-react';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  PRODUCT_CATEGORIES,
  STORE_ADDRESS,
  STORE_MAP_URL,
  STORE_NAME,
} from '@/lib/store-config';
import { formatWhatsAppNumber } from '@/lib/store-format';

export function StoreFooter({ whatsappNumber }: { whatsappNumber: string }) {
  return (
    <footer className="border-t border-[#c99552]/35 bg-[#24170f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-10 sm:px-6 sm:pb-12 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/gk-logo.png"
              alt=""
              width={640}
              height={640}
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
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <AtSign className="size-4 shrink-0" />
              <span>{INSTAGRAM_HANDLE}</span>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span>WhatsApp: {formatWhatsAppNumber(whatsappNumber)}</span>
            </a>
            <address className="not-italic">
              <a
                href={STORE_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
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
