'use client';

import { Activity, BarChart3, Bookmark, Briefcase, LayoutDashboard, LogOut, Moon, Plus, Search, Sun, X } from 'lucide-react';
import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter as useNextRouter } from 'next/navigation';
import { useRouter } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAttention, useOverview } from '@/lib/hooks';
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '../ui/overlay';
import { BackToTop, ScrollProgress } from '../ui/scroll';
import { Button, buttonClass, cn, LinkButton } from '../ui/ui';
import { Brand, Logo } from './brand';
import { GlobalSearch } from './global-search';
import { Splash } from './splash';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Overview & actions' },
  { href: '/applications', label: 'Applications', icon: Briefcase, hint: 'Every job you applied to' },
  { href: '/wishlist', label: 'Wishlist', icon: Bookmark, hint: 'Jobs to apply to' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, hint: 'What is working' },
  { href: '/activity', label: 'Activity', icon: Activity, hint: 'Recent changes' },
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

/** Live counts shown as badges in the navigation. */
function useNavCounts(): Record<string, { value: number; urgent?: boolean } | undefined> {
  const attention = useAttention();
  const overview = useOverview('range=all');
  const cards = overview.data?.cards ?? [];
  const get = (k: string) => cards.find((c) => c.key === k)?.count;
  return {
    '/dashboard': attention.data?.total ? { value: attention.data.total, urgent: true } : undefined,
    '/applications': get('total') !== undefined ? { value: get('total')! } : undefined,
    '/wishlist': get('wishlist') !== undefined ? { value: get('wishlist')! } : undefined,
  };
}

/**
 * Nav icon with a loading ring that fades in only if the page takes >200ms to open.
 * The icon itself never changes, so fast navigations show no flicker or layout shift.
 */
function NavIcon({ icon: Icon, className = 'h-4 w-4' }: { icon: React.ElementType; className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="relative inline-flex items-center justify-center">
      <Icon className={cn(className, 'transition-opacity duration-200', pending && 'opacity-60')} />
      {pending && (
        // Outer span fades in after a delay; inner span spins (separate elements so animations don't clash).
        <span aria-hidden className="nav-pending-ring absolute -inset-1.5">
          <span className="block h-full w-full animate-spin rounded-full border-2 border-current border-t-transparent [animation-duration:0.8s]" />
        </span>
      )}
    </span>
  );
}

function UserMenu({ dark }: { dark?: boolean }) {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const name = user?.displayName || user?.email?.split('@')[0] || 'You';
  return (
    <Popover
      align="end"
      width={250}
      trigger={({ toggle: t }) => (
        <button
          onClick={t}
          className={cn(
            'flex items-center gap-2.5 rounded-xl text-left transition-colors',
            dark ? 'w-full p-2 hover:bg-white/5' : 'p-0.5 hover:bg-surface-2',
          )}
          aria-label="Account menu"
        >
          <span className="bg-brand flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold text-white ring-2 ring-white/10">
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              name.slice(0, 1).toUpperCase()
            )}
          </span>
          {dark && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{name}</span>
              <span className="block truncate text-[11px] text-sidebar-muted">{user?.email}</span>
            </span>
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
      width={230}
      trigger={({ toggle }) =>
        fab ? (
          <button onClick={toggle} className="bg-brand flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-pop ring-4 ring-accent/15 active:scale-95" aria-label="Add new">
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
        <span>
          <span className="block font-medium">Add application</span>
          <span className="block text-[11px] text-muted">A job you applied to</span>
        </span>
      </MenuItem>
      <MenuItem icon={<Bookmark />} onSelect={() => router.push('/wishlist/new')}>
        <span>
          <span className="block font-medium">Add wishlist job</span>
          <span className="block text-[11px] text-muted">A job to apply to later</span>
        </span>
      </MenuItem>
    </Popover>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useNextRouter();
  const pathname = usePathname();
  const [mobileSearch, setMobileSearch] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Splash message={!loading && !user ? 'Redirecting to sign in…' : undefined} />
    );
  }

  return <Shell pathname={pathname} mobileSearch={mobileSearch} setMobileSearch={setMobileSearch}>{children}</Shell>;
}

function Shell({ children, pathname, mobileSearch, setMobileSearch }: { children: React.ReactNode; pathname: string; mobileSearch: boolean; setMobileSearch: (v: boolean) => void }) {
  const counts = useNavCounts();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const current = NAV.find((n) => isActive(n.href));

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar — dark navy for strong contrast with the content area */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-line bg-sidebar lg:flex" style={{ backgroundImage: 'linear-gradient(180deg, var(--sidebar-2), var(--sidebar))' }}>
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Brand inverted />
          </Link>
        </div>
        <p className="px-6 pt-3 pb-2 text-[10px] font-bold tracking-[0.12em] text-sidebar-muted uppercase">Workspace</p>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => {
            const active = isActive(n.href);
            const c = counts[n.href];
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]' : 'text-sidebar-fg hover:bg-white/[0.04] hover:text-white',
                )}
              >
                {active && <span className="bg-brand absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full" />}
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg transition-colors', active ? 'bg-brand text-white shadow-lg shadow-indigo-900/40' : 'bg-white/[0.04] text-sidebar-muted group-hover:text-white')}>
                  <NavIcon icon={n.icon} />
                </span>
                <span className="flex-1">
                  <span className="block leading-tight">{n.label}</span>
                  <span className={cn('block text-[10.5px] font-normal leading-tight', active ? 'text-indigo-200/80' : 'text-sidebar-muted')}>{n.hint}</span>
                </span>
                {c && (
                  <span
                    className={cn(
                      'tabular min-w-6 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
                      c.urgent ? 'bg-orange-500 text-white shadow shadow-orange-900/30' : 'bg-white/10 text-sidebar-fg',
                    )}
                    title={c.urgent ? `${c.value} items need attention` : undefined}
                  >
                    {c.value}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-sidebar-line p-3">
          <p className="px-2 pb-1 text-[10px] font-bold tracking-[0.12em] text-sidebar-muted uppercase">Quick add</p>
          <LinkButton href="/applications/new" variant="primary" className="w-full justify-start">
            <Plus className="h-4 w-4" /> New application
          </LinkButton>
          <Link
            href="/wishlist/new"
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-medium text-sidebar-fg transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            <Bookmark className="h-4 w-4" /> Save to wishlist
          </Link>
          <div className="mt-2 border-t border-sidebar-line pt-2">
            <UserMenu dark />
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="lg:hidden">
            <Logo />
          </Link>
          {current && (
            <div className="hidden min-w-0 items-center gap-2 text-sm xl:flex">
              <current.icon className="h-4 w-4 text-muted" />
              <span className="font-semibold">{current.label}</span>
              <span className="text-line-strong">/</span>
            </div>
          )}
          <GlobalSearch className="hidden max-w-xl flex-1 sm:block" />
          <div className="flex-1 sm:hidden" />
          <button className={buttonClass('ghost', 'icon', 'sm:hidden')} onClick={() => setMobileSearch(true)} aria-label="Search">
            <Search className="h-5 w-5" />
          </button>
          <div className="ml-auto hidden items-center gap-2 sm:flex lg:hidden">
            <AddMenu />
          </div>
          <div className="hidden items-center gap-2 lg:ml-auto lg:flex">
            <LinkButton href="/wishlist/new" size="sm">
              <Bookmark className="h-3.5 w-3.5" /> Add Wishlist
            </LinkButton>
            <LinkButton href="/applications/new" variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> Add Application
            </LinkButton>
          </div>
          <div className="lg:hidden">
            <UserMenu />
          </div>
        </div>
        <ScrollProgress />
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

      <main className="mx-auto max-w-[1480px] px-4 pt-6 pb-32 sm:px-6 lg:px-8 lg:pb-14">{children}</main>

      <BackToTop />

      {/* Mobile: sticky add button + bottom nav */}
      <div className="fixed right-4 bottom-20 z-30 lg:hidden">
        <AddMenu fab />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(15_23_42/0.06)] backdrop-blur lg:hidden">
        {NAV.map((n) => {
          const active = isActive(n.href);
          const c = counts[n.href];
          return (
            <Link key={n.href} href={n.href} className={cn('relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', active ? 'text-accent' : 'text-muted')}>
              {active && <span className="bg-brand absolute top-0 h-[3px] w-8 rounded-b-full" />}
              <span className="relative">
                <NavIcon icon={n.icon} className="h-5 w-5" />
                {c?.urgent && <span className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-orange-500 px-1 text-center text-[9px] leading-4 font-bold text-white">{c.value}</span>}
              </span>
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
