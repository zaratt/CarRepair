import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Workshop } from '../types';

const Workshops: React.FC = () => {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        userId: '',
        address: '',
        phone: '',
        subdomain: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workshopsRes, usersRes] = await Promise.all([
                    fetch('/api/workshops'),
                    fetch('/api/users')
                ]);
                if (!workshopsRes.ok) throw new Error('Erro ao buscar oficinas');
                if (!usersRes.ok) throw new Error('Erro ao buscar usuários');
                const workshopsData = await workshopsRes.json();
                const usersData = await usersRes.json();
                setWorkshops(workshopsData);
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
        if (!formData.userId) newErrors.userId = 'Usuário é obrigatório';
        if (!formData.address) newErrors.address = 'Endereço é obrigatório';
        if (!formData.phone) newErrors.phone = 'Telefone é obrigatório';
        else if (!/^\d{10,11}$/.test(formData.phone)) newErrors.phone = 'Telefone inválido (10-11 dígitos)';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const url = isEditing ? `/api/workshops/${formData.id}` : '/api/workshops';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} oficina`);
            }
            const updatedWorkshop = await response.json();
            if (isEditing) {
                setWorkshops((prev) =>
                    prev.map((w) => (w.id === updatedWorkshop.id ? updatedWorkshop : w))
                );
            } else {
                setWorkshops((prev) => [...prev, updatedWorkshop]);
            }
            resetForm();
        } catch (error: any) {
            console.error("Ocorreu um erro desconhecido:", error.message);
            alert(`Error: ${error.message}`);
        }
    };

    const handleEdit = (workshop: Workshop) => {
        setFormData({
            id: workshop.id,
            userId: workshop.userId,
            address: workshop.address,
            phone: workshop.phone,
            subdomain: workshop.subdomain || ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta oficina?')) return;
        try {
            const response = await fetch(`/api/workshops/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir oficina');
            }
            setWorkshops((prev) => prev.filter((w) => w.id !== id));
        } catch (error: any) {
            console.error("Ocorreu um erro desconhecido:", error.message);
            alert(`Error: ${error.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            userId: '',
            address: '',
            phone: '',
            subdomain: ''
        });
        setErrors({});
        setIsEditing(false);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <h1>Lista de Oficinas</h1>
            <Link to="/">Voltar</Link>

            <h2>{isEditing ? 'Editar Oficina' : 'Adicionar Oficina'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Usuário:</label>
                    <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Selecione um usuário</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                    {errors.userId && <span style={{ color: 'red' }}>{errors.userId}</span>}
                </div>
                <div>
                    <label>Endereço:</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.address && <span style={{ color: 'red' }}>{errors.address}</span>}
                </div>
                <div>
                    <label>Telefone:</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.phone && <span style={{ color: 'red' }}>{errors.phone}</span>}
                </div>
                <div>
                    <label>Subdomínio:</label>
                    <input
                        type="text"
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleInputChange}
                    />
                </div>
                <button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancelar</button>}
            </form>

            {workshops.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Endereço</th>
                            <th>Telefone</th>
                            <th>Usuário</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workshops.map((workshop) => (
                            <tr key={workshop.id}>
                                <td>{workshop.address}</td>
                                <td>{workshop.phone}</td>
                                <td>{workshop.user?.name || 'N/A'}</td>
                                <td>
                                    <button onClick={() => handleEdit(workshop)}>Editar</button>
                                    <button onClick={() => handleDelete(workshop.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhuma oficina encontrada.</p>
            )}
        </div>
    );
};

export default Workshops;