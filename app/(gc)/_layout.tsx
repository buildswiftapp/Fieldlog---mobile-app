import { Stack } from 'expo-router';
import { palette } from '@/theme';
import { usePortalGuard } from '@/hooks/usePortalGuard';

export default function GcLayout() {
  usePortalGuard('gc');
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />;
}
