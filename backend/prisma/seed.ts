import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const password = await bcrypt.hash('ugly_Cute@123', 10); //o bcrypt transforma a senha em uma string $2b$10$Xk... que não dá para reverter, o 10 é o custo: quanto mais, mais lento para calcular e mais difícil para quebrar

  await prisma.user.upsert({ //Na primeira versão estava update: {}. A primeira execução criou o admin com admin123. Quando você trocou a senha e rodou de novo, o usuário já existia, então rodou o update, que não tinha nada. A senha no banco ficou igual. Com update: { password }, toda execução grava a senha atual do script.
    where: { email: 'admin@uglycute.com' },
    update: { password },
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