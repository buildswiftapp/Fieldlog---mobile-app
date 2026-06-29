import type { Session } from '@supabase/supabase-js';
import { clearOAuthPortal, loadOAuthPortal } from '@/lib/oauthIntent';
import type { Organization, Profile } from '@/lib/database.types';
import {
  type MobilePortal,
  portalMismatchMessage,
  resolveMobilePortal,
  resolveUserType,
} from '@/lib/roles';
import { supabase } from '@/lib/supabase';

async function loadAccountContext(userId: string) {
  const { data: profile, error: profileError } = await supabase
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

  const organization =
    (membership as { organizations?: Organization } | null)?.organizations ?? null;

  return { profile: (profile as Profile | null) ?? null, organization };
}

export type OAuthFinalizeResult =
  | { ok: true }
  | { ok: false; message: string; returnPortal: MobilePortal };

export async function finalizeOAuthSession(session: Session): Promise<OAuthFinalizeResult> {
  const intentPortal = await loadOAuthPortal();
  const returnPortal = intentPortal ?? 'gc';

  try {
    const { profile, organization } = await loadAccountContext(session.user.id);
    const accountPortal = resolveMobilePortal(session, profile, organization, null);

    if (resolveUserType(session, profile, organization) === 'owner') {
      await supabase.auth.signOut();
      await clearOAuthPortal();
      return {
        ok: false,
        message: 'This account is for the owner web portal. Sign in on the FieldLog website instead.',
        returnPortal,
      };
    }

    if (intentPortal && accountPortal && accountPortal !== intentPortal) {
      await supabase.auth.signOut();
      await clearOAuthPortal();
      return {
        ok: false,
        message: portalMismatchMessage(accountPortal, intentPortal),
        returnPortal: intentPortal,
      };
    }

    if (intentPortal && !accountPortal) {
      await supabase.auth.updateUser({ data: { user_type: intentPortal } });
      try {
        await supabase.from('profiles').update({ user_type: intentPortal }).eq('id', session.user.id);
      } catch {
      }
    }

    await clearOAuthPortal();
    return { ok: true };
  } catch (e) {
    await clearOAuthPortal();
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Could not finish social sign-in.',
      returnPortal,
    };
  }
}
