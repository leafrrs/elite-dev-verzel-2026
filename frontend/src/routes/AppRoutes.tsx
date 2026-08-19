import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

import { HomePage } from '../pages/HomePage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { LoginPage } from '../pages/LoginPage';
import { OrganizerPage } from '../pages/OrganizerPage';
import { GatePage } from '../pages/GatePage';
import { ReservationPage } from '../pages/ReservationPage';
import { CheckoutPage } from '../pages/CheckoutPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Layout Principal encapsula tudo */}
      <Route element={<MainLayout />}>
        
        {/* Rotas Públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas Protegidas - Client (Comprador) */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
          <Route path="/events/:id/reserve" element={<ReservationPage />} />
          <Route path="/checkout/:reservationId" element={<CheckoutPage />} />
        </Route>

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
