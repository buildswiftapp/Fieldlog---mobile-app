import { useLocalSearchParams } from 'expo-router';
import { LogDetailScreen } from '@/components/LogDetailScreen';

export default function SubLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogDetailScreen id={id} role="sub" />;
}
