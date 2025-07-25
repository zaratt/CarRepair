import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...');
    await prisma.maintenanceAttachment.deleteMany();
    await prisma.inspectionAttachment.deleteMany();
    await prisma.vehiclePhoto.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.workshopFavorite.deleteMany();
    await prisma.maintenance.deleteMany();
    await prisma.inspection.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.workshop.deleteMany();
    await prisma.user.deleteMany();
    await prisma.model.deleteMany();
    await prisma.brand.deleteMany();

    // Criar marcas básicas (serão substituídas pela FIPE)
    console.log('🚗 Criando marcas básicas...');
    const toyotaBrand = await prisma.brand.create({
        data: {
            name: 'Toyota'
        }
    });

    const volkswagenBrand = await prisma.brand.create({
        data: {
            name: 'Volkswagen'
        }
    });

    // Criar modelos básicos
    console.log('🏎️ Criando modelos básicos...');
    const corollaModel = await prisma.model.create({
        data: {
            name: 'Corolla',
            brandId: toyotaBrand.id
        }
    });

    const golfModel = await prisma.model.create({
        data: {
            name: 'Golf',
            brandId: volkswagenBrand.id
        }
    });

    // Criar usuário de teste
    console.log('👤 Criando usuário de teste...');
    const testUser = await prisma.user.create({
        data: {
            name: 'João Silva',
            email: 'joao.silva@email.com',
            cpfCnpj: '12345678901',
            type: 'user',
            profile: 'car_owner',
            phone: '11999999999',
            city: 'São Paulo',
            state: 'SP',
            isValidated: true,
            password: '$2b$10$defaultPasswordHashForSeeding'
        }
    });

    // Criar oficina de teste
    console.log('🔧 Criando oficina de teste...');
    const workshopOwner = await prisma.user.create({
        data: {
            name: 'Maria Santos',
            email: 'maria.santos@oficina.com',
            cpfCnpj: '98765432100',
            type: 'workshop',
            profile: 'wshop_owner',
            phone: '11888888888',
            city: 'São Paulo',
            state: 'SP',
            isValidated: true,
            password: '$2b$10$defaultPasswordHashForSeeding'
        }
    });

    const testWorkshop = await prisma.workshop.create({
        data: {
            name: 'Oficina Central',
            userId: workshopOwner.id,
            address: 'Rua das Oficinas, 123, Centro, São Paulo/SP',
            phone: '11888888888',
            subdomain: 'oficina-central',
            rating: 4.5
        }
    });

    // Criar veículo de teste
    console.log('🚙 Criando veículo de teste...');
    const testVehicle = await prisma.vehicle.create({
        data: {
            licensePlate: 'ABC1234',
            brandId: toyotaBrand.id,
            modelId: corollaModel.id,
            yearManufacture: 2020,
            modelYear: 2021,
            fuelType: 'FLEX',
            vin: '1HGBH41JXMN109186',
            ownerId: testUser.id,
            // Campos FIPE (exemplo)
            fipeTypeId: 1, // Carros
            fipeBrandId: 21, // Toyota na FIPE
            fipeModelId: 4828, // Corolla na FIPE
            fipeYearCode: '2021-1' // 2021 Flex
        }
    });

    // Criar manutenção de teste
    console.log('🛠️ Criando manutenção de teste...');
    const testMaintenance = await prisma.maintenance.create({
        data: {
            vehicleId: testVehicle.id,
            workshopId: testWorkshop.id,
            date: new Date('2024-01-15'),
            description: 'Troca de óleo e filtro',
            products: 'Óleo 5W30, Filtro de óleo, Filtro de ar',
            mileage: 15000,
            value: 250.50,
            serviceStatus: 'concluido',
            validationStatus: 'validado'
        }
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log(`Criados:`);
    console.log(`- 2 marcas`);
    console.log(`- 2 modelos`);
    console.log(`- 2 usuários`);
    console.log(`- 1 oficina`);
    console.log(`- 1 veículo`);
    console.log(`- 1 manutenção`);
}

main()
    .catch((e) => {
        console.error('❌ Erro durante o seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
