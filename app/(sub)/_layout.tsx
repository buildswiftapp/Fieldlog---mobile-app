import { Stack } from 'expo-router';
import { palette } from '@/theme';
import { usePortalGuard } from '@/hooks/usePortalGuard';

export default function SubLayout() {
  usePortalGuard('sub');
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />;
}
