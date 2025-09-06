"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const extension_accelerate_1 = require("@prisma/extension-accelerate");
// Instância única do Prisma Client com Accelerate
exports.prisma = new client_1.PrismaClient().$extends((0, extension_accelerate_1.withAccelerate)());
// Graceful shutdown - desconectar do banco quando o processo terminar
process.on('SIGINT', async () => {
    console.log('🔌 Disconnecting from database...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🔌 Disconnecting from database...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=prisma.js.map