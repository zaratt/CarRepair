#!/bin/bash

echo "🔍 VERIFICAÇÃO DE PRÉ-REQUISITOS"
echo "================================="

cd /Users/alanribeiro/GitHub/CarRepair/backend

echo "1. Verificando conexão com banco..."
npx prisma db ping
if [ $? -eq 0 ]; then
    echo "✅ Banco conectado"
else
    echo "❌ Erro de conexão com banco"
    exit 1
fi

echo "2. Verificando status das migrações..."
npx prisma migrate status
if [ $? -eq 0 ]; then
    echo "✅ Migrações atualizadas"
else
    echo "❌ Problema com migrações"
    exit 1
fi

echo "3. Verificando usuários de teste..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findMany({select: {email: true, name: true}}).then(users => {
  console.log('👥 Usuários disponíveis:');
  users.forEach(u => console.log(\`  - \${u.name} (\${u.email})\`));
  prisma.\$disconnect();
});
"

echo "✅ PRÉ-REQUISITOS VERIFICADOS"
