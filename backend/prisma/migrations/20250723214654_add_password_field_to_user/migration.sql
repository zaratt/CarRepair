/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Adicionar coluna password com valor padrão temporário
ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '$2b$10$rQR3yJJoZdKqGRg8NZ1XyeJ.HgLUGJ3tGk4KxP4xvU5lJzVWdK6Pm';

-- Remover valor padrão após adicionar a coluna (para futuras inserções exigirem senha)
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;
