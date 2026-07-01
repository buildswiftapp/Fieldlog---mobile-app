import { useLocalSearchParams } from 'expo-router';
import { ReportViewerScreen } from '@/components/ReportViewerScreen';
import type { ReportPeriod } from '@/lib/reports';

export default function GcReport() {
  const { id, name, period } = useLocalSearchParams<{ id: string; name?: string; period?: string }>();
  return (
    <ReportViewerScreen
      portal="gc"
      projectId={id}
      projectName={name ?? 'Project'}
      period={(period === 'monthly' ? 'monthly' : 'weekly') as ReportPeriod}
    />
  );
}
