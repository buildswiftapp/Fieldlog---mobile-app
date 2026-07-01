import { useLocalSearchParams } from 'expo-router';
import { LogDetailScreen } from '@/components/LogDetailScreen';

export default function GcLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogDetailScreen id={id} role="gc" />;
}
