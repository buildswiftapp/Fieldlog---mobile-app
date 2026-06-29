import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MobilePortal } from '@/lib/roles';

const KEY = 'fl_oauth_portal';

export async function saveOAuthPortal(portal: MobilePortal) {
  await AsyncStorage.setItem(KEY, portal);
}

export async function loadOAuthPortal(): Promise<MobilePortal | null> {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'gc' || value === 'sub' ? value : null;
}

export async function clearOAuthPortal() {
  await AsyncStorage.removeItem(KEY);
}
