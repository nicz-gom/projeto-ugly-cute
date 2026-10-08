Estrutura final

backend/
├── prisma/
│   ├── migrations/          ← gerado pelo Prisma (vai pro git)
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── generated/prisma/    ← client gerado (NÃO vai pro git)
│   ├── lib/prisma.ts
│   ├── middlewares/auth.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── product.routes.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
├── prisma.config.ts
└── tsconfig.json
Passo 1 — Criar o banco no PostgreSQL
Abra o psql (ou o pgAdmin) e rode:


CREATE DATABASE ugly_cute;
Anote o usuário, a senha e a porta (o padrão é postgres / sua senha / 5432).

As migrations em desenvolvimento usam um shadow database temporário. Por isso o usuário precisa ter permissão de criar banco. O postgres já tem.

Passo 2 — Iniciar o projeto Node

cd backend
npm init -y
Instale as dependências:


# runtime
npm i express cors dotenv bcrypt jsonwebtoken zod @prisma/client @prisma/adapter-pg pg

# desenvolvimento
npm i -D typescript tsx prisma @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken @types/pg

Pacote:
	Para quê

prisma:
	CLI (migrations, generate, studio)

@prisma/client + @prisma/adapter-pg + pg:
	client e conexão com o Postgres

express + cors:
	API HTTP e liberar o Angular (porta 4200)

bcrypt + jsonwebtoken:
	hash da senha e token do login 

zod:
	validar o body das requisições

tsx:
	rodar TypeScript direto em dev

Passo 3 — Configurar package.json e TypeScript
No package.json, adicione "type": "module" (o Prisma 7 é ESM) e os scripts:


{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset"
  }
}

Crie o tsconfig.json:

npx tsc --init

{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src", "prisma"]
}

Passo 4 — Inicializar o Prisma

npx prisma init --datasource-provider postgresql

ou 

npx prisma init --datasource-provider postgresql --output ../src/generated/prisma


Isso cria prisma/schema.prisma, prisma.config.ts e .env.

.env (ajuste usuário e senha):


DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/ugly_cute?schema=public"
JWT_SECRET="troque-por-uma-string-grande-e-aleatoria"
PORT=3000

prisma.config.ts:


import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});

.gitignore:


node_modules
dist
.env
src/generated

Passo 5 — Modelar o schema

prisma/schema.prisma:


generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  @@map("users")
}

model Product {
  id        Int      @id @default(autoincrement())
  name      String
  price     Decimal  @db.Decimal(10, 2)
  image     String
  category  String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  @@map("products")
}

Algumas escolhas:

Decimal para preço, nunca Float, para não ter erro de arredondamento com dinheiro.

quantity fica fora de Product, porque é coisa do carrinho, não do produto.

@@map / @map deixam as tabelas e colunas em snake_case no Postgres e o código em camelCase.

Passo 6 — Criar a primeira migration

npx prisma migrate dev --name init
npx prisma generate

O que acontece:

O Prisma compara o schema com o banco e gera prisma/migrations/2026XXXX_init/migration.sql.

Aplica esse SQL no ugly_cute.

Registra a migration na tabela _prisma_migrations.
O generate cria o client tipado em src/generated/prisma.

Para conferir: npx prisma studio abre uma interface web com as tabelas.

Passo 7 — Instância única do Prisma

Criar:
src/lib/prisma.ts:

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });

Com "type": "module" e NodeNext, os imports relativos levam a extensão .js, mesmo em arquivo .ts.

Passo 8 — Seed (criar o admin)

Criar:
prisma/seed.ts:


import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@uglycute.com' },
    update: {},
    create: { email: 'admin@uglycute.com', password, name: 'Admin' },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Produto exemplo', price: 49.9, image: 'produto1.png', category: 'pelucia' },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

npx prisma db seed

Passo 9 — API Express

src/middlewares/auth.ts:


import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Token ausente' });

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

src/routes/auth.routes.ts:


import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const router = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados inválidos' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'E-mail ou senha incorretos' });
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '8h' });
  res.json({ token });
});

export default router;

src/routes/product.routes.ts:


import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  image: z.string().min(1),
  category: z.string().optional(),
});

// público: lista para a Home
router.get('/', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(products);
});

// protegido: só o admin
router.post('/', auth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.issues);
  res.status(201).json(await prisma.product.create({ data: parsed.data }));
});

router.put('/:id', auth, async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.issues);
  res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data: parsed.data }));
});

router.delete('/:id', auth, async (req, res) => {
  await prisma.product.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
});

export default router;
src/server.ts:


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`API rodando em http://localhost:${port}`));

npm run dev
Para testar: abra GET http://localhost:3000/api/products no navegador, ou faça um POST /api/auth/login com { "email": "admin@uglycute.com", "password": "admin123" } no Insomnia ou Postman.

Passo 10 — Como trabalhar com migrations no dia a dia
Toda mudança no banco segue o mesmo ciclo:

Edite o schema.prisma. Exemplo: adicionar description String? em Product.
Gere a migration:

npx prisma migrate dev --name add_product_description

Regenere o client:

npx prisma generate

Faça commit da pasta prisma/migrations/ junto com o schema.

Comando	Quando usar

prisma migrate dev --name x	dev: cria e aplica uma migration nova

prisma migrate dev --create-only --name x	gera o SQL sem aplicar, para você revisar ou editar antes (útil em renomeações, para não perder dados)

prisma migrate status	mostra o que está aplicado ou pendente

prisma migrate reset	apaga o banco, reaplica todas as migrations e roda o seed (só em dev)

prisma migrate deploy	produção/CI: aplica as pendentes, sem gerar nada novo

prisma generate	sempre depois de mudar o schema
prisma studio	ver e editar dados

Regras de ouro:

Nunca edite uma migration que já foi aplicada. Para corrigir, crie outra migration.

Nunca use prisma db push se você trabalha com migrations. Ele altera o banco sem gerar histórico.
Campo novo obrigatório (sem ?) numa tabela que já tem dados precisa de @default(...), senão a migration falha.

Renomear um campo no schema vira DROP + ADD (perde os dados). Use --create-only e troque o SQL por ALTER TABLE ... RENAME COLUMN.

Passo 11 — Ligar o Angular ao backend

Em app.config.ts, adicione provideHttpClient() nos providers.

Crie um AuthService com http.post<{ token: string }>('http://localhost:3000/api/auth/login', { email, password }) e salve o token no localStorage.
No onSubmit() de login.ts, chame esse service no lugar do TODO.

(especificações da linha acima!)

1. O service: services/auth.ts

login(email: string, password: string): Observable<LoginResponse> {
  return this.http
    .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
    .pipe(tap(({ token }) => localStorage.setItem(this.tokenKey, token)));
}
@Injectable({ providedIn: 'root' }) cria uma única instância do service para o app inteiro, que você usa com inject(Auth).
http.post<LoginResponse> envia o e-mail e a senha para /api/auth/login. O <LoginResponse> diz ao TypeScript que a resposta tem um token.
tap salva o token no localStorage quando a resposta chega, sem alterar o que vai para o componente.
Métodos extras que vão servir depois para o guard e o interceptor: logout(), getToken() e isLoggedIn().

Crie um ProductService com GET /api/products para a Home.

Mais tarde: um interceptor que envia Authorization: Bearer <token> e um guard nas rotas de admin.
O Postgres devolve price como string (por causa do Decimal). No Angular, converta com Number(p.price) ao montar o Product.

Ordem resumida
CREATE DATABASE ugly_cute
npm init e instalar as dependências
package.json (type: module e scripts) e tsconfig.json
prisma init, depois .env, prisma.config.ts e .gitignore
Escrever os models no schema.prisma
migrate dev --name init e depois generate
src/lib/prisma.ts
seed.ts e prisma db seed
Rotas e server.ts, depois npm run dev
Daí em diante: editar schema → migrate dev --name ... → generate → commit
Conectar o Angular
Se quiser, eu crio esses arquivos no backend/. Também posso montar os services do Angular. Para isso, me diga se a Home tem outros campos ou filtros (categorias, por exemplo) que precisam ir para o model.

2. O componente: login.ts
O TODO virou:


this.auth.login(email, password).subscribe({
  next: () => this.router.navigate(['/']),
  error: (err) => this.errorMessage.set(err.error?.message ?? 'Erro ao fazer login.'),
});
subscribe é obrigatório: um Observable do HttpClient só faz a requisição quando alguém se inscreve nele.
next roda quando o login dá certo. O token já foi salvo pelo tap, então só falta redirecionar.
error roda em 401 e mostra a mensagem do backend ("E-mail ou senha incorretos"). Se o status for 0, o backend está fora do ar ou o CORS bloqueou.
Signals loading e errorMessage controlam a tela.