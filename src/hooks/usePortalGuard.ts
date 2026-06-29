import { useAuth } from '@/context/AuthContext';
import { type MobilePortal, resolveUserType } from '@/lib/roles';

export function usePortalGuard(requiredPortal: MobilePortal) {
  const { initializing, profileLoading, session, profile, organization } = useAuth();
  const accountPortal = resolveUserType(session, profile, organization);

  return (
    !initializing &&
    !profileLoading &&
    Boolean(session) &&
    accountPortal === requiredPortal
  );
}
