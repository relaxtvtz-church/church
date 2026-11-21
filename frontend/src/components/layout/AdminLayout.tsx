import {
  ChartNoAxesCombined,
  Church,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Settings as SettingsIcon,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChurchLogo } from '../brand/ChurchLogo';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../lib/toast';
import { cn } from '../../lib/utils';

const navigation: { label: string; to: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Reviews', to: '/admin/reviews', icon: MessageSquareText },
  { label: 'Registered People', to: '/admin/registrations', icon: UserCheck },
  { label: 'Staff', to: '/admin/staff', icon: Users },
  { label: 'Ratings', to: '/admin/ratings', icon: ChartNoAxesCombined },
  { label: 'Reports', to: '/admin/reports', icon: FileText },
  { label: 'Advertise', to: '/admin/advertise', icon: Megaphone },
  { label: 'Church Information', to: '/admin/church', icon: Church },
  { label: 'Settings', to: '/admin/settings', icon: SettingsIcon },
];

export const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { admin, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    notify('You have been signed out.', 'info');
    navigate('/admin/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <Link to="/admin" onClick={() => setMenuOpen(false)} className="min-w-0 flex-1 rounded-lg">
          <ChurchLogo subtitle="Admin Portal" size="sm" className="w-full" />
        </Link>
        <button type="button" onClick={() => setMenuOpen(false)} className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-soft lg:hidden" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted/80">Ministry review</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-soft hover:text-ink',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
            {(admin?.name ?? 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-ink">{admin?.name}</p>
            <p className="truncate text-[11px] text-muted">{admin?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-soft/70">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-line lg:block">{sidebar}</aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-line shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[260px]">
        <div className="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setMenuOpen(true)} className="rounded-lg p-2 text-ink hover:bg-soft" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 text-sm font-bold text-ink">Admin Portal</span>
        </div>
        <main className="animate-fade-in mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
      </div>
    </div>
  );
};
