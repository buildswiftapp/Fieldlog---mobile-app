import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserType } from '@/lib/database.types';

const KEY = 'fl_pending_user_type';

export async function setPendingUserType(type: Exclude<UserType, 'owner'> | null) {
  if (type) await AsyncStorage.setItem(KEY, type);
  else await AsyncStorage.removeItem(KEY);
}

export async function consumePendingUserType(): Promise<Exclude<UserType, 'owner'> | null> {
  const value = await AsyncStorage.getItem(KEY);
  await AsyncStorage.removeItem(KEY);
  if (value === 'gc' || value === 'sub') return value;
  return null;
}
