## Visualizar o banco de dados

## 1. Ver e editar dados à mão

Prisma Studio é o mais fácil:


>> cd backend
>> npx prisma studio

Ele abre um painel no navegador (geralmente em http://localhost:5555). Lá você vê as tabelas User e Product e pode criar, editar e apagar registros clicando. Dá para cadastrar os 10 elementais por ali, por exemplo.

pgAdmin, que veio com o PostgreSQL: Servers → PostgreSQL → Databases → ugly_cute → Schemas → public → Tables. Clique com o direito em products → View/Edit Data.

SQL puro, pelo psql ou pela Query Tool do pgAdmin:


SELECT * FROM products;
SELECT id, email, name FROM users;
No banco, as tabelas se chamam users e products por causa do @@map no schema.

## 2. Usar o banco no código do backend
Todo acesso ao banco passa pelo prisma exportado em src/lib/prisma.ts:


import { prisma } from '../lib/prisma.js';

await prisma.product.findMany();                         // SELECT * FROM products
await prisma.product.findUnique({ where: { id: 1 } });   // um produto pelo id
await prisma.product.create({ data: { name: 'Nox', price: 23, image: '10_Nox_site.png' } });
await prisma.product.update({ where: { id: 1 }, data: { price: 19.9 } });
await prisma.product.delete({ where: { id: 1 } });
As rotas em product.routes.ts já fazem isso.

## 3. Usar os dados no Angular
O Angular nunca fala com o banco direto. Ele chama a API, e a API usa o Prisma:


Angular → GET http://localhost:3000/api/products → Express → Prisma → PostgreSQL
Para testar se está funcionando:

No backend, rode npm run dev.
Abra http://localhost:3000/api/products no navegador. Deve aparecer o JSON com os produtos do banco.
Hoje a Home e o painel ainda usam a lista fixa no .ts. Para mostrarem os produtos do banco, falta um ProductService no Angular que chame essa rota. É o último exercício do guia.

Se quiser, eu crio o ProductService e troco a lista fixa da Home e do painel pelos dados do banco. Também posso montar um seed com os 10 elementais, para o banco já começar com eles.