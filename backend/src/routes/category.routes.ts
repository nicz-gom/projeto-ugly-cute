import { Router } from 'express'; // Router cria um "mini app" só com as rotas de categoria, montado depois no server.ts
import { z } from 'zod'; // zod valida o formato dos dados que chegam no body
import { prisma } from '../lib/prisma.js'; // instância única do Prisma; o .js é exigido pelo ESM, mesmo o arquivo sendo .ts
import { auth } from '../middlewares/auth.js'; // middleware que só deixa passar quem envia um token JWT válido

const router = Router(); // cria o roteador; as rotas abaixo são registradas nele, não direto no app

// Regra de validação do body: um objeto com "name" texto de pelo menos 1 caractere
const categorySchema = z.object({
  name: z.string().min(1, 'O nome da categoria é obrigatório'), // o segundo argumento é a mensagem devolvida quando falha
});

// GET /api/categories → pública, lista todas as categorias (usada no <select> do painel)
router.get('/', async (_req, res) => { // _req: o "_" indica que o parâmetro não é usado
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } }); // SELECT * FROM categories ORDER BY name ASC
  res.json(categories); // responde 200 com a lista em JSON
});

// POST /api/categories → protegida, cria uma categoria nova
router.post('/', auth, async (req, res) => { // o auth roda antes; sem token válido a função nem é chamada (401)
  const parsed = categorySchema.safeParse(req.body); // valida sem lançar erro: devolve { success, data } ou { success: false, error }
  if (!parsed.success) { // body fora do formato (ex.: name vazio ou ausente)
    return res.status(400).json(parsed.error.issues); // 400 Bad Request com a lista do que está errado
  }

  const { name } = parsed.data; // daqui para baixo os dados já estão validados e tipados

  const exists = await prisma.category.findUnique({ where: { name } }); // findUnique funciona porque name é @unique no schema
  if (exists) { // já existe categoria com esse nome
    return res.status(409).json({ message: 'Já existe uma categoria com esse nome' }); // 409 Conflict, em vez de deixar o banco estourar um 500
  }

  const category = await prisma.category.create({ data: { name } }); // INSERT INTO categories (name) VALUES (...)
  res.status(201).json(category); // 201 Created, devolvendo a categoria criada já com o id gerado pelo banco
});

export default router; // exporta para o server.ts montar com app.use('/api/categories', categoryRoutes)
