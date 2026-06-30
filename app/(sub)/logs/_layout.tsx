import { Stack } from 'expo-router';
import { palette } from '@/theme';

export default function SubLogsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.tx,
        headerTitleStyle: { color: palette.tx },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="new" options={{ title: 'New Daily Log', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Daily Log' }} />
    </Stack>
  );
}
