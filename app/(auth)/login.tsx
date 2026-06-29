import { Redirect } from 'expo-router';

export default function LoginIndex() {
  return <Redirect href="/(auth)/login/gc" />;
}
