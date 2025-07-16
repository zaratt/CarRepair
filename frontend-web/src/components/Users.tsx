import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        cpfCnpj: '',
        type: '',
        profile: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users');
                if (!response.ok) throw new Error('Erro ao buscar usuários');
                const data = await response.json();
                setUsers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name) newErrors.name = 'Nome é obrigatório';
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.cpfCnpj) newErrors.cpfCnpj = 'CPF/CNPJ é obrigatório';
        else if (!/^\d{11}$|^\d{14}$/.test(formData.cpfCnpj)) newErrors.cpfCnpj = 'CPF/CNPJ inválido (11 ou 14 dígitos)';
        if (!formData.type) newErrors.type = 'Tipo é obrigatório';
        if (!formData.profile) newErrors.profile = 'Perfil é obrigatório';
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
            const url = isEditing ? `/api/users/${formData.id}` : '/api/users';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} usuário`);
            }
            const updatedUser = await response.json();
            if (isEditing) {
                setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            } else {
                setUsers((prev) => [...prev, updatedUser]);
            }
            resetForm();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleEdit = (user: User) => {
        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            cpfCnpj: user.cpfCnpj,
            type: user.type,
            profile: user.profile
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir usuário');
            }
            setUsers((prev) => prev.filter((u) => u.id !== id));
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            email: '',
            cpfCnpj: '',
            type: '',
            profile: ''
        });
        setErrors({});
        setIsEditing(false);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <h1>Lista de Usuários</h1>
            <Link to="/">Voltar</Link>

            <h2>{isEditing ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nome:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.name && <span style={{ color: 'red' }}>{errors.name}</span>}
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
                </div>
                <div>
                    <label>CPF/CNPJ:</label>
                    <input
                        type="text"
                        name="cpfCnpj"
                        value={formData.cpfCnpj}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.cpfCnpj && <span style={{ color: 'red' }}>{errors.cpfCnpj}</span>}
                </div>
                <div>
                    <label>Tipo:</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} required>
                        <option value="">Selecione um tipo</option>
                        <option value="individual">Individual</option>
                        <option value="company">Empresa</option>
                    </select>
                    {errors.type && <span style={{ color: 'red' }}>{errors.type}</span>}
                </div>
                <div>
                    <label>Perfil:</label>
                    <select name="profile" value={formData.profile} onChange={handleInputChange} required>
                        <option value="">Selecione um perfil</option>
                        <option value="user">Usuário</option>
                        <option value="admin">Administrador</option>
                    </select>
                    {errors.profile && <span style={{ color: 'red' }}>{errors.profile}</span>}
                </div>
                <button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancelar</button>}
            </form>

            {users.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>CPF/CNPJ</th>
                            <th>Tipo</th>
                            <th>Perfil</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.cpfCnpj}</td>
                                <td>{user.type}</td>
                                <td>{user.profile}</td>
                                <td>
                                    <button onClick={() => handleEdit(user)}>Editar</button>
                                    <button onClick={() => handleDelete(user.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhum usuário encontrado.</p>
            )}
        </div>
    );
};

export default Users;