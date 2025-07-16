import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Maintenance, Vehicle, Workshop } from '../types';

const Maintenances: React.FC = () => {
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        vehicleId: '',
        workshopId: '',
        date: '',
        description: '',
        value: 0,
        status: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [maintenancesRes, vehiclesRes, workshopsRes] = await Promise.all([
                    fetch('/api/maintenances'),
                    fetch('/api/vehicles'),
                    fetch('/api/workshops')
                ]);
                if (!maintenancesRes.ok) throw new Error('Erro ao buscar manutenções');
                if (!vehiclesRes.ok) throw new Error('Erro ao buscar veículos');
                if (!workshopsRes.ok) throw new Error('Erro ao buscar oficinas');
                const maintenancesData = await maintenancesRes.json();
                const vehiclesData = await vehiclesRes.json();
                const workshopsData = await workshopsRes.json();
                setMaintenances(maintenancesData);
                setVehicles(vehiclesData);
                setWorkshops(workshopsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === 'value' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditing ? `/api/maintenances/${formData.id}` : '/api/maintenances';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} manutenção`);
            const updatedMaintenance = await response.json();
            if (isEditing) {
                setMaintenances((prev) =>
                    prev.map((m) => (m.id === updatedMaintenance.id ? updatedMaintenance : m))
                );
            } else {
                setMaintenances((prev) => [...prev, updatedMaintenance]);
            }
            resetForm();
        } catch (error) {
            console.error(error);
            alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} manutenção`);
        }
    };

    const handleEdit = (maintenance: Maintenance) => {
        setFormData({
            id: maintenance.id,
            vehicleId: maintenance.vehicleId,
            workshopId: maintenance.workshopId,
            date: maintenance.date.split('T')[0],
            description: maintenance.description,
            value: maintenance.value,
            status: maintenance.status || ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;
        try {
            const response = await fetch(`/api/maintenances/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir manutenção');
            setMaintenances((prev) => prev.filter((m) => m.id !== id));
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir manutenção');
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            vehicleId: '',
            workshopId: '',
            date: '',
            description: '',
            value: 0,
            status: ''
        });
        setIsEditing(false);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <h1>Lista de Manutenções</h1>
            <Link to="/">Voltar</Link>

            <h2>{isEditing ? 'Editar Manutenção' : 'Adicionar Manutenção'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Veículo:</label>
                    <select
                        name="vehicleId"
                        value={formData.vehicleId}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Selecione um veículo</option>
                        {vehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                                {vehicle.licensePlate}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Oficina:</label>
                    <select
                        name="workshopId"
                        value={formData.workshopId}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Selecione uma oficina</option>
                        {workshops.map((workshop) => (
                            <option key={workshop.id} value={workshop.id}>
                                {workshop.address}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Data:</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Descrição:</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Valor:</label>
                    <input
                        type="number"
                        name="value"
                        value={formData.value}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label>Status:</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} required>
                        <option value="">Selecione um status</option>
                        <option value="PENDING">Pendente</option>
                        <option value="IN_PROGRESS">Em Andamento</option>
                        <option value="COMPLETED">Concluído</option>
                    </select>
                </div>
                <button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancelar</button>}
            </form>

            {maintenances.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Veículo</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {maintenances.map((maintenance) => (
                            <tr key={maintenance.id}>
                                <td>{new Date(maintenance.date).toLocaleDateString()}</td>
                                <td>{maintenance.description}</td>
                                <td>{maintenance.vehicle?.licensePlate || 'N/A'}</td>
                                <td>{maintenance.value.toFixed(2)}</td>
                                <td>{maintenance.status || 'N/A'}</td>
                                <td>
                                    <button onClick={() => handleEdit(maintenance)}>Editar</button>
                                    <button onClick={() => handleDelete(maintenance.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhuma manutenção encontrada.</p>
            )}
        </div>
    );
};

export default Maintenances;