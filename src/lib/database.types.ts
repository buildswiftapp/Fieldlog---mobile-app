export type UserType = 'gc' | 'sub' | 'owner';
export type OrgType = 'gc' | 'sub' | 'owner';
export type MemberRole = 'superintendent' | 'pm' | 'foreman' | 'member' | 'owner_viewer';
export type MemberStatus = 'active' | 'invited' | 'idle' | 'revoked';
export type ProjectStatus = 'active' | 'archived';
export type SubAssignmentStatus = 'pending' | 'active' | 'removed';
export type InviteStatus = 'pending' | 'accepted' | 'revoked';
export type LogStatus = 'draft' | 'submitted' | 'reviewed' | 'rejected';
export type AlertSeverity = 'info' | 'warning';
export type NotificationKind = 'log_submitted' | 'log_reviewed' | 'log_alert' | 'sub_assigned';

export type Notification = {
  id: string;
  user_id: string;
  organization_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  project_id: string | null;
  log_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type LogStructured = {
  crew_count?: number | null;
  weather?: string | null;
  work_completed?: string[];
  delays?: string[];
  materials?: string[];
  safety?: string[];
  visitors?: string[];
};

export type DailyLog = {
  id: string;
  project_id: string;
  author_user_id: string | null;
  author_org_id: string | null;
  log_date: string;
  status: LogStatus;
  transcript: string | null;
  summary: string | null;
  structured: LogStructured;
  crew_count: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: UserType;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  type: OrgType;
  name: string;
  logo_url: string | null;
  brand_color: string | null;
  trade: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website: string | null;
  license_number: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  is_primary: boolean;
  created_at: string;
};

export type Project = {
  id: string;
  gc_org_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  status: ProjectStatus;
  start_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectSubcontractor = {
  id: string;
  project_id: string;
  sub_org_id: string | null;
  invited_email: string;
  trade: string | null;
  status: SubAssignmentStatus;
  created_by: string | null;
  created_at: string;
};

export type OrgInvitation = {
  id: string;
  organization_id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  invited_by: string | null;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & { type: OrgType; name: string };
        Update: Partial<Organization>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Partial<OrganizationMember>;
        Update: Partial<OrganizationMember>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: Partial<Project> & { gc_org_id: string; name: string };
        Update: Partial<Project>;
        Relationships: [];
      };
      project_subcontractors: {
        Row: ProjectSubcontractor;
        Insert: Partial<ProjectSubcontractor> & { project_id: string; invited_email: string };
        Update: Partial<ProjectSubcontractor>;
        Relationships: [];
      };
      org_invitations: {
        Row: OrgInvitation;
        Insert: Partial<OrgInvitation> & { organization_id: string; email: string };
        Update: Partial<OrgInvitation>;
        Relationships: [];
      };
      daily_logs: {
        Row: DailyLog;
        Insert: Partial<DailyLog> & { project_id: string };
        Update: Partial<DailyLog>;
        Relationships: [];
      };
      daily_log_photos: {
        Row: { id: string; log_id: string; storage_path: string; caption: string | null; created_at: string };
        Insert: { log_id: string; storage_path: string; caption?: string | null };
        Update: Partial<{ caption: string | null }>;
        Relationships: [];
      };
      daily_log_alerts: {
        Row: {
          id: string;
          log_id: string;
          project_id: string;
          severity: AlertSeverity;
          kind: string | null;
          message: string;
          created_at: string;
        };
        Insert: { log_id: string; project_id: string; message: string; severity?: AlertSeverity; kind?: string | null };
        Update: Partial<{ message: string; severity: AlertSeverity; kind: string | null }>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; kind: NotificationKind; title: string };
        Update: Partial<Pick<Notification, 'read_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fl_bootstrap_organization: {
        Args: { p_name: string; p_type: OrgType; p_trade?: string | null; p_brand_color?: string | null };
        Returns: string;
      };
      fl_create_project: {
        Args: {
          p_name: string;
          p_address?: string | null;
          p_city?: string | null;
          p_state?: string | null;
          p_start_date?: string | null;
        };
        Returns: Project;
      };
      fl_update_project: {
        Args: {
          p_id: string;
          p_name?: string | null;
          p_address?: string | null;
          p_city?: string | null;
          p_state?: string | null;
          p_start_date?: string | null;
          p_status?: ProjectStatus | null;
        };
        Returns: Project;
      };
      fl_my_projects: { Args: Record<string, never>; Returns: unknown };
      fl_project_detail: { Args: { p_id: string }; Returns: unknown };
      fl_assign_subcontractor: {
        Args: { p_project_id: string; p_email: string; p_trade?: string | null };
        Returns: ProjectSubcontractor;
      };
      fl_remove_subcontractor: { Args: { p_id: string }; Returns: undefined };
      fl_invite_member: { Args: { p_email: string; p_role?: MemberRole }; Returns: OrgInvitation };
      fl_accept_my_invites: { Args: Record<string, never>; Returns: undefined };
      fl_link_my_sub_invites: { Args: Record<string, never>; Returns: undefined };
      fl_can_access_project: { Args: { p_project: string }; Returns: boolean };
      fl_create_daily_log: {
        Args: {
          p_project_id: string;
          p_transcript?: string | null;
          p_summary?: string | null;
          p_structured?: LogStructured;
          p_crew_count?: number | null;
          p_alerts?: unknown;
          p_log_date?: string;
          p_status?: LogStatus;
        };
        Returns: DailyLog;
      };
      fl_add_log_photo: { Args: { p_log_id: string; p_path: string; p_caption?: string | null }; Returns: undefined };
      fl_my_recent_logs: { Args: { p_limit?: number }; Returns: unknown };
      fl_project_logs: { Args: { p_project_id: string }; Returns: unknown };
      fl_log_detail: { Args: { p_id: string }; Returns: unknown };
      fl_review_log: { Args: { p_id: string }; Returns: undefined };
      fl_home_stats: { Args: Record<string, never>; Returns: unknown };
      fl_my_notifications: { Args: { p_limit?: number; p_unread_only?: boolean }; Returns: unknown };
      fl_unread_notification_count: { Args: Record<string, never>; Returns: number };
      fl_mark_notification_read: { Args: { p_id: string }; Returns: undefined };
      fl_mark_all_notifications_read: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      org_type: OrgType;
      user_type: UserType;
      member_role: MemberRole;
      member_status: MemberStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
