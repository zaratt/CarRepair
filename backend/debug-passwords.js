const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugPasswords() {
    try {
        console.log('🔍 DEBUGANDO SENHAS DOS USUÁRIOS...\n');

        // 1. Buscar usuários existentes
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
            }
        });

        console.log('👥 USUÁRIOS ENCONTRADOS:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
            console.log(`   Hash atual: ${user.password.substring(0, 20)}...`);
        });

        console.log('\n🔐 TESTANDO SENHAS:');

        // 2. Testar senha "password123" vs hash atual
        for (const user of users) {
            const isValid = await bcrypt.compare('password123', user.password);
            console.log(`${user.email}: password123 → ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
        }

        console.log('\n🛠️ GERANDO HASH CORRETO:');
        const correctHash = await bcrypt.hash('password123', 10);
        console.log(`Hash correto para "password123": ${correctHash}`);

        console.log('\n🔄 ATUALIZANDO SENHAS...');

        // 3. Atualizar senhas para o hash correto
        await prisma.user.updateMany({
            where: {},
            data: {
                password: correctHash
            }
        });

        console.log('✅ Senhas atualizadas com sucesso!');

        // 4. Verificar novamente
        console.log('\n🧪 VERIFICAÇÃO FINAL:');
        const updatedUsers = await prisma.user.findMany({
            select: { email: true, password: true }
        });

        for (const user of updatedUsers) {
            const isValid = await bcrypt.compare('password123', user.password);
            console.log(`${user.email}: password123 → ${isValid ? '✅ VÁLIDA' : '❌ AINDA INVÁLIDA'}`);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugPasswords();
