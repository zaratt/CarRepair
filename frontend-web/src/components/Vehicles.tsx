import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Vehicle } from '../types';

const Vehicles: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        licensePlate: '',
        model: '',
        year: 0,
        ownerId: '',
        vin: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vehiclesRes, usersRes] = await Promise.all([
                    fetch('/api/vehicles'),
                    fetch('/api/users')
                ]);
                if (!vehiclesRes.ok) throw new Error('Erro ao buscar veículos');
                if (!usersRes.ok) throw new Error('Erro ao buscar usuários');
                const vehiclesData = await vehiclesRes.json();
                const usersData = await usersRes.json();
                setVehicles(vehiclesData);
                setUsers(usersData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.licensePlate) newErrors.licensePlate = 'Placa é obrigatória';
        else if (!/^[A-Z0-9]{7}$/.test(formData.licensePlate)) newErrors.licensePlate = 'Placa inválida (7 caracteres alfanuméricos)';
        if (!formData.model) newErrors.model = 'Modelo é obrigatório';
        if (!formData.year) newErrors.year = 'Ano é obrigatório';
        else if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
            newErrors.year = 'Ano inválido';
        }
        if (!formData.vin) newErrors.vin = 'VIN é obrigatório';
        else if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(formData.vin)) newErrors.vin = 'VIN inválido (17 caracteres alfanuméricos)';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: name === 'year' ? parseInt(value) : value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        console.log('Form Data:', formData); // Log para depuração
        try {
            const url = isEditing ? `/api/vehicles/${formData.id}` : '/api/vehicles';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} veículo`);
            }
            const updatedVehicle = await response.json();
            if (isEditing) {
                setVehicles((prev) => prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
            } else {
                setVehicles((prev) => [...prev, updatedVehicle]);
            }
            resetForm();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setFormData({
            id: vehicle.id,
            licensePlate: vehicle.licensePlate,
            model: vehicle.model,
            year: vehicle.year,
            ownerId: vehicle.ownerId || '',
            vin: vehicle.vin || ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
        try {
            const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir veículo');
            }
            setVehicles((prev) => prev.filter((v) => v.id !== id));
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            licensePlate: '',
            model: '',
            year: 0,
            ownerId: '',
            vin: ''
        });
        setErrors({});
        setIsEditing(false);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <h1>Lista de Veículos</h1>
            <Link to="/">Voltar</Link>

            <h2>{isEditing ? 'Editar Veículo' : 'Adicionar Veículo'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Placa:</label>
                    <input
                        type="text"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.licensePlate && <span style={{ color: 'red' }}>{errors.licensePlate}</span>}
                </div>
                <div>
                    <label>Modelo:</label>
                    <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.model && <span style={{ color: 'red' }}>{errors.model}</span>}
                </div>
                <div>
                    <label>Ano:</label>
                    <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.year && <span style={{ color: 'red' }}>{errors.year}</span>}
                </div>
                <div>
                    <label>Proprietário:</label>
                    <select name="ownerId" value={formData.ownerId} onChange={handleInputChange}>
                        <option value="">Selecione um usuário</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>RENAVAM:</label>
                    <input
                        type="text"
                        name="vin"
                        value={formData.vin}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.vin && <span style={{ color: 'red' }}>{errors.vin}</span>}
                </div>
                <button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancelar</button>}
            </form>

            {vehicles.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Placa</th>
                            <th>Modelo</th>
                            <th>Ano</th>
                            <th>Renavam</th>
                            <th>Proprietário</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map((vehicle) => (
                            <tr key={vehicle.id}>
                                <td>{vehicle.licensePlate}</td>
                                <td>{vehicle.model}</td>
                                <td>{vehicle.year}</td>
                                <td>{vehicle.vin || 'N/A'}</td>
                                <td>{vehicle.owner?.name || 'N/A'}</td> {/* Proprietário */}
                                <td>
                                    <button onClick={() => handleEdit(vehicle)}>Editar</button>
                                    <button onClick={() => handleDelete(vehicle.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhum veículo encontrado.</p>
            )}
        </div>
    );
};

export default Vehicles;