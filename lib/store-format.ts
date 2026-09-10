const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatMoney(cents: number) {
  return currencyFormatter.format(cents / 100);
}

export function formatProductCount(count: number) {
  return `${count} ${count === 1 ? 'produto' : 'produtos'}`;
}

export function formatWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  const localNumber = digits.startsWith('55') ? digits.slice(2) : digits;

  if (localNumber.length !== 11) {
    return value;
  }

  return `(${localNumber.slice(0, 2)}) ${localNumber.slice(2, 7)}-${localNumber.slice(7)}`;
}

export function isPrototypeImage(imageUrl: string) {
  return imageUrl === '/gk-cuidados.png' || imageUrl === '/gk-kit-presente.png';
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
