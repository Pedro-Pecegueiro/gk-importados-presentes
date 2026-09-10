# GK Importados e Presentes

Catalogo responsivo de perfumes, presentes e cuidados pessoais com carrinho persistente, finalizacao de pedido pelo WhatsApp e painel administrativo simples.

## Executar localmente

Requisitos: Node.js 22.13 ou superior.

```powershell
npm install
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --file drizzle/0000_initial_gk_store.sql
npm run dev
```

Abra `http://localhost:3000` no navegador.

## WhatsApp

O numero pode ser alterado no painel administrativo, em `/admin`, na secao de configuracoes. Informe apenas os digitos com codigo do pais e DDD, por exemplo `5511999999999`.

O valor inicial tambem pode ser definido pela variavel de ambiente `WHATSAPP_NUMBER` ou pela constante em `lib/store-config.ts`.

## Produtos e banners

No painel `/admin` e possivel:

- cadastrar, editar e excluir produtos;
- definir categoria, preco, descricao, imagem e disponibilidade;
- cadastrar e organizar banners da pagina inicial;
- enviar imagens para o armazenamento do site;
- atualizar o numero de WhatsApp usado na finalizacao dos pedidos.

O codigo administrativo inicial e `gk-admin-2026`. Antes de compartilhar o site, altere `ADMIN_ACCESS_CODE` no ambiente de hospedagem ou em `lib/store-config.ts` para uso local.

## Fluxo de compra

O site nao processa pagamento online. O cliente monta a sacola, informa os dados basicos e abre uma mensagem pronta no WhatsApp da loja para combinar pagamento e entrega.
