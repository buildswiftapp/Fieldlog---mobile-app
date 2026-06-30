import { useLocalSearchParams } from 'expo-router';
import { RecordLogScreen } from '@/components/logs/RecordLogScreen';

export default function GcNewLog() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  return <RecordLogScreen role="gc" projectId={projectId ? String(projectId) : undefined} />;
}
