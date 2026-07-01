import { getLogDetail, getProjectLogs, type LogListItem } from '@/lib/logs';
import { supabase } from '@/lib/supabase';

export type ReportPeriod = 'weekly' | 'monthly';

export type PeriodReport = {
  period: ReportPeriod;
  title: string;
  rangeLabel: string;
  periodStart: string;
  periodEnd: string;
  logCount: number;
  crewAvg: number | null;
  accomplishments: string[];
  delays: string[];
  safety: string[];
  materials: string[];
  narrative: string;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function windowStart(period: ReportPeriod): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (period === 'weekly' ? 7 : 30));
  return d;
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Build an owner-ready report by aggregating a project's recent daily logs. */
export async function buildPeriodReport(
  projectName: string,
  period: ReportPeriod,
  allLogs?: LogListItem[],
  projectId?: string,
): Promise<PeriodReport> {
  const logs = allLogs ?? (projectId ? await getProjectLogs(projectId) : []);
  const start = windowStart(period);
  const inWindow = logs.filter((l) => {
    const t = new Date(l.log_date + 'T00:00:00').getTime();
    return t >= start.getTime();
  });

  // Pull structured details for up to the most recent logs in the window.
  const details = await Promise.all(
    inWindow.slice(0, 30).map((l) => getLogDetail(l.id).catch(() => null)),
  );

  const accomplishments: string[] = [];
  const delays: string[] = [];
  const safety: string[] = [];
  const materials: string[] = [];
  const crews: number[] = [];

  for (const d of details) {
    if (!d) continue;
    const s = d.log.structured;
    if (typeof s.crew_count === 'number') crews.push(s.crew_count);
    else if (typeof d.log.crew_count === 'number') crews.push(d.log.crew_count);
    (s.work_completed ?? []).forEach((x) => accomplishments.push(x));
    (s.delays ?? []).forEach((x) => delays.push(x));
    (s.safety ?? []).forEach((x) => safety.push(x));
    (s.materials ?? []).forEach((x) => materials.push(x));
    if ((!s.work_completed || s.work_completed.length === 0) && d.log.summary) {
      accomplishments.push(d.log.summary);
    }
  }

  const dedupe = (arr: string[], max: number) => Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean))).slice(0, max);
  const crewAvg = crews.length ? Math.round(crews.reduce((a, b) => a + b, 0) / crews.length) : null;

  const now = new Date();
  const title = period === 'weekly' ? 'Weekly Owner Update' : 'Monthly Executive Summary';
  const rangeLabel = `${fmt(start)} – ${fmt(now)}`;

  const narrative =
    inWindow.length === 0
      ? `No daily logs were filed for ${projectName} in this ${period === 'weekly' ? 'week' : 'month'}. File daily logs to generate an owner-ready summary.`
      : `${projectName} recorded ${inWindow.length} daily ${inWindow.length === 1 ? 'log' : 'logs'} this ${
          period === 'weekly' ? 'week' : 'month'
        }${crewAvg ? `, averaging ${crewAvg} crew on site` : ''}. ${
          accomplishments.length ? `Key progress includes ${accomplishments.length} completed work items.` : ''
        }${delays.length ? ` ${delays.length} delay item(s) were noted.` : ' No delays were reported.'}${
          safety.length ? ` ${safety.length} safety note(s) logged.` : ' No safety incidents.'
        }`;

  return {
    period,
    title,
    rangeLabel,
    periodStart: iso(start),
    periodEnd: iso(now),
    logCount: inWindow.length,
    crewAvg,
    accomplishments: dedupe(accomplishments, 8),
    delays: dedupe(delays, 6),
    safety: dedupe(safety, 6),
    materials: dedupe(materials, 6),
    narrative,
  };
}

/** Build a friendly, owner-facing title like "Weekly Report — Jun 1–7". */
export function reportShareTitle(report: PeriodReport): string {
  return `${report.period === 'weekly' ? 'Weekly' : 'Monthly'} Report — ${report.rangeLabel}`;
}

/**
 * Persist an aggregated report so it shows up in the owner portal
 * (project_reports). Calls the fl_create_project_report RPC.
 */
export async function shareProjectReport(projectId: string, report: PeriodReport): Promise<void> {
  const { error } = await supabase.rpc('fl_create_project_report' as never, {
    p_project_id: projectId,
    p_period_type: report.period,
    p_period_start: report.periodStart,
    p_period_end: report.periodEnd,
    p_title: reportShareTitle(report),
    p_summary: report.narrative,
    p_structured: {
      accomplishments: report.accomplishments,
      delays: report.delays,
      safety: report.safety,
      materials: report.materials,
      crew_avg: report.crewAvg,
      log_count: report.logCount,
    },
  } as never);
  if (error) throw error;
}
