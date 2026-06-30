import { useLocalSearchParams } from 'expo-router';
import { ProjectDetailScreen } from '@/components/projects/ProjectDetailScreen';

export default function SubProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProjectDetailScreen role="sub" projectId={String(id)} />;
}
