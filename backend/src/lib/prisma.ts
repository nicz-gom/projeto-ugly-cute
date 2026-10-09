import 'dotenv/config'; //carrega o .env
import { PrismaPg } from '@prisma/adapter-pg'; // é o driver adapter: a peça que realmente abre a conexão com o postgresql, usando o pacote pg. No prisma 7 ele é obrigatório
import { PrismaClient } from '../generated/prisma/client.js'; //~vem da pasta gerada, não de @prisma/client, porque o prisma 7 não tem mais o pacote @prisma/client. Ele conhece suas tabelas: prisma.product, prisma.user

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! }); // (!) - dizendo ao ts para confiar nele

export const prisma = new PrismaClient({ adapter }); 
