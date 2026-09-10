import { formatMoney } from '@/lib/store-format';
import type { Product } from '@/lib/store-types';

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export function resolveCartLines(
  items: CartItem[],
  products: Product[],
): CartLine[] {
  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );

  return items.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
}

export function countCartItems(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function calculateCartSubtotal(lines: CartLine[]) {
  return lines.reduce(
    (total, line) => total + line.product.priceCents * line.quantity,
    0,
  );
}

export function buildWhatsAppOrderMessage(lines: CartLine[]) {
  if (lines.length === 0) {
    return 'Olá! Gostaria de saber mais sobre os produtos da GK Importados e Presentes.';
  }

  const products = lines
    .map((line, index) => {
      const subtotal = line.product.priceCents * line.quantity;

      return [
        `${index + 1}. *${line.product.name}*`,
        `   Quantidade: ${line.quantity}`,
        `   Valor unitário: ${formatMoney(line.product.priceCents)}`,
        `   Subtotal: ${formatMoney(subtotal)}`,
      ].join('\n');
    })
    .join('\n\n');

  const total = calculateCartSubtotal(lines);

  return [
    'Olá! Gostaria de solicitar estes produtos da *GK Importados e Presentes*:',
    '',
    '*MEU PEDIDO*',
    '',
    products,
    '',
    `*TOTAL DOS PRODUTOS: ${formatMoney(total)}*`,
    '',
    'Por favor, confirme a disponibilidade e me informe as opções de entrega e pagamento.',
  ].join('\n');
}
