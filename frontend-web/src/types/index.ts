export interface User {
    id: string;
    name: string;
    email: string;
    cpfCnpj: string;
    type: string;
    profile: string;
    createdAt?: string;
}


export interface Maintenance {
    id: string;
    vehicleId: string;
    workshopId: string;
    date: string;
    description: string;
    value: number;
    status?: string;
    createdAt: string;
    vehicle?: { licensePlate: string };
    workshop?: { address: string };
}

export interface Vehicle {
    id: string;
    licensePlate: string;
    model: string;
    year: number;
    vin: string; // Adicionado
    ownerId?: string;
    owner?: {
        id: string;
        name: string;
        email: string;
        cpfCnpj: string;
        type: string;
        profile: string;
    };
    createdAt: string;
}

export interface Workshop {
    id: string;
    userId: string;
    address: string;
    phone: string;
    subdomain?: string;
    user?: { name: string };
}

export interface Inspection {
    id: string;
    maintenanceId: string;
    fileUrl: string;
    uploadedById: string;
    createdAt?: string;
    maintenance?: { id: string; description: string };
    uploadedBy?: { id: string; name: string };
}