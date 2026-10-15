import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';

function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') || 'customer') as 'customer' | 'worker';
  const [role, setRole] = useState<'customer' | 'worker'>(initialRole);
  const [activeTab, setActiveTab] = useState<'google' | 'demo'>('google');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showSimulatedPicker, setShowSimulatedPicker] = useState(false);

  // Demo fallback name
  const [name, setName] = useState('Lokesh');

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    session,
    profile,
    loading: authLoading,
    loginAsGoogleUser,
    loginAsDemo,
  } = useAuth();

  useEffect(() => {
    if (authLoading || !session) return;
    navigate((profile?.role || role) === 'worker' ? '/worker' : '/customer', { replace: true });
  }, [authLoading, navigate, profile?.role, role, session]);

  // Primary Google Sign Up / Sign In Handler
  // Note: Supabase Google OAuth not yet configured in dashboard — go straight to instant simulated Google flow
  const handleGoogleAuth = () => {
    setShowSimulatedPicker(true);
  };

  // Instant Google One-Tap Login (Direct simulation for preview testing)
  const handleInstantGoogleLogin = (customName?: string, customEmail?: string) => {
    const finalName = customName || (role === 'worker' ? 'Rohan Verma (Pro)' : 'Alex Kumar');
    const finalEmail = customEmail || (role === 'worker' ? 'rohan.verma.pro@gmail.com' : 'alex.kumar@gmail.com');

    loginAsGoogleUser(role, {
      name: finalName,
      email: finalEmail,
    });

    toast({
      title: 'Signed in with Google',
      description: `Welcome, ${finalName}! Account set up as ${role === 'worker' ? 'Worker' : 'Customer'}.`,
    });
    navigate(role === 'worker' ? '/worker' : '/customer', { replace: true });
  };

  const handleDemoLogin = (selectedRole: 'customer' | 'worker', customName?: string) => {
    const finalName = (customName || name).trim() || (selectedRole === 'worker' ? 'Demo Worker' : 'Demo Customer');
    loginAsDemo(selectedRole, finalName);
    toast({
      title: 'Welcome to NearWork',
      description: `Logged in as ${finalName} (${selectedRole === 'worker' ? 'Worker' : 'Customer'})`,
    });
    navigate(selectedRole === 'worker' ? '/worker' : '/customer', { replace: true });
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <SEO
        title="Sign Up with Google | NearWork"
        description="Join NearWork in seconds using Google Sign Up. Hire local pros or find nearby repair jobs."
        path="/login"
        keywords="NearWork sign up, Google login, local services marketplace"
      />

      {/* Background subtle mesh gradients */}
      <div className="absolute top-[-80px] left-[-80px] h-[360px] w-[360px] rounded-full bg-blue-100/60 dark:bg-blue-950/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] right-[-80px] h-[360px] w-[360px] rounded-full bg-indigo-100/60 dark:bg-indigo-950/30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[460px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 shadow-md shadow-blue-500/20 text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Welcome to NearWork
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Hyperlocal marketplace for trusted repairs, home services, and skilled work
          </p>
        </div>

        {/* Role Selector Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Choose How You Want to Join
            </label>
            <span className="text-[11px] font-semibold text-blue-600">
              {role === 'customer' ? 'Hiring Mode' : 'Worker Mode'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('customer')}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 py-4 px-3 cursor-pointer transition-all text-center relative ${
                role === 'customer'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              {role === 'customer' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <span className="text-2xl mb-1">🧑‍💼</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Customer</span>
              <span className="text-[11px] text-slate-500 mt-0.5">I want to hire pros</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('worker')}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 py-4 px-3 cursor-pointer transition-all text-center relative ${
                role === 'worker'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              {role === 'worker' && (
                <div className="absolute top-2 right-2 text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
              <span className="text-2xl mb-1">👷</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Service Pro</span>
              <span className="text-[11px] text-slate-500 mt-0.5">I want to find jobs</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Google Sign Up vs Demo */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <GoogleIcon className="h-4 w-4" />
            Sign Up with Google
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'demo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Zap className="h-4 w-4" />
            1-Click Demo Profiles
          </button>
        </div>

        {/* TAB 1: GOOGLE SIGN UP & SIGN IN */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            {/* Primary Google Button */}
            <Button
              type="button"
              size="lg"
              onClick={handleGoogleAuth}
              className="w-full h-13 rounded-xl font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 text-sm active:scale-[0.99]"
            >
              <GoogleIcon className="h-5 w-5" />
              <span>
                {`Sign up with Google as ${role === 'worker' ? 'Worker' : 'Customer'}`}
              </span>
            </Button>

            <p className="text-[11px] text-center text-slate-400">
              One click authentication &bull; No password needed &bull; Automatic profile setup
            </p>

            {/* Instant Google One-Tap Card */}
            <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <GoogleIcon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Instant Google Account
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {role === 'worker' ? 'rohan.verma.pro@gmail.com' : 'alex.kumar@gmail.com'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleInstantGoogleLogin()}
                  className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 shadow-xs"
                >
                  Sign Up Fast
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>

            {/* Custom Google Account Modal / Dropdown */}
            {showSimulatedPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <GoogleIcon className="h-4 w-4" />
                  <span>Choose Google Account</span>
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Your Full Name (e.g. Rahul Sharma)"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                  <Input
                    type="email"
                    placeholder="Your Gmail address (e.g. rahul@gmail.com)"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                    onClick={() => handleInstantGoogleLogin(customGoogleName, customGoogleEmail)}
                  >
                    Confirm Google Sign Up
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 2: DEMO 1-CLICK PROFILES */}
        {activeTab === 'demo' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => handleDemoLogin(role)}
              className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              <span>Continue as {role === 'worker' ? 'Worker' : 'Customer'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDemoLogin('customer', 'Lokesh (Customer)')}
                className="h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600"
              >
                🧑‍💼 Demo Customer
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleDemoLogin('worker', 'Lokesh (Worker)')}
                className="h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-blue-50 hover:text-blue-600"
              >
                👷 Demo Worker
              </Button>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>NearWork Verified &bull; Real-time GPS & Escrow Protected</span>
        </div>
      </motion.div>
    </div>
  );
}
