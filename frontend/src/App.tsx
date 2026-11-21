import { Link, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { AdvertisePage } from './pages/admin/AdvertisePage';
import { ChurchInformationPage } from './pages/admin/ChurchInformationPage';
import { LoginPage } from './pages/admin/LoginPage';
import { OverviewPage } from './pages/admin/OverviewPage';
import { RatingsPage } from './pages/admin/RatingsPage';
import { RegistrationsPage } from './pages/admin/RegistrationsPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ReviewsPage } from './pages/admin/ReviewsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { StaffDetailPage } from './pages/admin/StaffDetailPage';
import { StaffPage } from './pages/admin/StaffPage';
import { HomePage } from './pages/public/HomePage';
import { ShushoPage } from './pages/public/ShushoPage';

const NotFoundPage = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <p className="text-6xl font-bold text-brand">404</p>
    <h1 className="mt-4 text-2xl font-bold text-ink">Page not found</h1>
    <p className="mt-2 text-sm text-muted">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
      Return home
    </Link>
  </div>
);

export const App = () => (
  <Routes>
    <Route path="/shusho" element={<ShushoPage />} />
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route
      path="/admin"
      element={
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      }
    >
      <Route index element={<OverviewPage />} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="registrations" element={<RegistrationsPage />} />
      <Route path="staff" element={<StaffPage />} />
      <Route path="staff/:id" element={<StaffDetailPage />} />
      <Route path="ratings" element={<RatingsPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="advertise" element={<AdvertisePage />} />
      <Route path="church" element={<ChurchInformationPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  </Routes>
);
