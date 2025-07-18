const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const app = express();
const prisma = new PrismaClient();

// GET: Buscar histórico de serviços mais comuns do usuário
app.get('/api/users/:id/maintenance-history', async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { limit = 6 } = req.query;

        console.log('🔍 Buscando histórico de manutenções do usuário:', userId);

        const maintenances = await prisma.maintenance.findMany({
            where: {
                vehicle: { ownerId: userId },
                validationStatus: 'validado'
            },
            select: {
                description: true,
                date: true,
                workshop: {
                    select: { name: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        if (maintenances.length === 0) {
            return res.json({
                services: [],
                recentServices: [],
                totalMaintenances: 0
            });
        }

        const serviceCount = {};
        const recentServices = new Set();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const predefinedServices = [
            'Troca de óleo',
            'Troca de filtros',
            'Alinhamento',
            'Balanceamento',
            'Freios',
            'Suspensão',
            'Ar condicionado',
            'Bateria',
            'Pneus',
            'Revisão geral',
            'Embreagem',
            'Radiador',
            'Velas',
            'Correia dentada',
            'Amortecedores'
        ];

        maintenances.forEach(maintenance => {
            const description = maintenance.description.toLowerCase();
            const maintenanceDate = new Date(maintenance.date);
            const isRecent = maintenanceDate >= sixMonthsAgo;

            predefinedServices.forEach(service => {
                const serviceKey = service.toLowerCase();
                if (description.includes(serviceKey)) {
                    serviceCount[service] = (serviceCount[service] || 0) + 1;

                    if (isRecent) {
                        recentServices.add(service);
                    }
                }
            });
        });

        const sortedServices = Object.entries(serviceCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, parseInt(limit))
            .map(([service, count]) => ({
                name: service,
                count: count,
                percentage: Math.round((count / maintenances.length) * 100),
                isRecent: recentServices.has(service)
            }));

        const recentServicesList = Array.from(recentServices).slice(0, 4);

        console.log(`📊 Serviços do histórico encontrados: ${sortedServices.length}`);
        console.log(`🕒 Serviços recentes: ${recentServicesList.length}`);

        res.json({
            services: sortedServices.map(s => s.name),
            recentServices: recentServicesList,
            details: sortedServices,
            totalMaintenances: maintenances.length,
            validatedOnly: true
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico de manutenções do usuário' });
    }
});


const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') cb(null, true);
        else cb(new Error('Apenas imagens JPEG ou PNG são permitidas!'));
    }
});

// --- ANEXOS DE MANUTENÇÃO ---
const attachmentUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'image/jpeg' ||
            file.mimetype === 'image/png' ||
            file.mimetype === 'application/pdf'
        ) cb(null, true);
        else cb(new Error('Apenas imagens JPEG, PNG ou PDF são permitidos!'));
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

//USUARIOS

// GET: Listar usuários (ajustado para perfis)
app.get('/api/users', async (req, res) => {
    try {
        const { userId, profile } = req.query;
        if (!userId || !profile) {
            return res.status(400).json({ error: 'userId e profile são obrigatórios' });
        }
        if (profile === 'car_owner') {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        if (profile === 'wshop_owner') {
            // Descobre a oficina do usuário logado
            const workshop = await prisma.workshop.findFirst({ where: { userId: userId } });
            if (!workshop) return res.json([]);
            // Busca motoristas que fizeram manutenções OU inspeções nesta oficina
            const maintUsers = await prisma.maintenance.findMany({
                where: { workshopId: workshop.id },
                select: { vehicle: { select: { owner: true } } }
            });
            const inspUsers = await prisma.inspection.findMany({
                where: { maintenance: { workshopId: workshop.id } },
                select: { maintenance: { select: { vehicle: { select: { owner: true } } } } }
            });
            // Extrai IDs únicos
            const userSet = new Set();
            maintUsers.forEach(m => m.vehicle?.owner && userSet.add(m.vehicle.owner.id));
            inspUsers.forEach(i => i.maintenance?.vehicle?.owner && userSet.add(i.maintenance.vehicle.owner.id));
            const userIds = Array.from(userSet);
            if (userIds.length === 0) return res.json([]);
            const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
            return res.json(users);
        }
        // Admin: retorna todos
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// GET: Buscar usuário por ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// POST: Criar usuário
app.post('/api/users', async (req, res) => {
    try {
        const { name, email, cpfCnpj, type, profile } = req.body;
        if (!name || !email || !cpfCnpj || !type || !profile) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        if (!/^\d{11}$|^\d{14}$/.test(cpfCnpj)) {
            return res.status(400).json({ error: 'CPF/CNPJ inválido (11 ou 14 dígitos)' });
        }
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { cpfCnpj }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email ou CPF/CNPJ já cadastrado' });
        }
        const user = await prisma.user.create({
            data: {
                name,
                email,
                cpfCnpj,
                type,
                profile,
                createdAt: new Date()
            }
        });
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// PUT: Atualizar usuário
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, cpfCnpj, type, profile } = req.body;
        if (!name || !email || !cpfCnpj || !type || !profile) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }
        if (!/^\d{11}$|^\d{14}$/.test(cpfCnpj)) {
            return res.status(400).json({ error: 'CPF/CNPJ inválido (11 ou 14 dígitos)' });
        }
        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ email }, { cpfCnpj }], NOT: { id } }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email ou CPF/CNPJ já cadastrado' });
        }
        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                cpfCnpj,
                type,
                profile
            }
        });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// PATCH: Atualizar status de validação do perfil do usuário
app.patch('/api/users/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { isValidated } = req.body;
        const user = await prisma.user.update({
            where: { id },
            data: { isValidated: Boolean(isValidated) }
        });
        res.json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar status de validação' });
    }
});

// DELETE: Encerrar conta do usuário (apaga usuário e dados relacionados)
app.delete('/api/users/:id/full', async (req, res) => {
    try {
        const { id } = req.params;
        // Apaga dados relacionados (ajuste conforme suas relações)
        await prisma.maintenance.deleteMany({ where: { vehicle: { ownerId: id } } });
        await prisma.inspection.deleteMany({ where: { uploadedById: id } });
        await prisma.vehicle.deleteMany({ where: { ownerId: id } });
        await prisma.rating.deleteMany({ where: { userId: id } });
        await prisma.workshop.deleteMany({ where: { userId: id } });
        // Por fim, apaga o usuário
        await prisma.user.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao encerrar conta' });
    }
});

// DELETE: Excluir usuário
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const relatedRecords = await prisma.$transaction([
            prisma.vehicle.count({ where: { ownerId: id } }),
            prisma.workshop.count({ where: { userId: id } }),
            prisma.inspection.count({ where: { uploadedById: id } })
        ]);
        if (relatedRecords.some(count => count > 0)) {
            return res.status(400).json({ error: 'Usuário possui veículos, oficinas ou inspeções associadas' });
        }
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir usuário' });
    }
});

//VEÍCULOS

// GET: Listar veículos (apenas ativos do usuário)
app.get('/api/vehicles', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: userId, active: true },
            include: { owner: true, brand: true, model: true, photos: true }
        });
        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar veículos' });
    }
});

// GET: Buscar veículo por ID (só se ativo e do usuário)
app.get('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        const vehicle = await prisma.vehicle.findFirst({
            where: { id, ownerId: userId, active: true },
            include: { owner: true, brand: true, model: true, photos: true }
        });
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado ou acesso negado' });
        }
        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar veículo' });
    }
});

// POST: Criar veículo
app.post('/api/vehicles', async (req, res) => {
    try {
        const { licensePlate, brandId, modelId, modelYear, fuelType, vin, ownerId } = req.body;
        if (!licensePlate || !brandId || !modelId || !modelYear || !fuelType || !vin) {
            return res.status(400).json({ error: 'Campos obrigatórios: licensePlate, brandId, modelId, modelYear, fuelType, vin' });
        }
        if (ownerId) {
            const user = await prisma.user.findUnique({ where: { id: ownerId } });
            if (!user) {
                return res.status(400).json({ error: 'Proprietário inválido' });
            }
        }
        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate,
                brandId,
                modelId,
                modelYear: Number(modelYear),
                fuelType,
                vin,
                ownerId: ownerId || null,
                createdAt: new Date()
            },
            include: { owner: true, brand: true, model: true }
        });
        res.status(201).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar veículo' });
    }
});

// PUT: Atualizar veículo (só se ativo e do usuário)
app.put('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { licensePlate, brandId, modelId, modelYear, fuelType, vin, ownerId } = req.body;
        if (!licensePlate || !brandId || !modelId || !modelYear || !fuelType || !vin || !ownerId) {
            return res.status(400).json({ error: 'Campos obrigatórios: licensePlate, brandId, modelId, modelYear, fuelType, vin, ownerId' });
        }
        const vehicle = await prisma.vehicle.findFirst({ where: { id, ownerId, active: true } });
        if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado ou acesso negado' });
        const updated = await prisma.vehicle.update({
            where: { id },
            data: {
                licensePlate,
                brandId,
                modelId,
                modelYear: Number(modelYear),
                fuelType,
                vin,
                ownerId
            },
            include: { owner: true, brand: true, model: true }
        });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar veículo' });
    }
});

// DELETE: Excluir veículo
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
        }
        await prisma.vehicle.delete({ where: { id } });
        res.json({ message: 'Veículo excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir veículo' });
    }
});

// POST: Informar venda de veículo
app.post('/api/vehicles/:id/sell', async (req, res) => {
    try {
        const { id } = req.params;
        // Aqui, idealmente, você pegaria o userId do token JWT/autenticação
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado' });
        if (vehicle.ownerId !== userId) return res.status(403).json({ error: 'Acesso negado' });
        if (!vehicle.active) return res.status(400).json({ error: 'Veículo já está inativo' });
        const updated = await prisma.vehicle.update({
            where: { id },
            data: {
                active: false,
                soldAt: new Date(),
                ownerId: null // Remove vínculo do proprietário
            }
        });
        res.json({ success: true, vehicle: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao informar venda do veículo' });
    }
});

//MANUTENÇÕES

// GET: Listar manutenções (apenas de veículos ativos do usuário)
app.get('/api/maintenances', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        const maintenances = await prisma.maintenance.findMany({
            where: {
                vehicle: { ownerId: userId, active: true }
            },
            include: {
                vehicle: { include: { brand: true, model: true } },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        user: { select: { name: true } },
                    }
                },
                // inspections removido
            },
            orderBy: { date: 'desc' },
        });
        // Removido o mapeamento inspection
        res.json(maintenances);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar manutenções' });
    }
});

// GET: Detalhar manutenção por ID
app.get('/api/maintenances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const maintenance = await prisma.maintenance.findUnique({
            where: { id },
            include: {
                vehicle: { include: { brand: true, model: true } },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        user: { select: { name: true } },
                    }
                },
                // inspections removido
            },
        });
        if (!maintenance) {
            return res.status(404).json({ error: 'Manutenção não encontrada' });
        }
        res.json(maintenance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar manutenção' });
    }
});

// POST: Criar manutenção
app.post('/api/maintenances', async (req, res) => {
    try {
        const { vehicleId, workshopId, date, description, value, mileage, products } = req.body;

        // Gerar código de validação único
        const validationCode = generateValidationCode();

        const maintenance = await prisma.maintenance.create({
            data: {
                vehicleId,
                workshopId,
                date: new Date(date),
                description,
                products: products || '', // Campo obrigatório com valor padrão
                value,
                serviceStatus: 'concluido', // Status do serviço sempre "concluído"
                validationStatus: 'registrado', // Status de validação inicial
                validationCode, // Código único para validação
                mileage,
                createdAt: new Date()
            },
        });
        // Busca manutenção expandida para retornar workshop.name e workshop.user.name
        const expanded = await prisma.maintenance.findUnique({
            where: { id: maintenance.id },
            include: {
                vehicle: { include: { brand: true, model: true } },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        user: { select: { name: true } },
                    }
                },
                // inspections removido
            },
        });
        res.json(expanded);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar manutenção' });
    }
});

// PUT: Atualizar manutenção
app.put('/api/maintenances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, workshopId, date, description, value, mileage, products } = req.body;
        const maintenance = await prisma.maintenance.update({
            where: { id },
            data: {
                vehicleId,
                workshopId,
                date: new Date(date),
                description,
                products: products || '', // Campo obrigatório com valor padrão
                value,
                mileage
                // Não permitir alteração de serviceStatus e validationStatus via PUT
            },
        });
        // Busca manutenção expandida para retornar workshop.name e workshop.user.name
        const expanded = await prisma.maintenance.findUnique({
            where: { id: maintenance.id },
            include: {
                vehicle: { include: { brand: true, model: true } },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        user: { select: { name: true } },
                    }
                },
                // inspections removido
            },
        });
        res.json(expanded);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar manutenção' });
    }
});

// DELETE: Excluir manutenção
app.delete('/api/maintenances/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.maintenance.delete({ where: { id } });
        res.json({ message: 'Manutenção excluída' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir manutenção' });
    }
});

// Upload de anexo (foto ou PDF)
app.post('/api/maintenances/:id/attachments', attachmentUpload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const count = await prisma.maintenanceAttachment.count({ where: { maintenanceId: id } });
        if (count >= 3) return res.status(400).json({ error: 'Limite de 3 anexos por manutenção atingido' });
        if (!req.file) return res.status(400).json({ error: 'Arquivo é obrigatório' });
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const type = req.file.mimetype === 'application/pdf' ? 'pdf' : 'photo';
        const name = req.file.originalname;
        const attachment = await prisma.maintenanceAttachment.create({
            data: { maintenanceId: id, url, type, name }
        });
        res.status(201).json(attachment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar anexo' });
    }
});

// Listar anexos de uma manutenção
app.get('/api/maintenances/:id/attachments', async (req, res) => {
    try {
        const { id } = req.params;
        const attachments = await prisma.maintenanceAttachment.findMany({
            where: { maintenanceId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(attachments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar anexos' });
    }
});

// Remover anexo
app.delete('/api/maintenances/:maintenanceId/attachments/:attachmentId', async (req, res) => {
    try {
        const { attachmentId } = req.params;
        await prisma.maintenanceAttachment.delete({ where: { id: attachmentId } });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover anexo' });
    }
});

// GET: Listar oficinas
app.get('/api/workshops', async (req, res) => {
    try {
        const workshops = await prisma.workshop.findMany({
            include: { user: true }
        });
        res.json(workshops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar oficinas' });
    }
});

//OFICINAS

// GET: Buscar oficina por ID
app.get('/api/workshops/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workshop = await prisma.workshop.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada' });
        }
        res.json(workshop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar oficina' });
    }
});

// POST: Criar oficina
app.post('/api/workshops', async (req, res) => {
    try {
        const { userId, address, phone, subdomain } = req.body;
        if (!userId || !address || !phone) {
            return res.status(400).json({ error: 'userId, address e phone são obrigatórios' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: 'Usuário inválido' });
        }
        const workshop = await prisma.workshop.create({
            data: {
                userId,
                address,
                phone,
                subdomain,
                createdAt: new Date()
            }
        });
        res.status(201).json(workshop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar oficina' });
    }
});

// PUT: Atualizar oficina
app.put('/api/workshops/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, address, phone, subdomain } = req.body;
        if (!userId || !address || !phone) {
            return res.status(400).json({ error: 'userId, address e phone são obrigatórios' });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: 'Usuário inválido' });
        }
        const workshop = await prisma.workshop.update({
            where: { id },
            data: {
                userId,
                address,
                phone,
                subdomain
            }
        });
        res.json(workshop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar oficina' });
    }
});

// DELETE: Excluir oficina
app.delete('/api/workshops/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workshop = await prisma.workshop.findUnique({ where: { id } });
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada' });
        }
        await prisma.workshop.delete({ where: { id } });
        res.json({ message: 'Oficina excluída com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir oficina' });
    }
});

//VISTORIAS
// GET: Listar inspeções (apenas de veículos ativos do usuário)
app.get('/api/inspections', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        const inspections = await prisma.inspection.findMany({
            where: {
                uploadedById: userId
            },
            include: {
                vehicle: { include: { brand: true, model: true } },
                uploadedBy: true,
                attachments: true
            },
            orderBy: { createdAt: 'desc' },
        });
        // Mapeia os attachments para o formato esperado pelo frontend
        const mappedInspections = inspections.map(insp => ({
            ...insp,
            attachments: Array.isArray(insp.attachments)
                ? insp.attachments.map(att => ({
                    id: att.id,
                    url: att.fileUrl,
                    type: att.fileType,
                    name: att.fileUrl ? att.fileUrl.split('/').pop() : undefined,
                }))
                : [],
        }));
        res.json(mappedInspections);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar inspeções' });
    }
});

// GET: Buscar inspeção por ID
app.get('/api/inspections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const inspection = await prisma.inspection.findUnique({
            where: { id },
            include: {
                vehicle: { include: { brand: true, model: true } },
                uploadedBy: true,
                attachments: true
            }
        });
        if (!inspection) {
            return res.status(404).json({ error: 'Inspeção não encontrada' });
        }
        // Mapeia os attachments para o formato esperado pelo frontend
        const mappedInspection = {
            ...inspection,
            attachments: Array.isArray(inspection.attachments)
                ? inspection.attachments.map(att => ({
                    id: att.id,
                    url: att.fileUrl,
                    type: att.fileType,
                    name: att.fileUrl ? att.fileUrl.split('/').pop() : undefined,
                }))
                : [],
        };
        res.json(mappedInspection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar inspeção' });
    }
});

// POST: Criar inspeção
app.post('/api/inspections', async (req, res) => {
    try {
        const { vehicleId, status, company, date, fileUrl, uploadedById } = req.body;
        if (!vehicleId || !status || !company || !date || !uploadedById) {
            return res.status(400).json({ error: 'Campos obrigatórios: vehicleId, status, company, date, uploadedById' });
        }
        // fileUrl agora é opcional
        const user = await prisma.user.findUnique({ where: { id: uploadedById } });
        if (!user) {
            return res.status(400).json({ error: 'Usuário inválido' });
        }
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return res.status(400).json({ error: 'Veículo inválido' });
        }
        const inspection = await prisma.inspection.create({
            data: {
                vehicleId,
                status,
                company,
                date: new Date(date),
                fileUrl: fileUrl || null,
                uploadedById
            }
        });
        // Busca expandida igual ao GET /api/inspections/:id
        const expanded = await prisma.inspection.findUnique({
            where: { id: inspection.id },
            include: {
                vehicle: { include: { brand: true, model: true } },
                uploadedBy: true,
                attachments: true
            }
        });
        // Mapeia os attachments para o formato esperado pelo frontend
        const mappedInspection = {
            ...expanded,
            attachments: Array.isArray(expanded.attachments)
                ? expanded.attachments.map(att => ({
                    id: att.id,
                    url: att.fileUrl,
                    type: att.fileType,
                    name: att.fileUrl ? att.fileUrl.split('/').pop() : undefined,
                }))
                : [],
        };
        res.status(201).json(mappedInspection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar inspeção' });
    }
});

// PUT: Atualizar inspeção
app.put('/api/inspections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { vehicleId, status, company, date, fileUrl, uploadedById } = req.body;
        if (!vehicleId || !status || !company || !date || !uploadedById) {
            return res.status(400).json({ error: 'Campos obrigatórios: vehicleId, status, company, date, uploadedById' });
        }
        const user = await prisma.user.findUnique({ where: { id: uploadedById } });
        if (!user) {
            return res.status(400).json({ error: 'Usuário inválido' });
        }
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return res.status(400).json({ error: 'Veículo inválido' });
        }
        const inspection = await prisma.inspection.update({
            where: { id },
            data: {
                vehicleId,
                status,
                company,
                date: new Date(date),
                fileUrl,
                uploadedById
            }
        });
        res.json(inspection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar inspeção' });
    }
});

// DELETE: Excluir inspeção
app.delete('/api/inspections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const inspection = await prisma.inspection.findUnique({ where: { id } });
        if (!inspection) {
            return res.status(404).json({ error: 'Inspeção não encontrada' });
        }
        await prisma.$transaction([
            prisma.inspectionAttachment.deleteMany({ where: { inspectionId: id } }),
            prisma.inspection.delete({ where: { id } })
        ]);
        res.json({ message: 'Inspeção excluída com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir inspeção' });
    }
});

// MARCAS
app.get('/api/brands', async (req, res) => {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(brands);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar marcas' });
    }
});

// MODELOS POR MARCA
app.get('/api/brands/:brandId/models', async (req, res) => {
    try {
        const { brandId } = req.params;
        const models = await prisma.model.findMany({
            where: { brandId },
            orderBy: { name: 'asc' }
        });
        res.json(models);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar modelos' });
    }
});

// GET: Listar fotos de um veículo
app.get('/api/vehicles/:id/photos', async (req, res) => {
    try {
        const { id } = req.params;
        const photos = await prisma.vehiclePhoto.findMany({
            where: { vehicleId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(photos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar fotos do veículo' });
    }
});

// POST: Adicionar foto ao veículo (máx. 4, upload local)
app.post('/api/vehicles/:id/photos', upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        const count = await prisma.vehiclePhoto.count({ where: { vehicleId: id } });
        if (count >= 4) return res.status(400).json({ error: 'Limite de 4 fotos por veículo atingido' });
        if (!req.file) return res.status(400).json({ error: 'Arquivo de foto é obrigatório' });
        const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const photo = await prisma.vehiclePhoto.create({
            data: { url, vehicleId: id }
        });
        res.status(201).json(photo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar foto ao veículo' });
    }
});

// DELETE: Remover foto do veículo
app.delete('/api/vehicles/:vehicleId/photos/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        await prisma.vehiclePhoto.delete({ where: { id: photoId } });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover foto do veículo' });
    }
});

// AVALIAÇÃO DE OFICINAS (RATING)

// POST: Avaliar oficina
app.post('/api/workshops/:id/rate', async (req, res) => {
    try {
        const { id } = req.params; // workshopId
        const { userId, value, review } = req.body; // value: 1-5, review: array de string
        const ratingValue = Number(value);
        if (!userId || !ratingValue || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ error: 'userId e value (1-5) são obrigatórios' });
        }
        // Garante que a oficina existe
        const workshop = await prisma.workshop.findUnique({ where: { id } });
        if (!workshop) return res.status(404).json({ error: 'Oficina não encontrada' });
        // Garante que o usuário existe
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        // Limita o array de review a 10 itens e cada item a 40 caracteres
        let reviewArr = Array.isArray(review) ? review.map(r => String(r).trim().slice(0, 40)).slice(0, 10) : [];
        // Permite 1 avaliação por usuário/oficina (atualiza se já existir)
        const existing = await prisma.rating.findFirst({ where: { userId, workshopId: id } });
        let rating;
        if (existing) {
            rating = await prisma.rating.update({ where: { id: existing.id }, data: { value: ratingValue, review: reviewArr } });
        } else {
            rating = await prisma.rating.create({ data: { userId, workshopId: id, value: ratingValue, review: reviewArr } });
        }
        // Atualiza média na oficina
        const ratings = await prisma.rating.findMany({ where: { workshopId: id } });
        const avg = ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
        await prisma.workshop.update({ where: { id }, data: { rating: avg } });
        res.json({ success: true, rating: avg, userRating: rating.value });
    } catch (error) {
        console.error('Erro ao avaliar oficina:', error);
        res.status(500).json({ error: 'Erro ao avaliar oficina', details: error?.message });
    }
});

// GET: Listar avaliações de uma oficina
app.get('/api/workshops/:id/ratings', async (req, res) => {
    try {
        const { id } = req.params;
        const ratings = await prisma.rating.findMany({ where: { workshopId: id }, include: { user: true } });
        res.json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
});

// LOGIN (protótipo: email + cpfCnpj)
app.post('/api/login', async (req, res) => {
    try {
        const { email, cpfCnpj } = req.body;
        if (!email || !cpfCnpj) {
            return res.status(400).json({ error: 'Email e CPF/CNPJ são obrigatórios' });
        }
        const user = await prisma.user.findFirst({ where: { email, cpfCnpj } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        // Para produção, gere e retorne um JWT aqui
        res.json({
            userId: user.id,
            name: user.name,
            email: user.email,
            profile: user.profile,
            type: user.type
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao autenticar' });
    }
});

// ESTATÍSTICAS HOME
app.get('/api/statistics', async (req, res) => {
    try {
        const { userId, profile } = req.query;
        if (!userId || !profile) {
            return res.status(400).json({ error: 'userId e profile são obrigatórios' });
        }
        if (profile === 'car_owner') {
            // Gasto total e por tipo
            const maints = await prisma.maintenance.findMany({
                where: { vehicle: { ownerId: userId, active: true } },
                include: { workshop: true }
            });
            const totalSpent = maints.reduce((sum, m) => sum + (m.value || 0), 0);
            // Agrupar por descrição (tipo de serviço)
            const spentByType = {};
            maints.forEach(m => {
                const key = m.description || 'Outro';
                spentByType[key] = (spentByType[key] || 0) + (m.value || 0);
            });
            // Período médio entre manutenções
            const sorted = maints.map(m => new Date(m.date)).sort((a, b) => a - b);
            let maintenancePeriod = null;
            if (sorted.length > 1) {
                let totalDiff = 0;
                for (let i = 1; i < sorted.length; i++) {
                    totalDiff += (sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24);
                }
                maintenancePeriod = Math.round(totalDiff / (sorted.length - 1));
            }
            // Oficina mais usada
            const workshopCount = {};
            maints.forEach(m => {
                if (m.workshopId) {
                    workshopCount[m.workshopId] = (workshopCount[m.workshopId] || 0) + 1;
                }
            });
            let mostUsedWorkshop = null;
            if (Object.keys(workshopCount).length > 0) {
                const maxId = Object.keys(workshopCount).reduce((a, b) => workshopCount[a] > workshopCount[b] ? a : b);
                const workshop = await prisma.workshop.findUnique({ where: { id: maxId } });
                mostUsedWorkshop = workshop ? { name: workshop.address, count: workshopCount[maxId] } : null;
            }
            return res.json({ totalSpent, spentByType, maintenancePeriod, mostUsedWorkshop });
        }
        if (profile === 'wshop_owner') {
            // Descobre a oficina do usuário logado
            const workshop = await prisma.workshop.findFirst({ where: { userId: userId } });
            if (!workshop) return res.json({ totalClients: 0, totalMaintenances: 0, averageRating: null, mostCommonService: null, totalRevenue: 0 });
            // Total de clientes únicos
            const maints = await prisma.maintenance.findMany({
                where: { workshopId: workshop.id },
                include: { vehicle: { select: { ownerId: true } } }
            });
            const clientSet = new Set();
            maints.forEach(m => m.vehicle?.ownerId && clientSet.add(m.vehicle.ownerId));
            // Total de manutenções
            const totalMaintenances = maints.length;
            // Média de avaliações
            const ratings = await prisma.rating.findMany({ where: { workshopId: workshop.id } });
            const averageRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length).toFixed(2) : null;
            // Serviço mais comum
            const serviceCount = {};
            maints.forEach(m => {
                const key = m.description || 'Outro';
                serviceCount[key] = (serviceCount[key] || 0) + 1;
            });
            let mostCommonService = null;
            if (Object.keys(serviceCount).length > 0) {
                mostCommonService = Object.keys(serviceCount).reduce((a, b) => serviceCount[a] > serviceCount[b] ? a : b);
            }
            // Faturamento total
            const totalRevenue = maints.reduce((sum, m) => sum + (m.value || 0), 0);
            return res.json({
                totalClients: clientSet.size,
                totalMaintenances,
                averageRating,
                mostCommonService,
                totalRevenue
            });
        }
        // Admin: não retorna estatísticas por enquanto
        return res.status(403).json({ error: 'Estatísticas não disponíveis para este perfil' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// FAVORITOS DE OFICINA

// POST: Adicionar oficina aos favoritos do usuário
app.post('/api/workshops/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params; // workshopId
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        // Cria relação se não existir
        const existing = await prisma.workshopFavorite.findFirst({ where: { userId, workshopId: id } });
        if (!existing) {
            await prisma.workshopFavorite.create({ data: { userId, workshopId: id } });
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao favoritar oficina' });
    }
});

// DELETE: Remover oficina dos favoritos do usuário
app.delete('/api/workshops/:id/favorite', async (req, res) => {
    try {
        const { id } = req.params; // workshopId
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId é obrigatório' });
        await prisma.workshopFavorite.deleteMany({ where: { userId, workshopId: id } });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover favorito' });
    }
});

// GET: Listar oficinas favoritas do usuário
app.get('/api/users/:userId/favorite-workshops', async (req, res) => {
    try {
        const { userId } = req.params;
        const favorites = await prisma.workshopFavorite.findMany({
            where: { userId },
            include: { workshop: { include: { user: true } } },
        });
        res.json(favorites.map(f => f.workshop));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar favoritos' });
    }
});

// Upload de anexo (foto ou PDF) para inspeção
app.post('/api/inspections/:id/attachments', attachmentUpload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const count = await prisma.inspectionAttachment.count({ where: { inspectionId: id } });
        if (count >= 5) return res.status(400).json({ error: 'Limite de 5 anexos por inspeção atingido' });
        if (!req.file) return res.status(400).json({ error: 'Arquivo é obrigatório' });
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        const fileType = req.file.mimetype;
        const attachment = await prisma.inspectionAttachment.create({
            data: { inspectionId: id, fileUrl, fileType }
        });
        res.status(201).json({
            id: attachment.id,
            url: fileUrl,
            type: fileType,
            name: req.file.originalname
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao adicionar anexo à inspeção' });
    }
});

// Listar anexos de uma inspeção
app.get('/api/inspections/:id/attachments', async (req, res) => {
    try {
        const { id } = req.params;
        const attachments = await prisma.inspectionAttachment.findMany({
            where: { inspectionId: id },
            orderBy: { createdAt: 'asc' }
        });
        // Mapeia para o formato esperado pelo frontend
        const mapped = attachments.map(att => ({
            id: att.id,
            url: att.fileUrl,
            type: att.fileType,
            name: att.fileUrl ? att.fileUrl.split('/').pop() : undefined,
        }));
        res.json(mapped);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar anexos da inspeção' });
    }
});

// Remover anexo de inspeção
app.delete('/api/inspections/:inspectionId/attachments/:attachmentId', async (req, res) => {
    try {
        const { attachmentId } = req.params;
        await prisma.inspectionAttachment.delete({ where: { id: attachmentId } });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover anexo da inspeção' });
    }
});

// --- DASHBOARD ---

// GET: Dashboard summary (totais gerais do usuário)
app.get('/api/dashboard/summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Buscando summary para usuário:', userId);

        // Primeiro, verificar se o usuário existe
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.log('❌ Usuário não encontrado:', userId);
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        console.log('👤 Usuário encontrado:', user.name, '- Perfil:', user.profile);

        // Total de veículos do usuário
        const totalVehicles = await prisma.vehicle.count({
            where: { ownerId: userId }
        });
        console.log('🚗 Total de veículos:', totalVehicles);

        // Total de manutenções de todos os veículos do usuário
        const totalMaintenances = await prisma.maintenance.count({
            where: { vehicle: { ownerId: userId } }
        });
        console.log('🔧 Total de manutenções:', totalMaintenances);

        // Gasto total e médio de todas as manutenções
        const maintenances = await prisma.maintenance.findMany({
            where: { vehicle: { ownerId: userId } },
            select: { value: true }
        });

        const totalSpending = maintenances.reduce((sum, m) => sum + (m.value || 0), 0);
        const averageSpending = totalMaintenances > 0 ? totalSpending / totalMaintenances : 0;
        console.log('💰 Total gasto:', totalSpending, 'Média:', averageSpending);

        // Total de oficinas utilizadas (únicas)
        const workshopsUsed = await prisma.maintenance.findMany({
            where: { vehicle: { ownerId: userId } },
            select: { workshopId: true },
            distinct: ['workshopId']
        });
        const totalWorkshopsUsed = workshopsUsed.length;
        console.log('🏪 Total de oficinas utilizadas:', totalWorkshopsUsed);

        const result = {
            totalVehicles,
            totalMaintenances,
            averageSpending: Number(averageSpending.toFixed(2)),
            totalWorkshopsUsed
        };

        console.log('📈 Resultado final:', result);
        res.json(result);
    } catch (error) {
        console.error('❌ Erro detalhado no summary:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
});

// GET: Dashboard por veículo
app.get('/api/dashboard/vehicles/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('🔍 Buscando veículos para usuário:', userId);

        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: userId },
            include: {
                brand: true,
                model: true,
                maintenances: {
                    select: {
                        id: true,
                        value: true,
                        description: true,
                        date: true,
                        mileage: true
                    },
                    orderBy: { date: 'desc' }
                }
            }
        });

        console.log('📊 Veículos encontrados:', vehicles.length);

        const vehicleData = vehicles.map(vehicle => {
            const totalMaintenances = vehicle.maintenances.length;
            const totalSpending = vehicle.maintenances.reduce((sum, m) => sum + (m.value || 0), 0);
            const averageSpending = totalMaintenances > 0 ? totalSpending / totalMaintenances : 0;

            // Pegar a quilometragem da última manutenção ou usar 0
            const currentKm = vehicle.maintenances.length > 0
                ? vehicle.maintenances[0].mileage || 0
                : 0;

            console.log(`📋 Veículo ${vehicle.brand.name} ${vehicle.model.name}: ${totalMaintenances} manutenções, R$ ${totalSpending.toFixed(2)} total`);

            return {
                id: vehicle.id,
                brand: vehicle.brand.name,
                model: vehicle.model.name,
                licensePlate: vehicle.licensePlate,
                currentKm,
                totalMaintenances,
                averageSpending: Number(averageSpending.toFixed(2)),
                upcomingMaintenances: [] // TODO: implementar lógica de próximas manutenções
            };
        });

        console.log('📊 Dados processados:', vehicleData);
        res.json(vehicleData);
    } catch (error) {
        console.error('Erro detalhado:', error);
        res.status(500).json({ error: 'Erro ao buscar dados dos veículos' });
    }
});

// GET: Buscar última manutenção de um veículo
app.get('/api/vehicles/:id/last-maintenance', async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar a última manutenção do veículo ordenada por data e KM
        const lastMaintenance = await prisma.maintenance.findFirst({
            where: { vehicleId: id },
            orderBy: [
                { date: 'desc' },
                { mileage: 'desc' }
            ],
            select: {
                id: true,
                date: true,
                mileage: true,
                description: true,
                workshop: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!lastMaintenance) {
            return res.json({ hasLastMaintenance: false });
        }

        res.json({
            hasLastMaintenance: true,
            lastMaintenance: {
                id: lastMaintenance.id,
                date: lastMaintenance.date,
                mileage: lastMaintenance.mileage,
                description: lastMaintenance.description,
                workshopName: lastMaintenance.workshop?.name
            }
        });
    } catch (error) {
        console.error('Erro ao buscar última manutenção:', error);
        res.status(500).json({ error: 'Erro ao buscar última manutenção' });
    }
});

// SISTEMA DE STATUS AUTOMÁTICO

// POST: Atualizar status das manutenções automaticamente
app.post('/api/maintenances/update-status', async (req, res) => {
    try {
        console.log('🔄 Iniciando atualização automática de status das manutenções...');

        // Buscar manutenções que precisam de atualização de status
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // 1. Atualizar de 'registrado' para 'pendente' (após 2 dias)
        const maintenancesToPending = await prisma.maintenance.findMany({
            where: {
                validationStatus: 'registrado',
                createdAt: {
                    lte: twoDaysAgo
                }
            }
        });

        let updatedToPending = 0;
        for (const maintenance of maintenancesToPending) {
            await prisma.maintenance.update({
                where: { id: maintenance.id },
                data: { validationStatus: 'pendente' }
            });
            updatedToPending++;
        }

        console.log(`📊 Status de validação atualizado: ${updatedToPending} manutenções mudaram para 'pendente'`);

        res.json({
            success: true,
            updatedToPending,
            message: `Status automático atualizado com sucesso. ${updatedToPending} manutenções atualizadas.`
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar status das manutenções:', error);
        res.status(500).json({ error: 'Erro ao atualizar status das manutenções' });
    }
});

// PUT: Oficina valida manutenção (muda status para 'validated')
app.put('/api/maintenances/:id/validate', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // ID do usuário da oficina que está validando

        if (!userId) {
            return res.status(400).json({ error: 'userId é obrigatório' });
        }

        // Verificar se o usuário é dono de uma oficina
        const workshop = await prisma.workshop.findFirst({ where: { userId } });
        if (!workshop) {
            return res.status(403).json({ error: 'Apenas oficinas podem validar manutenções' });
        }

        // Buscar a manutenção
        const maintenance = await prisma.maintenance.findUnique({ where: { id } });
        if (!maintenance) {
            return res.status(404).json({ error: 'Manutenção não encontrada' });
        }

        // Verificar se a manutenção pertence à oficina do usuário
        if (maintenance.workshopId !== workshop.id) {
            return res.status(403).json({ error: 'Você só pode validar manutenções da sua oficina' });
        }

        // Atualizar validationStatus para validado
        const updatedMaintenance = await prisma.maintenance.update({
            where: { id },
            data: { validationStatus: 'validado' },
            include: {
                vehicle: { include: { brand: true, model: true } },
                workshop: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        user: { select: { name: true } },
                    }
                }
            }
        });

        console.log(`✅ Manutenção ${id} validada pela oficina ${workshop.name}`);
        res.json({ success: true, maintenance: updatedMaintenance });
    } catch (error) {
        console.error('❌ Erro ao validar manutenção:', error);
        res.status(500).json({ error: 'Erro ao validar manutenção' });
    }
});

// GET: Buscar manutenções pendentes de validação para uma oficina
app.get('/api/workshops/:userId/pending-maintenances', async (req, res) => {
    try {
        const { userId } = req.params; // userId do dono da oficina

        // Primeiro, encontrar a oficina do usuário
        const workshop = await prisma.workshop.findFirst({ where: { userId } });
        if (!workshop) {
            return res.status(404).json({ error: 'Oficina não encontrada para este usuário' });
        }

        const pendingMaintenances = await prisma.maintenance.findMany({
            where: {
                workshopId: workshop.id,
                validationStatus: 'pendente'
            },
            include: {
                vehicle: {
                    include: {
                        brand: true,
                        model: true,
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(pendingMaintenances);
    } catch (error) {
        console.error('❌ Erro ao buscar manutenções pendentes:', error);
        res.status(500).json({ error: 'Erro ao buscar manutenções pendentes' });
    }
});

// GET: Buscar serviços mais comuns de uma oficina
app.get('/api/workshops/:id/common-services', async (req, res) => {
    try {
        const { id: workshopId } = req.params;
        const { limit = 8 } = req.query;

        console.log('🔍 Buscando serviços comuns da oficina:', workshopId);

        const maintenances = await prisma.maintenance.findMany({
            where: { workshopId },
            select: { description: true }
        });

        if (maintenances.length === 0) {
            return res.json({ services: [] });
        }

        const serviceCount = {};
        const predefinedServices = [
            'Troca de óleo',
            'Troca de filtros',
            'Alinhamento',
            'Balanceamento',
            'Freios',
            'Suspensão',
            'Ar condicionado',
            'Bateria',
            'Pneus',
            'Revisão geral',
            'Embreagem',
            'Radiador'
        ];

        maintenances.forEach(maintenance => {
            const description = maintenance.description.toLowerCase();
            predefinedServices.forEach(service => {
                const serviceKey = service.toLowerCase();
                if (description.includes(serviceKey)) {
                    serviceCount[service] = (serviceCount[service] || 0) + 1;
                }
            });
        });

        const sortedServices = Object.entries(serviceCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, parseInt(limit))
            .map(([service, count]) => ({
                name: service,
                count: count,
                percentage: Math.round((count / maintenances.length) * 100)
            }));

        console.log(`📊 Serviços mais comuns encontrados: ${sortedServices.length}`);

        res.json({
            services: sortedServices.map(s => s.name),
            details: sortedServices,
            totalMaintenances: maintenances.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar serviços comuns:', error);
        res.status(500).json({ error: 'Erro ao buscar serviços comuns da oficina' });
    }
});

// GET: Buscar summary do usuário (compatibilidade com versão anterior)
app.get('/api/users/:id/summary', async (req, res) => {
    try {
        const { id: userId } = req.params;

        console.log('🔍 Buscando summary para usuário:', userId);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        console.log(`👤 Usuário encontrado: ${user.name} - Perfil: ${user.profile}`);

        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: userId, active: true },
            include: {
                brand: true,
                model: true,
                maintenances: {
                    include: {
                        workshop: true
                    },
                    orderBy: { date: 'desc' }
                }
            }
        });

        console.log(`🚗 Total de veículos: ${vehicles.length}`);

        const vehiclesData = vehicles.map(vehicle => {
            const maintenances = vehicle.maintenances || [];
            const totalSpending = maintenances.reduce((sum, m) => sum + m.value, 0);
            const currentKm = maintenances.length > 0 ? maintenances[0].mileage : 0;

            console.log(`📋 Veículo ${vehicle.brand.name} ${vehicle.model.name}: ${maintenances.length} manutenções, R$ ${totalSpending.toFixed(2)} total`);

            return {
                id: vehicle.id,
                brand: vehicle.brand.name,
                model: vehicle.model.name,
                licensePlate: vehicle.licensePlate,
                currentKm: currentKm,
                totalMaintenances: maintenances.length,
                averageSpending: maintenances.length > 0 ? totalSpending / maintenances.length : 0,
                upcomingMaintenances: []
            };
        });

        console.log('📊 Veículos encontrados:', vehiclesData.length);

        const totalMaintenances = vehiclesData.reduce((sum, v) => sum + v.totalMaintenances, 0);
        const totalSpending = vehiclesData.reduce((sum, v) => sum + (v.averageSpending * v.totalMaintenances), 0);
        const averageSpending = totalMaintenances > 0 ? totalSpending / totalMaintenances : 0;

        console.log(`🔧 Total de manutenções: ${totalMaintenances}`);
        console.log(`💰 Total gasto: ${totalSpending} Média: ${averageSpending}`);

        const allMaintenances = vehicles.flatMap(v => v.maintenances);
        const uniqueWorkshops = new Set(allMaintenances.map(m => m.workshopId).filter(Boolean));

        console.log(`🏪 Total de oficinas utilizadas: ${uniqueWorkshops.size}`);

        const summary = {
            totalVehicles: vehicles.length,
            totalMaintenances: totalMaintenances,
            averageSpending: Math.round(averageSpending),
            totalWorkshopsUsed: uniqueWorkshops.size
        };

        console.log('📈 Resultado final:', summary);

        res.json(summary);
    } catch (error) {
        console.error('❌ Erro ao buscar summary:', error);
        res.status(500).json({ error: 'Erro ao buscar resumo do usuário' });
    }
});

// SISTEMA DE SCHEDULER PARA STATUS AUTOMÁTICO

// Função que executa a cada 24 horas para atualizar status
const runStatusUpdateScheduler = () => {
    console.log('🕐 Iniciando scheduler de status automático...');

    const updateStatuses = async () => {
        try {
            console.log('🔄 Executando atualização automática de status...');

            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            // Atualizar de 'registrado' para 'pendente' (após 2 dias)
            const result = await prisma.maintenance.updateMany({
                where: {
                    validationStatus: 'registrado',
                    createdAt: {
                        lte: twoDaysAgo
                    }
                },
                data: {
                    validationStatus: 'pendente'
                }
            });

            if (result.count > 0) {
                console.log(`✅ ${result.count} manutenções atualizadas para validationStatus 'pendente'`);
            } else {
                console.log('📊 Nenhuma manutenção precisava de atualização de validationStatus');
            }
        } catch (error) {
            console.error('❌ Erro no scheduler de status:', error);
        }
    };

    // Executar imediatamente
    updateStatuses();

    // Executar a cada 24 horas (86400000 ms)
    setInterval(updateStatuses, 24 * 60 * 60 * 1000);
};

// Iniciar o scheduler ao subir o servidor
runStatusUpdateScheduler();

// Função para gerar código de validação único
function generateValidationCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `VAL-${timestamp}-${random}`.toUpperCase();
}

app.listen(3000, () => {
    console.log('🚀 Backend rodando na porta 3000');
    console.log('📱 API disponível em: http://localhost:3000');
    console.log('🚀 Iniciando sistema de status automático...');
    runStatusUpdateScheduler();
});