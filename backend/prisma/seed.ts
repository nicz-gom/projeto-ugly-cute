import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma.js';

async function main() {
  const password = await bcrypt.hash('ugly_Cute@123', 10);

  await prisma.user.upsert({
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