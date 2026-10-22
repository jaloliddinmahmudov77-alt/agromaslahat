import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Leaf, LogOut, Menu, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { cx } from './ui';

const NAV = [
  { to: '/maslahat', label: 'Maslahat' },
  { to: '/ekinlar', label: 'Ekinlar' },
  { to: '/kasalliklar', label: 'Kasalliklar' },
  { to: '/narxlar', label: 'Narxlar' },
  { to: '/agroai', label: 'AgroAI' },
  { to: '/maqolalar', label: 'Maqolalar' },
];

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const location = useLocation();
  useEffect(() => {
    api
      .get<{ unread: number }>('/me/notifications')
      .then((r) => setUnread(r.unread))
      .catch(() => {});
  }, [location.pathname]);
  return (
    <Link to="/kabinet?tab=bildirishnomalar" className="relative rounded-xl p-2 text-cream hover:bg-forest-800" aria-label={`Bildirishnomalar: ${unread} ta o‘qilmagan`}>
      <Bell className="size-5" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-wheat px-1 text-[11px] font-bold text-ink">{unread > 9 ? '9+' : unread}</span>
      )}
    </Link>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cx('rounded-xl px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-forest-800 text-cream' : 'text-forest-100 hover:bg-forest-800 hover:text-cream');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-forest-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 text-cream">
            <span className="grid size-9 place-items-center rounded-xl bg-wheat text-forest-950">
              <Leaf className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">Agromaslahat</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                <NotificationBell />
                <NavLink to="/kabinet" className={({ isActive }) => cx(linkCls({ isActive }), 'hidden items-center gap-2 sm:flex')}>
                  <UserIcon className="size-4" />
                  Kabinet
                </NavLink>
              </>
            ) : (
              <Link to="/kirish" className="hidden rounded-xl bg-wheat px-4 py-2 text-sm font-semibold text-ink sm:block">
                Kirish
              </Link>
            )}
            <button className="rounded-xl p-2 text-cream hover:bg-forest-800 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menyu" aria-expanded={open}>
              {open ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-forest-800 px-4 pb-4 lg:hidden">
            <div className="mx-auto grid max-w-6xl gap-1 pt-2">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={linkCls}>
                  {n.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <NavLink to="/kabinet" className={linkCls}>
                    Shaxsiy kabinet
                  </NavLink>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-forest-100 hover:bg-forest-800"
                  >
                    Chiqish
                  </button>
                </>
              ) : (
                <NavLink to="/kirish" className={linkCls}>
                  Kirish / Ro‘yxatdan o‘tish
                </NavLink>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-forest-950 text-forest-100">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg font-bold text-cream">Agromaslahat</p>
            <p className="mt-2 text-sm">O‘zbekiston fermerlari uchun sun’iy intellektli agro maslahat platformasi.</p>
          </div>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="hover:text-cream">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="text-sm">
            <p>agromaslahat.uz · agromaslahat.ai</p>
            <p className="mt-2 text-forest-100/70">Maslahatlar umumiy tavsiya xarakterida. Jiddiy holatlarda mahalliy agronomga murojaat qiling.</p>
            {user && (
              <button
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="mt-3 inline-flex items-center gap-2 font-semibold hover:text-cream"
              >
                <LogOut className="size-4" /> Chiqish
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
