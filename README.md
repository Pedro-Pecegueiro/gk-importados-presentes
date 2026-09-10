<p align="center">
  <img src="./public/gk-logo.png" alt="Logotipo da GK Importados e Presentes" width="128" />
</p>

# GK Importados e Presentes

Vitrine digital responsiva de perfumaria, cuidados pessoais e presentes. O cliente explora o catálogo, monta a sacola e envia um pedido organizado para o WhatsApp da loja. O projeto também possui um painel administrativo protegido para gerenciar produtos, banners, imagens e configurações.

**Demonstração:** [gkpresentes.com.br](https://gkpresentes.com.br/)

## Funcionalidades

- catálogo responsivo com busca e filtros por categoria;
- páginas individuais para os produtos;
- sacola persistente no navegador;
- mensagem de pedido formatada com itens, quantidades, subtotais e total;
- finalização do atendimento pelo WhatsApp;
- painel administrativo separado da vitrine;
- cadastro, edição, disponibilidade e destaque de produtos;
- gerenciamento do banner principal e do número de atendimento;
- upload validado de imagens JPEG, PNG e WebP;
- armazenamento de dados no Cloudflare D1 e imagens no Cloudflare R2;
- autenticação administrativa com sessão segura e bloqueio de tentativas excessivas.

## Tecnologias

- React 19 e TypeScript
- vinext e Vite
- Tailwind CSS
- Drizzle ORM e SQLite/D1
- Cloudflare Workers, D1 e R2
- Lucide React

## Arquitetura

```text
app/                 páginas, interface e rotas de API
components/ui/       componentes reutilizáveis da interface
db/                  conexão e schema do banco de dados
drizzle/             migrações SQL
lib/                 autenticação, configurações e acesso aos dados
public/              identidade visual e imagens iniciais
```

O mesmo Cloudflare Worker entrega a interface e as APIs. O banco D1 armazena produtos, banners, configurações e controle de tentativas de login. O bucket R2 recebe as imagens enviadas pelo painel.

## Executar localmente

Requisitos: Node.js 22.13 ou superior e npm.

```powershell
npm install
Copy-Item .dev.vars.example .dev.vars
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --file drizzle/0000_initial_gk_store.sql
npx wrangler d1 execute DB --local --config wrangler.local.jsonc --file drizzle/0001_admin_login_security.sql
npm run dev
```

Edite `.dev.vars` e defina valores próprios para `ADMIN_ACCESS_CODE`, `ADMIN_SESSION_SECRET` e `WHATSAPP_NUMBER`. O arquivo é ignorado pelo Git e não deve ser publicado.

A vitrine estará em `http://localhost:3000` e o painel em `http://localhost:3000/admin`.

## Verificação

```powershell
npm run check
```

O comando executa a análise estática e gera uma compilação completa de produção.

## Publicar na Cloudflare

1. Crie um banco D1 e um bucket R2 na sua conta Cloudflare.
2. Atualize os identificadores e os nomes dos recursos em `wrangler.cloudflare.jsonc`.
3. Autentique o Wrangler com `npx wrangler login`.
4. Execute os comandos abaixo.

```powershell
npm run build
npm run cloudflare:migrate
npm run cloudflare:deploy
npx wrangler secret put ADMIN_ACCESS_CODE --config wrangler.cloudflare.jsonc
npx wrangler secret put ADMIN_SESSION_SECRET --config wrangler.cloudflare.jsonc
```

Os segredos administrativos existem apenas no ambiente da Cloudflare. Nenhuma senha de produção faz parte deste repositório.

## Modelo de compra

O projeto funciona como vitrine digital e não processa pagamentos no site. Antes da conclusão, a loja confirma pelo WhatsApp a disponibilidade, a entrega e a forma de pagamento.
