import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function GcProjectsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.tx,
        headerTitleStyle: { color: palette.tx },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'New Project', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Project' }} />
    </Stack>
  );
}
