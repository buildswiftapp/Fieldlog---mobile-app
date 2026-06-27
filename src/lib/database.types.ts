export type UserType = 'gc' | 'sub' | 'owner';
export type OrgType = 'gc' | 'sub' | 'owner';
export type MemberRole = 'superintendent' | 'pm' | 'foreman' | 'member' | 'owner_viewer';
export type MemberStatus = 'active' | 'invited' | 'idle' | 'revoked';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

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

export type Subscription = {
  id: string;
  organization_id: string;
  plan_name: string;
  status: SubscriptionStatus;
  active_project_limit: number;
  billing_interval: string;
  renewal_date: string | null;
  created_at: string;
};

export type MagicLinkToken = {
  id: string;
  token_hash: string;
  owner_email: string;
  gc_organization_id: string;
  project_id: string | null;
  issued_by_user_id: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type AuditLogEntry = {
  id: number;
  organization_id: string | null;
  project_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
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
      subscriptions: {
        Row: Subscription;
        Insert: Partial<Subscription>;
        Update: Partial<Subscription>;
        Relationships: [];
      };
      magic_link_tokens: {
        Row: MagicLinkToken;
        Insert: Partial<MagicLinkToken>;
        Update: Partial<MagicLinkToken>;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Partial<AuditLogEntry>;
        Update: Partial<AuditLogEntry>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fl_bootstrap_organization: {
        Args: { p_name: string; p_type: OrgType; p_trade?: string | null; p_brand_color?: string | null };
        Returns: string;
      };
      fl_issue_magic_link: {
        Args: { p_gc_org: string; p_owner_email: string; p_project_id?: string | null };
        Returns: string;
      };
      fl_validate_magic_link: {
        Args: { p_token: string };
        Returns: unknown;
      };
    };
    Enums: {
      org_type: OrgType;
      user_type: UserType;
      member_role: MemberRole;
      member_status: MemberStatus;
      subscription_status: SubscriptionStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
