import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inspection, Maintenance, User } from '../types';

// ✅ SEGURANÇA XSS: Função para sanitizar URLs (CWE-79 Prevention)
const sanitizeUrl = (url: string): string => {
    // Verifica se a URL começa com http:// ou https://
    const isValidUrl = /^https?:\/\/[^\s]+$/.test(url);
    return isValidUrl ? url : '#'; // Retorna '#' se a URL for inválida
};

// ✅ SEGURANÇA XSS: Função para exibir texto seguro do link (CWE-79 Prevention)
const safeDisplayText = (url: string): string => {
    // Evita exibir URLs potencialmente perigosas diretamente
    return sanitizeUrl(url) !== '#' ? url : 'URL inválida';
};

const Inspections: React.FC = () => {
    const [inspections, setInspections] = useState<Inspection[]>([]);
    const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        maintenanceId: '',
        fileUrl: '',
        uploadedById: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [inspectionsRes, maintenancesRes, usersRes] = await Promise.all([
                    fetch('/api/inspections'),
                    fetch('/api/maintenances'),
                    fetch('/api/users')
                ]);
                if (!inspectionsRes.ok) throw new Error('Erro ao buscar inspeções');
                if (!maintenancesRes.ok) throw new Error('Erro ao buscar manutenções');
                if (!usersRes.ok) throw new Error('Erro ao buscar usuários');
                const inspectionsData = await inspectionsRes.json();
                const maintenancesData = await maintenancesRes.json();
                const usersData = await usersRes.json();
                setInspections(inspectionsData);
                setMaintenances(maintenancesData);
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
        if (!formData.maintenanceId) newErrors.maintenanceId = 'Manutenção é obrigatória';
        if (!formData.fileUrl) newErrors.fileUrl = 'URL do arquivo é obrigatória';
        else if (!/^https?:\/\/[^\s]+$/.test(formData.fileUrl)) newErrors.fileUrl = 'URL inválida';
        if (!formData.uploadedById) newErrors.uploadedById = 'Usuário é obrigatório';
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
            const url = isEditing ? `/api/inspections/${formData.id}` : '/api/inspections';
            const method = isEditing ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao ${isEditing ? 'atualizar' : 'criar'} inspeção`);
            }
            const updatedInspection = await response.json();
            if (isEditing) {
                setInspections((prev) => prev.map((i) => (i.id === updatedInspection.id ? updatedInspection : i)));
            } else {
                setInspections((prev) => [...prev, updatedInspection]);
            }
            resetForm();
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const handleEdit = (inspection: Inspection) => {
        setFormData({
            id: inspection.id,
            maintenanceId: inspection.maintenanceId,
            fileUrl: inspection.fileUrl,
            uploadedById: inspection.uploadedById
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta inspeção?')) return;
        try {
            const response = await fetch(`/api/inspections/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir inspeção');
            }
            setInspections((prev) => prev.filter((i) => i.id !== id));
        } catch (error: any) {
            console.error(error);
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            maintenanceId: '',
            fileUrl: '',
            uploadedById: ''
        });
        setErrors({});
        setIsEditing(false);
    };

    if (loading) return <p>Carregando...</p>;

    return (
        <div>
            <h1>Lista de Inspeções</h1>
            <Link to="/">Voltar</Link>

            <h2>{isEditing ? 'Editar Inspeção' : 'Adicionar Inspeção'}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Manutenção:</label>
                    <select
                        name="maintenanceId"
                        value={formData.maintenanceId}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Selecione uma manutenção</option>
                        {maintenances.map((maintenance) => (
                            <option key={maintenance.id} value={maintenance.id}>
                                {maintenance.description}
                            </option>
                        ))}
                    </select>
                    {errors.maintenanceId && <span style={{ color: 'red' }}>{errors.maintenanceId}</span>}
                </div>
                <div>
                    <label>URL do Arquivo:</label>
                    <input
                        type="text"
                        name="fileUrl"
                        value={formData.fileUrl}
                        onChange={handleInputChange}
                        required
                    />
                    {errors.fileUrl && <span style={{ color: 'red' }}>{errors.fileUrl}</span>}
                </div>
                <div>
                    <label>Enviado por:</label>
                    <select
                        name="uploadedById"
                        value={formData.uploadedById}
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
                    {errors.uploadedById && <span style={{ color: 'red' }}>{errors.uploadedById}</span>}
                </div>
                <button type="submit">{isEditing ? 'Atualizar' : 'Criar'}</button>
                {isEditing && <button type="button" onClick={resetForm}>Cancelar</button>}
            </form>

            {inspections.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Manutenção</th>
                            <th>URL do Arquivo</th>
                            <th>Enviado por</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inspections.map((inspection) => (
                            <tr key={inspection.id}>
                                <td>{inspection.maintenance?.description || 'N/A'}</td>
                                <td>
                                    <a
                                        href={sanitizeUrl(inspection.fileUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {safeDisplayText(inspection.fileUrl)}
                                    </a>
                                </td>
                                <td>{inspection.uploadedBy?.name || 'N/A'}</td>
                                <td>
                                    <button onClick={() => handleEdit(inspection)}>Editar</button>
                                    <button onClick={() => handleDelete(inspection.id)}>Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Nenhuma inspeção encontrada.</p>
            )}
        </div>
    );
};

export default Inspections;