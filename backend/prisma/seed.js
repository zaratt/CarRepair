const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Limpa as tabelas em ordem de dependência para evitar conflitos de chave estrangeira

  // 1. Primeiro, deletar tabelas que dependem de outras (mais específicas)
  await prisma.inspectionAttachment.deleteMany({});
  await prisma.inspection.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.workshopFavorite.deleteMany({});
  await prisma.maintenanceAttachment.deleteMany({});
  await prisma.maintenance.deleteMany({});
  await prisma.vehiclePhoto.deleteMany({});
  await prisma.vehicle.deleteMany({});

  // 2. Depois, deletar tabelas principais (menos dependentes)
  await prisma.workshop.deleteMany({});
  await prisma.model.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.user.deleteMany({});

  // Usuários
  const carOwner1 = await prisma.user.create({
    data: {
      name: 'Maria Motorista',
      email: 'maria@email.com',
      cpfCnpj: '11122233344',
      type: 'user',
      profile: 'car_owner',
    },
  });
  const carOwner2 = await prisma.user.create({
    data: {
      name: 'João da Silva',
      email: 'joao@email.com',
      cpfCnpj: '22233344455',
      type: 'user',
      profile: 'car_owner',
    },
  });
  const wshopOwner1 = await prisma.user.create({
    data: {
      name: 'Carlos Oficina',
      email: 'carlos@oficina.com',
      cpfCnpj: '55566677788',
      type: 'workshop',
      profile: 'wshop_owner',
    },
  });
  const wshopOwner2 = await prisma.user.create({
    data: {
      name: 'Oficina da Maria',
      email: 'oficina.maria@email.com',
      cpfCnpj: '88899900011',
      type: 'workshop',
      profile: 'wshop_owner',
    },
  });

  // Marcas e modelos
  const brandToyota = await prisma.brand.create({ data: { name: 'Toyota' } });
  const brandFiat = await prisma.brand.create({ data: { name: 'Fiat' } });
  const modelCorolla = await prisma.model.create({ data: { name: 'Corolla', brandId: brandToyota.id } });
  const modelHilux = await prisma.model.create({ data: { name: 'Hilux', brandId: brandToyota.id } });
  const modelUno = await prisma.model.create({ data: { name: 'Uno', brandId: brandFiat.id } });

  // Oficinas
  const workshop1 = await prisma.workshop.create({
    data: {
      userId: wshopOwner1.id,
      address: 'Rua das Oficinas, 123',
      phone: '11988887777',
      subdomain: 'oficinacarlos',
      name: 'Oficina Carlos',
    },
  });
  const workshop2 = await prisma.workshop.create({
    data: {
      userId: wshopOwner2.id,
      address: 'Av. Mecânicos, 456',
      phone: '11999998888',
      subdomain: 'oficinamaria',
      name: 'Auto Center Maria',
    },
  });

  // Veículos
  const vehicle1 = await prisma.vehicle.create({
    data: {
      licensePlate: 'XYZ9A88',
      brandId: brandToyota.id,
      modelId: modelCorolla.id,
      yearManufacture: 2014,
      modelYear: 2015,
      fuelType: 'GASOLINE',
      vin: '2HGCM82633A004352',
      ownerId: carOwner1.id,
    },
  });
  const vehicle2 = await prisma.vehicle.create({
    data: {
      licensePlate: 'ABC1B22',
      brandId: brandToyota.id,
      modelId: modelHilux.id,
      yearManufacture: 2018,
      modelYear: 2019,
      fuelType: 'DIESEL',
      vin: '3HGCM82633A004353',
      ownerId: carOwner2.id,
    },
  });
  const vehicle3 = await prisma.vehicle.create({
    data: {
      licensePlate: 'DEF2C33',
      brandId: brandFiat.id,
      modelId: modelUno.id,
      yearManufacture: 2010,
      modelYear: 2011,
      fuelType: 'FLEX',
      vin: '4HGCM82633A004354',
      ownerId: carOwner1.id,
    },
  });

  // Manutenções
  await prisma.maintenance.create({
    data: {
      vehicleId: vehicle1.id,
      workshopId: workshop1.id,
      date: new Date('2024-06-01'),
      description: 'Troca de óleo e filtro',
      products: 'Óleo 5W30, Filtro de óleo',
      mileage: 100000,
      value: 250.00,
      status: 'validated',
    },
  });
  await prisma.maintenance.create({
    data: {
      vehicleId: vehicle2.id,
      workshopId: workshop2.id,
      date: new Date('2024-07-10'),
      description: 'Revisão completa',
      products: 'Óleo, Filtros, Pastilhas de freio',
      mileage: 80000,
      value: 1200.00,
      status: 'pending',
    },
  });
  await prisma.maintenance.create({
    data: {
      vehicleId: vehicle3.id,
      workshopId: workshop1.id,
      date: new Date('2024-08-15'),
      description: 'Troca de embreagem',
      products: 'Kit embreagem',
      mileage: 150000,
      value: 900.00,
      status: 'completed',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });