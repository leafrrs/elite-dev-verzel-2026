import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { OrganizerPage } from '../pages/OrganizerPage';
import { GatePage } from '../pages/GatePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Layout Principal encapsula tudo */}
      <Route element={<MainLayout />}>
        
        {/* Rotas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas - Organizer (Somente o ORGANIZER acessa) */}
        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
          <Route path="/organizer" element={<OrganizerPage />} />
        </Route>

        {/* Rotas Protegidas - Gate (Somente o GATE_STAFF acessa) */}
        <Route element={<ProtectedRoute allowedRoles={['GATE_STAFF']} />}>
          <Route path="/gate" element={<GatePage />} />
        </Route>

      </Route>
    </Routes>
  );
}
