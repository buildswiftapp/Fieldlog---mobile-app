import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function SignupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
