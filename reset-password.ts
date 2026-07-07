import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin1234', 12);
  await prisma.user.update({
    where: { username: 'super_admin' },
    data: { password: hashedPassword },
  });
  console.log('تم تحديث كلمة المرور بنجاح إلى: Admin1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
