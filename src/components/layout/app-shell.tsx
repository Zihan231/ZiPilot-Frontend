'use client';

import { Activity, BarChart3, Bookmark, Briefcase, LayoutDashboard, LogOut, Moon, Plus, Search, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '../ui/overlay';
import { Button, buttonClass, cn, LinkButton, Spinner } from '../ui/ui';
import { Brand, Logo } from './brand';
import { GlobalSearch } from './global-search';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications', label: 'Applications', icon: Briefcase },
  { href: '/wishlist', label: 'Wishlist', icon: Bookmark },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/activity', label: 'Activity', icon: Activity },
];

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    setTheme((document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light');
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('zp-theme', next);
    } catch {}
    setTheme(next);
  };
  return { theme, toggle };
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const name = user?.displayName || user?.email?.split('@')[0] || 'You';
  return (
    <Popover
      align="end"
      width={240}
      trigger={({ toggle: t }) => (
        <button onClick={t} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2 text-xs font-semibold" aria-label="Account menu">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </button>
      )}
    >
      <MenuLabel>Signed in as</MenuLabel>
      <div className="truncate px-2.5 pb-2 text-[13px] font-medium">{user?.email ?? name}</div>
      <MenuSeparator />
      <MenuItem icon={theme === 'dark' ? <Sun /> : <Moon />} onSelect={toggle}>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </MenuItem>
      <MenuItem icon={<LogOut />} onSelect={signOut} danger>
        Sign out
      </MenuItem>
    </Popover>
  );
}

function AddMenu({ fab }: { fab?: boolean }) {
  const router = useRouter();
  return (
    <Popover
      align="end"
      width={210}
      trigger={({ toggle }) =>
        fab ? (
          <button
            onClick={toggle}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-pop active:scale-95"
            aria-label="Add new"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : (
          <Button variant="primary" size="icon" onClick={toggle} aria-label="Add new">
            <Plus className="h-4 w-4" />
          </Button>
        )
      }
    >
      <MenuItem icon={<Briefcase />} onSelect={() => router.push('/applications/new')}>
        Add application
      </MenuItem>
      <MenuItem icon={<Bookmark />} onSelect={() => router.push('/wishlist/new')}>
        Add wishlist job
      </MenuItem>
    </Popover>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSearch, setMobileSearch] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo className="h-10 w-10" />
          <Spinner />
        </div>
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Brand />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(n.href) ? 'bg-accent-soft text-accent' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 p-3">
          <LinkButton href="/applications/new" variant="primary" className="w-full">
            <Plus className="h-4 w-4" /> Add application
          </LinkButton>
          <LinkButton href="/wishlist/new" className="w-full">
            <Bookmark className="h-4 w-4" /> Add to wishlist
          </LinkButton>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="lg:hidden">
            <Logo />
          </Link>
          <GlobalSearch className="hidden max-w-xl flex-1 sm:block" />
          <div className="flex-1 sm:hidden" />
          <button className={buttonClass('ghost', 'icon', 'sm:hidden')} onClick={() => setMobileSearch(true)} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <div className="ml-auto hidden items-center gap-2 sm:flex lg:hidden">
            <AddMenu />
          </div>
          <div className="hidden items-center gap-2 lg:flex lg:ml-auto">
            <LinkButton href="/wishlist/new" size="sm">
              <Bookmark className="h-3.5 w-3.5" /> Add Wishlist
            </LinkButton>
            <LinkButton href="/applications/new" variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Add Application
            </LinkButton>
          </div>
          <UserMenu />
        </div>
      </header>

      {mobileSearch && (
        <div className="fixed inset-0 z-50 bg-bg p-4 sm:hidden">
          <div className="flex items-center gap-2">
            <GlobalSearch autoFocus className="flex-1" onNavigate={() => setMobileSearch(false)} />
            <button className={buttonClass('ghost', 'icon')} onClick={() => setMobileSearch(false)} aria-label="Close search">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-4 pt-5 pb-28 sm:px-6 lg:pb-12">{children}</main>

      {/* Mobile: sticky add button + bottom nav */}
      <div className="fixed right-4 bottom-20 z-30 lg:hidden">
        <AddMenu fab />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={cn('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', isActive(n.href) ? 'text-accent' : 'text-muted')}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
