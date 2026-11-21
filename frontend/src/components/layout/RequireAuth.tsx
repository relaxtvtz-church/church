import type { ReactNode } from 'react';
import { useAuth } from '../../lib/auth';
import { LoginPage } from '../../pages/admin/LoginPage';
import { PageLoader } from '../ui/Feedback';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { admin, loading } = useAuth();

  if (loading) return <PageLoader label="Checking your session…" />;
  // Keep the visitor on /admin so the sign-in page is the gate itself.
  if (!admin) return <LoginPage />;
  return <>{children}</>;
};
