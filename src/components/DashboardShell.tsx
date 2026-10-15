import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Briefcase,
  MessageSquare,
  Bookmark,
  Wallet,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  MapPin,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/ThemeToggle';
import LocationBadge from '@/components/LocationBadge';

interface DashboardShellProps {
  children: React.ReactNode;
  role?: 'customer' | 'worker';
}

export default function DashboardShell({ children, role = 'customer' }: DashboardShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/categories?q=${encodeURIComponent(navSearch.trim())}`);
    } else {
      navigate('/categories');
    }
  };

  const handleLinkClick = (item: { label: string; path: string }) => {
    setMobileMenuOpen(false);
    if (item.label === 'My Jobs' && location.pathname === '/customer') {
      document.getElementById('my-jobs')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(item.path);
    }
  };

  const customerLinks = [
    { label: 'Home', icon: Home, path: '/customer' },
    { label: 'Post a Job', icon: PlusCircle, path: '/customer/post-job' },
    { label: 'My Jobs', icon: Briefcase, path: '/customer' },
    { label: 'Messages', icon: MessageSquare, path: '/customer/chats' },
    { label: 'Settings', icon: Settings, path: '/customer/profile' },
  ];

  const workerLinks = [
    { label: 'Dashboard', icon: Home, path: '/worker/my-jobs' },
    { label: 'Find Jobs', icon: Briefcase, path: '/worker' },
    { label: 'My Bids', icon: SlidersHorizontal, path: '/worker/my-jobs' },
    { label: 'Assigned Jobs', icon: CheckCircle, path: '/worker/my-jobs' },
    { label: 'Messages', icon: MessageSquare, path: '/customer/chats' },
    { label: 'Earnings', icon: Wallet, path: '/worker/earnings' },
    { label: 'Verification', icon: ShieldCheck, path: '/worker/verification' },
    { label: 'Settings', icon: Settings, path: '/worker/settings' },
  ];

  const navLinks = role === 'customer' ? customerLinks : workerLinks;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* =========================================================================
          TOP NAVIGATION BAR (Minimal, clean, Linear/Stripe style)
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate(role === 'customer' ? '/customer' : '/worker')}
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
                N
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                NearWork
              </span>
            </div>
          </div>

          {/* Global Search Bar (Clean, minimal) */}
          <form onSubmit={handleNavSearch} className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search services or technician skills..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
              />
            </div>
          </form>

          {/* Right Controls: Location, Language, Notifications, User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden lg:block">
              <LocationBadge />
            </div>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Globe className="h-3.5 w-3.5 text-slate-500" />
                  <span className="uppercase">{i18n.language?.slice(0, 2) || 'EN'}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 rounded-xl p-1">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    className="text-xs font-medium cursor-pointer rounded-lg"
                    onClick={() => i18n.changeLanguage(lang.code)}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-600 rounded-full" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-blue-600 text-xs font-bold">
                      {profile?.full_name?.slice(0, 2).toUpperCase() || 'NW'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left text-xs leading-none">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[90px]">
                      {profile?.full_name || 'My Account'}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize mt-0.5">{role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg p-1">
                <DropdownMenuLabel className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {profile?.full_name || 'My Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(role === 'customer' ? '/customer/profile' : '/worker/settings')} className="text-xs rounded-lg">
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(role === 'customer' ? '/worker' : '/customer')} className="text-xs rounded-lg">
                  Switch to {role === 'customer' ? 'Worker' : 'Customer'} Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-xs text-red-600 font-semibold gap-2 rounded-lg">
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 animate-in slide-in-from-top-2">
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleLinkClick(item)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================================
          MAIN BODY: LEFT SIDEBAR + CENTRAL CANVAS
          ========================================================================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Sidebar (Desktop - Minimal Stripe style) */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-xs">
            <nav className="space-y-0.5">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleLinkClick(item)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Post CTA for Customer */}
          {role === 'customer' && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">Need a Technician?</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Describe the issue or upload photos to get matched with nearby pros.
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg h-8 shadow-xs"
                onClick={() => navigate('/customer/post-job')}
              >
                Post a Job
              </Button>
            </div>
          )}

          {/* Availability Status Card for Worker */}
          {role === 'worker' && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">Worker Status</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">Available for local service jobs</p>
            </div>
          )}
        </aside>

        {/* Central Content Canvas */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
