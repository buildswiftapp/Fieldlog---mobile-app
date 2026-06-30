import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Organization, Profile, UserType } from '@/lib/database.types';
import { getAuthRedirectUrl } from '@/lib/authLinking';
import {
  clearPendingSignup,
  clearSignupPortal,
  getSignupCompletionData,
  savePendingSignup,
  saveSignupPortal,
  signupMetadataFromPayload,
  signupPayloadFromArgs,
} from '@/lib/pendingSignup';
import {
  type MobilePortal,
  portalMismatchMessage,
  resolveMobilePortal,
  resolveUserType,
} from '@/lib/roles';
import { supabase } from '@/lib/supabase';

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

export type SignInResult = {
  userType: MobilePortal;
};

type AuthState = {
  initializing: boolean;
  profileLoading: boolean;
  verifying: boolean;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  signIn: (email: string, password: string, expectedPortal: MobilePortal) => Promise<SignInResult>;
  signUp: (args: SignUpArgs) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  bootstrapOrganization: (args: BootstrapArgs) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email from the verification link we sent, then sign in again.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const activeUserId = useRef<string | null>(null);

  async function persistUserType(userId: string, userType: MobilePortal) {
    try {
      await supabase.from('profiles').update({ user_type: userType }).eq('id', userId);
    } catch {
    }
  }

  async function loadProfile(userId: string) {
    setProfileLoading(true);
    try {
      const { data: prof, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) throw profileError;

      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id, is_primary, organizations(*)')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;

      const org = (membership as { organizations?: Organization } | null)?.organizations ?? null;
      setProfile(prof ?? null);
      setOrganization(org);
      return { profile: prof ?? null, organization: org };
    } finally {
      setProfileLoading(false);
    }
  }

  async function completePendingSignupIfNeeded(user: User, currentOrganization: Organization | null) {
    if (currentOrganization) {
      await clearPendingSignup();
      await clearSignupPortal();
      return currentOrganization;
    }

    const pending = await getSignupCompletionData(user);
    if (!pending || pending.email.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      return null;
    }

    const { error } = await supabase.rpc('fl_bootstrap_organization', {
      p_name: pending.companyName,
      p_type: pending.userType,
      p_trade: pending.trade ?? null,
      p_brand_color: pending.userType === 'gc' ? '#F59E0B' : '#8B5CF6',
    });
    if (error) throw error;

    await clearPendingSignup();
    await clearSignupPortal();
    const loaded = await loadProfile(user.id);
    return loaded.organization;
  }

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      activeUserId.current = data.session?.user?.id ?? null;
      if (data.session?.user) {
        try {
          const loaded = await loadProfile(data.session.user.id);
          try {
            await completePendingSignupIfNeeded(data.session.user, loaded.organization);
            await loadProfile(data.session.user.id);
          } catch {
          }
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
          const loaded = await loadProfile(nextSession.user.id);
          try {
            await completePendingSignupIfNeeded(nextSession.user, loaded.organization);
            await loadProfile(nextSession.user.id);
          } catch {
          }
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
      verifying,
      session,
      profile,
      organization,
      signIn: async (email, password, expectedPortal) => {
        setVerifying(true);
        try {
          const trimmed = email.trim();
          const { data, error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
          if (error) throw new Error(friendlyAuthError(error.message));
          if (!data.session?.user) throw new Error('Incorrect email or password.');

          const userId = data.session.user.id;
          let loaded = await loadProfile(userId);
          try {
            await completePendingSignupIfNeeded(data.session.user, loaded.organization);
          } catch {
          }
          loaded = await loadProfile(userId);

          if (resolveUserType(data.session, loaded.profile, loaded.organization) === 'owner') {
            await supabase.auth.signOut();
            throw new Error('This account is for the owner web portal. Sign in on the FieldLog website instead.');
          }

          const pending = await getSignupCompletionData(data.session.user);
          const accountPortal = resolveMobilePortal(data.session, loaded.profile, loaded.organization, pending);

          if (accountPortal && accountPortal !== expectedPortal) {
            await supabase.auth.signOut();
            throw new Error(portalMismatchMessage(accountPortal, expectedPortal));
          }

          if (accountPortal) {
            if (loaded.profile && loaded.profile.user_type !== accountPortal) {
              await persistUserType(userId, accountPortal);
            }
            return { userType: accountPortal };
          }

          if (pending?.userType === expectedPortal) {
            return { userType: pending.userType };
          }

          await supabase.auth.signOut();
          throw new Error(
            `This account is not registered for the ${expectedPortal === 'gc' ? 'GC' : 'Sub'} portal. Switch portals or create the matching account type.`,
          );
        } finally {
          setVerifying(false);
        }
      },
      signUp: async ({ email, password, fullName, companyName, userType, trade }) => {
        const pendingPayload = signupPayloadFromArgs({
          email,
          fullName,
          companyName,
          userType,
          trade,
        });

        // Native Supabase Auth sends the confirmation email (configured in the
        // Supabase dashboard). The link returns to fieldlog://auth-callback,
        // where the pending org details below are used to bootstrap the org.
        const { data, error } = await supabase.auth.signUp({
          email: pendingPayload.email,
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl('/auth-callback'),
            data: signupMetadataFromPayload(pendingPayload),
          },
        });
        if (error) throw new Error(friendlyAuthError(error.message));

        // Existing confirmed email: Supabase returns a user with no identities
        // (and no error) instead of revealing the account exists.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error('An account with this email already exists. Sign in instead.');
        }

        await savePendingSignup(pendingPayload);
        await saveSignupPortal(pendingPayload.userType);

        // With "Confirm email" enabled, no session is returned — the user must
        // verify via the emailed link first. If a session IS returned, the
        // project has confirmation disabled; sign out so we never enter the app
        // without verification (enable Confirm email in Supabase to send links).
        if (data.session) {
          await supabase.auth.signOut();
        }
        return { needsEmailConfirmation: true };
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
        await clearPendingSignup();
        await clearSignupPortal();
        if (session?.user) {
          await persistUserType(session.user.id, userType);
          await loadProfile(session.user.id);
        }
      },
    }),
    [initializing, profileLoading, verifying, session, profile, organization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { resolveUserType } from '@/lib/roles';
