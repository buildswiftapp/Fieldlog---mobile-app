import { Tabs } from 'expo-router';
import { BellIcon, FolderIcon, HomeIcon, SettingsIcon } from '@/components/icons';
import { palette } from '@/theme';

export default function GcLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.tx3,
        tabBarStyle: {
          backgroundColor: palette.bg2,
          borderTopColor: palette.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10 },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <HomeIcon color={color} size={21} /> }}
      />
      <Tabs.Screen
        name="projects"
        options={{ title: 'Projects', tabBarIcon: ({ color }) => <FolderIcon color={color} size={21} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Alerts', tabBarIcon: ({ color }) => <BellIcon color={color} size={21} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => <SettingsIcon color={color} size={21} /> }}
      />
    </Tabs>
  );
}
