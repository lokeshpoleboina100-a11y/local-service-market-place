import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

const DEMO_STORAGE_KEY = 'nearwork_demo_auth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'worker'
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: (role?: 'customer' | 'worker') => Promise<{ error: Error | null; data?: any }>;
  loginAsGoogleUser: (
    role: 'customer' | 'worker',
    googleData?: { name?: string; email?: string; avatarUrl?: string }
  ) => void;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginAsDemo: (role: 'customer' | 'worker', fullName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const demoData = localStorage.getItem(DEMO_STORAGE_KEY);
    if (demoData) {
      try {
        const parsed = JSON.parse(demoData);
        if (parsed.user?.id === userId) {
          setProfile(parsed.profile);
          return;
        }
      } catch (e) {}
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, role, avatar_url, bio, location_name, latitude, longitude, skills, experience_years, service_radius_km, is_verified, rating, total_reviews, total_jobs_completed, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Check if user just signed up or logged in via Google OAuth
      const pendingRole = (localStorage.getItem('nearwork_pending_oauth_role') as 'customer' | 'worker') || 'customer';
      let currentUser = user;
      if (!currentUser) {
        try {
          const res = await supabase.auth.getUser();
          currentUser = res.data.user;
        } catch {}
      }

      const fullName =
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        currentUser?.email?.split('@')[0] ||
        'Google User';
      const avatarUrl =
        currentUser?.user_metadata?.avatar_url ||
        currentUser?.user_metadata?.picture ||
        null;

      const newProfile = {
        user_id: userId,
        full_name: fullName,
        role: pendingRole,
        avatar_url: avatarUrl,
        location_name: 'Hyderabad, India',
        latitude: 17.385,
        longitude: 78.4867,
        is_verified: true,
        rating: 5.0,
        total_reviews: 0,
        total_jobs_completed: 0,
      };

      try {
        const { data: created } = await supabase.from('profiles').insert(newProfile as any).select().single();
        if (created) {
          setProfile({ ...created, phone: null } as Profile);
          localStorage.removeItem('nearwork_pending_oauth_role');
          return;
        }
      } catch {}

      // Fallback in-memory/preview profile
      setProfile({
        id: `profile-${userId}`,
        ...newProfile,
        bio: 'Google Verified User',
        skills: pendingRole === 'worker' ? ['Home Repairs', 'Technician'] : null,
        experience_years: 3,
        service_radius_km: 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        phone: null,
      } as Profile);
      localStorage.removeItem('nearwork_pending_oauth_role');
      return;
    }

    setProfile({ ...data, phone: null } as Profile);
  };

  useEffect(() => {
    // 1. Check for saved demo session
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed.session && parsed.user && parsed.profile) {
          setSession(parsed.session);
          setUser(parsed.user);
          setProfile(parsed.profile);
          setLoading(false);
          return;
        }
      } catch (e) {}
    }

    // 2. Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (localStorage.getItem(DEMO_STORAGE_KEY)) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (localStorage.getItem(DEMO_STORAGE_KEY)) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (selectedRole: 'customer' | 'worker' = 'customer') => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.setItem('nearwork_pending_oauth_role', selectedRole);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error: error as Error, data: null };
      }

      if (data?.url) {
        window.location.href = data.url;
        return { error: null, data };
      }

      return { error: new Error('Failed to generate Google OAuth URL'), data: null };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  const loginAsGoogleUser = (
    selectedRole: 'customer' | 'worker',
    googleData?: { name?: string; email?: string; avatarUrl?: string }
  ) => {
    const name = googleData?.name || (selectedRole === 'worker' ? 'Rohan Verma (Pro)' : 'Alex Kumar');
    const email = googleData?.email || (selectedRole === 'worker' ? 'rohan.verma.pro@gmail.com' : 'alex.kumar@gmail.com');
    const avatarUrl = googleData?.avatarUrl || (selectedRole === 'worker'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150');
    const id = selectedRole === 'worker'
      ? '33333333-3333-4333-a333-333333333333'
      : '44444444-4444-4444-a444-444444444444';

    const mockUser: User = {
      id,
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {
        full_name: name,
        name,
        email,
        email_verified: true,
        avatar_url: avatarUrl,
        picture: avatarUrl,
        provider: 'google',
        role: selectedRole,
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: Profile = {
      id: `profile-${id}`,
      user_id: id,
      full_name: name,
      role: selectedRole,
      avatar_url: avatarUrl,
      bio: selectedRole === 'worker'
        ? 'Verified Service Professional on NearWork (Google Account).'
        : 'Google Verified Client on NearWork.',
      location_name: 'Hyderabad, India',
      latitude: 17.385,
      longitude: 78.4867,
      skills: selectedRole === 'worker' ? ['Home Repairs', 'Electrician', 'Plumber', 'Appliance Repair'] : null,
      experience_years: 5,
      service_radius_km: 25,
      is_verified: true,
      rating: 4.95,
      total_reviews: 42,
      total_jobs_completed: 68,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone: null,
    };

    const mockSession: Session = {
      access_token: 'google-oauth-mock-token',
      refresh_token: 'google-oauth-mock-refresh',
      expires_in: 3600 * 24 * 30,
      token_type: 'bearer',
      user: mockUser,
    };

    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({ session: mockSession, user: mockUser, profile: mockProfile })
    );

    setSession(mockSession);
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  const loginAsDemo = (role: 'customer' | 'worker', fullName?: string) => {
    const name = fullName?.trim() || (role === 'worker' ? 'Lokesh (Worker)' : 'Lokesh (Customer)');
    const id = role === 'worker' ? '11111111-1111-4111-a111-111111111111' : '22222222-2222-4222-a222-222222222222';

    const mockUser: User = {
      id,
      app_metadata: { provider: 'demo' },
      user_metadata: { full_name: name, role },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: `${role}@demo.nearwork.com`,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };

    const mockProfile: Profile = {
      id: `profile-${id}`,
      user_id: id,
      full_name: name,
      role,
      avatar_url: role === 'worker'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: role === 'worker'
        ? 'Professional certified contractor & technician ready to work!'
        : 'Active client looking to hire skilled professionals.',
      location_name: 'Hyderabad, India',
      latitude: 17.385,
      longitude: 78.4867,
      skills: role === 'worker' ? ['Home Repairs', 'Electrician', 'Plumber', 'App Development'] : null,
      experience_years: 6,
      service_radius_km: 30,
      is_verified: true,
      rating: 4.9,
      total_reviews: 28,
      total_jobs_completed: 19,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone: null,
    };

    const mockSession: Session = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600 * 24 * 30,
      token_type: 'bearer',
      user: mockUser,
    };

    localStorage.setItem(
      DEMO_STORAGE_KEY,
      JSON.stringify({ session: mockSession, user: mockUser, profile: mockProfile })
    );

    setSession(mockSession);
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchProfile(data.session.user.id);
    }
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'customer' | 'worker'
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, role },
      },
    });
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        loginAsGoogleUser,
        resetPassword,
        signOut,
        refreshProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
