export type UserType = 'gc' | 'sub' | 'owner';
export type OrgType = 'gc' | 'sub' | 'owner';
export type MemberRole = 'superintendent' | 'pm' | 'foreman' | 'member' | 'owner_viewer';
export type MemberStatus = 'active' | 'invited' | 'idle' | 'revoked';
export type ProjectStatus = 'active' | 'archived';
export type SubAssignmentStatus = 'pending' | 'active' | 'removed';
export type InviteStatus = 'pending' | 'accepted' | 'revoked';

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
