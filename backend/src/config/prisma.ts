import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Instância única do Prisma Client com Accelerate
export const prisma = new PrismaClient().$extends(withAccelerate());

// Graceful shutdown - desconectar do banco quando o processo terminar
process.on('SIGINT', async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    process.exit(0);
});
