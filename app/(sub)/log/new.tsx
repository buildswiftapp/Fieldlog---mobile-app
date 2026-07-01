import { useLocalSearchParams } from 'expo-router';
import { RecordLogScreen } from '@/components/RecordLogScreen';

export default function SubNewLog() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  return <RecordLogScreen role="sub" projectId={projectId} />;
}
