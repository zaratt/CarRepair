-- Atualizar usuários existentes com senha padrão
-- Este script deve ser executado após a migração do campo password

UPDATE "User" 
SET password = '$2b$12$LQv3c1yqBwEHxPxeRpP31.s/qN36eKxmQQPa1KbV0I0rKFI/qXX6K' -- senha: 'TempPass123!'
WHERE password IS NULL OR password = '';

-- Verificar se todas as senhas foram atualizadas
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN password IS NOT NULL AND password != '' THEN 1 END) as users_with_password
FROM "User";
