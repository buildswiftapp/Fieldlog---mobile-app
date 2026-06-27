import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Organization, Profile, UserType } from '@/lib/database.types';

type SignUpArgs = {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  userType: Exclude<UserType, 'owner'>;
  trade?: string;
};

export type SignUpResult = { needsEmailConfirmation: boolean };

type BootstrapArgs = {
  companyName: string;
  userType: Exclude<UserType, 'owner'>;
  trade?: string;
};

type AuthState = {
  initializing: boolean;
  profileLoading: boolean;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (args: SignUpArgs) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  bootstrapOrganization: (args: BootstrapArgs) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const activeUserId = useRef<string | null>(null);

  async function loadProfile(userId: string) {
    setProfileLoading(true);
    try {
      const { data: prof, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;
      setProfile(prof ?? null);

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, is_primary, organizations(*)')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;

      const org = (membership as { organizations?: Organization } | null)?.organizations ?? null;
      setOrganization(org);
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      activeUserId.current = data.session?.user?.id ?? null;
      if (data.session?.user) {
        try {
          await loadProfile(data.session.user.id);
        } catch {
          setProfile(null);
          setOrganization(null);
        }
      }
      setInitializing(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;
      if (nextUserId !== activeUserId.current) {
        setProfile(null);
        setOrganization(null);
      }

      setSession(nextSession);
      activeUserId.current = nextUserId;

      if (nextSession?.user) {
        try {
          await loadProfile(nextSession.user.id);
        } catch {
          setProfile(null);
          setOrganization(null);
        }
      } else {
        setProfile(null);
        setOrganization(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      profileLoading,
      session,
      profile,
      organization,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      },
      signUp: async ({ email, password, fullName, companyName, userType, trade }) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName, user_type: userType } },
        });
        if (error) throw error;
        if (!data.session) {
          return { needsEmailConfirmation: true };
        }
        const { error: rpcError } = await supabase.rpc('fl_bootstrap_organization', {
          p_name: companyName,
          p_type: userType,
          p_trade: trade ?? null,
          p_brand_color: userType === 'gc' ? '#F59E0B' : '#8B5CF6',
        });
        if (rpcError) throw rpcError;
        if (data.user) await loadProfile(data.user.id);
        return { needsEmailConfirmation: false };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      refresh: async () => {
        if (session?.user) await loadProfile(session.user.id);
      },
      bootstrapOrganization: async ({ companyName, userType, trade }) => {
        const { error } = await supabase.rpc('fl_bootstrap_organization', {
          p_name: companyName,
          p_type: userType,
          p_trade: trade ?? null,
          p_brand_color: userType === 'gc' ? '#F59E0B' : '#8B5CF6',
        });
        if (error) throw error;
        if (session?.user) await loadProfile(session.user.id);
      },
    }),
    [initializing, profileLoading, session, profile, organization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
