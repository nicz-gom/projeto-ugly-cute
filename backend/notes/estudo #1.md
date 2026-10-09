#### --- EXPLICAÇÕES --- ####

# Pacotes
express:
  servidor HTTP e rotas

cors: 
  Libera o Angular (porta 4200) a chamar a API (porta 3000)

dotenv:
  Lê o arquivo .env para porcess.env

prisma:
  CLI: migrations, generate, studio

@prisma/client + @prisma/adapter-pg + pg:
  Client tipado e a conexão real com o postgreSQL

bcrypt:
    gera e compara o hash da senha

jsonwebtoken:
  cria e valida o token jwt

zod:
  valida o formato do body das requisições

@tyoes/*
    tipos do typescript para bibliotecas estcritas em JS

# tsconfig.json:

Foi gerado pelo tsc --init

Ler o arquivo com as anotações

# prisma7.config.ts

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config';

exporte default defineConfig{
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations.ts' seed: 'tsx prisma/seed.ts'
    },
    datasource: {
        url: env('DATABASE_URL')
    },
}

url: env - é a fonte de onde vem os dados

# .gitigonre

importante no .gitignore:
    A regra backend/src/generated/ ignora o client gerado, porque ele é recriado pelo prisma generate. A pasta prisma/migrations/ vai para o git: é o histórico do banco. Lembre que uma barra no início (/generated/) prende a regra à raiz do repositório;

# Prisma: schema, migrations e cliente

O prisma funciona em três tempo. Você descreve as tabelas no schema.prisma, o migrate dev transforma isso em sql e aplica no banco, e o generate cria um cliente typescript com um método para cada tabela

schema primsa: onde ficam as tabelas
 
o migrate dev: transforma isso em SQL e aplica no banco

o generate: cria um ciente typescript com um método para cada tabela

# schema.prisma:

generate client {
    provider = "prisma-client"
    output = "../src/generated/prisma"
}

datasource db{
    provider = "postgresql"
}

model Product {
    id Int @Id default(autoincrement())
    name String
    price Decimal @db.Decimal(10, 2)
    image String
    category String?
    active Boolean @default(true)
    createdAt DateTime @default(now()) @map("created_at")
    updateAt DateTime @updateAt @map("updated_at")

    @@map("products")
}

Ler anotações de cada coisa no arquivo

# A migration

>> npx prisma migrate dev --name init 
: Comparou o schema com o banco vazio e gerou prisma/migrations/20261008013302_init/migration.sql

Criou onde ficam as queries

CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "price" DECIMAL (10, 2) NOT NULL, 
    category TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

O ciclo da mudança toda no banco:
    -> 
        Edite o schema.prisma 
    -> 
        rode npx prisma migrate dev --name descricao_da_mudanca
    ->
        rode npx prisma generate. No prisma 7 ele não roda sozinho

Faça o commit do schema junto ocm a nova pasta de migration

# src/lib/prisma.ts

import 'dotenv/config';
import { PrismaPg } from '@prima/adapter-pg';
importe { PrismaClient  } from '../generated/prisma/client.js'

const adapter = new PrismaPg ({
    connectionString:
    process.env.DATABASE_URL!

});

export const prisma = new PrismaCliente ({adapter})

>>LER O arquivo

# seed

>>LER O ARQUIVO