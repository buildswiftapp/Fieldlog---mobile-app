export type UserType = 'gc' | 'sub' | 'owner';
export type OrgType = 'gc' | 'sub' | 'owner';
export type MemberRole = 'superintendent' | 'pm' | 'foreman' | 'member' | 'owner_viewer';
export type MemberStatus = 'active' | 'invited' | 'idle' | 'revoked';

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
    };
    Views: Record<string, never>;
    Functions: {
      fl_bootstrap_organization: {
        Args: { p_name: string; p_type: OrgType; p_trade?: string | null; p_brand_color?: string | null };
        Returns: string;
      };
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
