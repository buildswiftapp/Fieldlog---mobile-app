import { useLocalSearchParams } from 'expo-router';
import { LogDetailScreen } from '@/components/logs/LogDetailScreen';

export default function GcLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogDetailScreen role="gc" logId={String(id)} />;
}
