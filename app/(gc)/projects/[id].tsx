import { useLocalSearchParams } from 'expo-router';
import { ProjectDetailScreen } from '@/components/projects/ProjectDetailScreen';

export default function GcProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectDetailScreen role="gc" projectId={String(id)} />;
}
