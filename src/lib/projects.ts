import type { MemberRole, MemberStatus, ProjectStatus, SubAssignmentStatus } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ProjectListItem = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: ProjectStatus;
  start_date: string | null;
  created_at: string;
  role: 'gc' | 'sub';
  subcontractor_count?: number;
  gc_org_name?: string | null;
  trade?: string | null;
};

export type ProjectSub = {
  id: string;
  invited_email: string;
  trade: string | null;
  status: SubAssignmentStatus;
  sub_org_id: string | null;
  sub_org_name: string | null;
};

export type ProjectMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: MemberRole;
  status: MemberStatus;
};

export type ProjectDetail = {
  project: {
    id: string;
    gc_org_id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    status: ProjectStatus;
    start_date: string | null;
    created_at: string;
  };
  viewer_role: 'gc' | 'sub';
  subcontractors: ProjectSub[];
  members: ProjectMember[];
};

function unwrap<T>(data: unknown): T {
  return data as T;
}

export async function listMyProjects(): Promise<ProjectListItem[]> {
  const { data, error } = await supabase.rpc('fl_my_projects');
  if (error) throw error;
  return unwrap<ProjectListItem[]>(data) ?? [];
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetail> {
  const { data, error } = await supabase.rpc('fl_project_detail', { p_id: projectId });
  if (error) throw error;
  return unwrap<ProjectDetail>(data);
}

export type NewProjectInput = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  startDate?: string;
};

export async function createProject(input: NewProjectInput) {
  const { data, error } = await supabase.rpc('fl_create_project', {
    p_name: input.name,
    p_address: input.address?.trim() || null,
    p_city: input.city?.trim() || null,
    p_state: input.state?.trim() || null,
    p_start_date: input.startDate || null,
  });
  if (error) throw error;
  return data;
}

export async function setProjectStatus(projectId: string, status: ProjectStatus) {
  const { error } = await supabase.rpc('fl_update_project', { p_id: projectId, p_status: status });
  if (error) throw error;
}

export async function assignSubcontractor(projectId: string, email: string, trade?: string) {
  const { error } = await supabase.rpc('fl_assign_subcontractor', {
    p_project_id: projectId,
    p_email: email.trim(),
    p_trade: trade?.trim() || null,
  });
  if (error) throw error;
}

export async function removeSubcontractor(assignmentId: string) {
  const { error } = await supabase.rpc('fl_remove_subcontractor', { p_id: assignmentId });
  if (error) throw error;
}

export async function inviteMember(email: string, role: MemberRole = 'member') {
  const { error } = await supabase.rpc('fl_invite_member', { p_email: email.trim(), p_role: role });
  if (error) throw error;
}

export async function acceptMyInvites() {
  const { error } = await supabase.rpc('fl_accept_my_invites');
  if (error) throw error;
}
