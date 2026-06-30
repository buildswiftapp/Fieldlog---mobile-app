import { useLocalSearchParams } from 'expo-router';
import { LogDetailScreen } from '@/components/logs/LogDetailScreen';

export default function SubLogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogDetailScreen role="sub" logId={String(id)} />;
}
