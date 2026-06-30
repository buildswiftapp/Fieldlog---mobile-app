import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { MobilePortal } from '@/lib/roles';

const KEY = 'fl_pending_signup';
const PORTAL_KEY = 'fl_signup_portal';

export type PendingSignup = {
  email: string;
  companyName: string;
  fullName: string;
  userType: 'gc' | 'sub';
  trade?: string;
};

export async function savePendingSignup(data: PendingSignup) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function loadPendingSignup(): Promise<PendingSignup | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignup;
  } catch {
    return null;
  }
}

export async function clearPendingSignup() {
  await AsyncStorage.removeItem(KEY);
}

/** Remember which portal (gc/sub) the user registered under — survives email confirm. */
export async function saveSignupPortal(portal: MobilePortal) {
  await AsyncStorage.setItem(PORTAL_KEY, portal);
}

export async function loadSignupPortal(): Promise<MobilePortal | null> {
  const value = await AsyncStorage.getItem(PORTAL_KEY);
  return value === 'gc' || value === 'sub' ? value : null;
}

export async function clearSignupPortal() {
  await AsyncStorage.removeItem(PORTAL_KEY);
}

function fromUserMetadata(user: User): PendingSignup | null {
  const meta = user.user_metadata ?? {};
  const userType = meta.user_type;
  const companyName = typeof meta.company_name === 'string' ? meta.company_name.trim() : '';
  if ((userType !== 'gc' && userType !== 'sub') || !companyName) return null;

  return {
    email: user.email ?? '',
    companyName,
    fullName: typeof meta.full_name === 'string' ? meta.full_name : '',
    userType,
    trade: typeof meta.trade === 'string' ? meta.trade : undefined,
  };
}

/** Local pending signup, or the same data restored from Supabase user metadata after email confirm. */
export async function getSignupCompletionData(user: User | null | undefined): Promise<PendingSignup | null> {
  if (!user?.email) return null;

  const pending = await loadPendingSignup();
  if (pending && pending.email.toLowerCase() === user.email.toLowerCase()) {
    return pending;
  }

  const fromMeta = fromUserMetadata(user);
  if (fromMeta && fromMeta.email.toLowerCase() === user.email.toLowerCase()) {
    return fromMeta;
  }

  return null;
}

export function signupPayloadFromArgs(args: {
  email: string;
  fullName: string;
  companyName: string;
  userType: 'gc' | 'sub';
  trade?: string;
}): PendingSignup {
  return {
    email: args.email.trim(),
    companyName: args.companyName,
    fullName: args.fullName,
    userType: args.userType,
    trade: args.trade,
  };
}

export function signupMetadataFromPayload(payload: PendingSignup) {
  return {
    full_name: payload.fullName,
    user_type: payload.userType,
    company_name: payload.companyName,
    ...(payload.trade ? { trade: payload.trade } : {}),
  };
}

/** Which portal login to open after email confirmation (sub vs gc). */
export async function resolveSignupPortal(session: Session): Promise<MobilePortal> {
  const saved = await loadSignupPortal();
  if (saved) return saved;

  const pending = await loadPendingSignup();
  if (pending?.userType === 'sub') return 'sub';
  if (pending?.userType === 'gc') return 'gc';

  const meta = session.user.user_metadata?.user_type;
  if (meta === 'sub') return 'sub';
  return 'gc';
}
