import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/use-admin';
import { useAuth } from '@/contexts/AuthContext';
import { Users, DollarSign, BarChart3, CreditCard, LogOut, Home, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Overview', path: '/admin', icon: BarChart3 },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Withdrawals', path: '/admin/withdrawals', icon: CreditCard },
  { label: 'Surveys', path: '/admin/surveys', icon: DollarSign },
];

export default function AdminLayout() {
  const { isAdmin, loading } = useAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/dashboard');
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col hero-gradient text-primary-foreground">
        <div className="p-6 border-b border-primary-foreground/10">
          <h1 className="font-heading text-xl font-bold">SURVCASH</h1>
          <p className="text-xs opacity-70 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary-foreground/15 text-primary-foreground'
                  : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-foreground/10 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden hero-gradient text-primary-foreground p-4 flex items-center justify-between">
          <h1 className="font-heading text-lg font-bold">SURVCASH Admin</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </header>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden hero-gradient text-primary-foreground px-4 pb-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  location.pathname === item.path
                    ? 'bg-primary-foreground/15'
                    : 'text-primary-foreground/70 hover:bg-primary-foreground/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-primary-foreground/70"
            >
              <Home className="w-5 h-5" /> Dashboard
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
