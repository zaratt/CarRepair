import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Home from './components/Home';
import Inspections from './components/Inspections';
import Maintenances from './components/Maintenances';
import Users from './components/Users';
import Vehicles from './components/Vehicles';
import Workshops from './components/Workshops';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users" element={<Users />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/workshops" element={<Workshops />} />
        <Route path="/maintenances" element={<Maintenances />} />
        <Route path="/inspections" element={<Inspections />} />
      </Routes>
    </Router>
  );
}

export default App;
