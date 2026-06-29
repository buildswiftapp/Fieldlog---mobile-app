import type { Session } from '@supabase/supabase-js';
import type { Organization, Profile, UserType } from '@/lib/database.types';
import type { PendingSignup } from '@/lib/pendingSignup';

export type MobilePortal = 'gc' | 'sub';

export function resolveUserType(
  session: Session | null,
  profile: Profile | null,
  organization: Organization | null = null,
): UserType | null {
  if (profile?.user_type === 'owner') return 'owner';
  if (profile?.user_type === 'gc' || profile?.user_type === 'sub') return profile.user_type;

  if (organization?.type === 'gc' || organization?.type === 'sub') return organization.type;

  const meta = session?.user?.user_metadata?.user_type;
  if (meta === 'gc' || meta === 'sub' || meta === 'owner') return meta;
  return null;
}

export function resolveMobilePortal(
  session: Session | null,
  profile: Profile | null,
  organization: Organization | null = null,
  pending?: PendingSignup | null,
): MobilePortal | null {
  const resolved = resolveUserType(session, profile, organization);
  if (resolved === 'gc' || resolved === 'sub') return resolved;
  if (pending?.userType === 'gc' || pending?.userType === 'sub') return pending.userType;
  return null;
}

export function homeRouteForPortal(portal: MobilePortal) {
  return portal === 'sub' ? '/(sub)/home' : '/(gc)/home';
}

export function loginRouteForPortal(portal: MobilePortal) {
  return portal === 'sub' ? '/(auth)/login/sub' : '/(auth)/login/gc';
}

export function signupRouteForPortal(portal: MobilePortal) {
  return portal === 'sub' ? '/(auth)/signup/sub' : '/(auth)/signup/gc';
}

export function forgotPasswordRouteForPortal(portal: MobilePortal) {
  return portal === 'sub' ? '/(auth)/forgot-password/sub' : '/(auth)/forgot-password/gc';
}

export function portalLabel(portal: MobilePortal) {
  return portal === 'sub' ? 'Subcontractor' : 'General Contractor';
}

export function portalMismatchMessage(accountPortal: MobilePortal, selectedPortal: MobilePortal) {
  if (accountPortal === 'sub') {
    return selectedPortal === 'gc'
      ? 'This email is registered as a Subcontractor account. Switch to Sub and sign in again.'
      : 'This is a Subcontractor account.';
  }
  return selectedPortal === 'sub'
    ? 'This email is registered as a GC account. Switch to GC and sign in again.'
    : 'This is a General Contractor account.';
}
