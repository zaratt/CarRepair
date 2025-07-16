import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div>
            <h1>Car Repair - SaaS</h1>
            <nav>
                <ul>
                    <li><Link to="/users">Usuários</Link></li>
                    <li><Link to="/vehicles">Veículos</Link></li>
                    <li><Link to="/workshops">Oficinas</Link></li>
                    <li><Link to="/maintenances">Manutenções</Link></li>
                    <li><Link to="/inspections">Inspeções</Link></li>
                </ul>
            </nav>
        </div>
    );
};

export default Home;