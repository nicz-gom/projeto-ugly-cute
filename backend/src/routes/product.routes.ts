
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