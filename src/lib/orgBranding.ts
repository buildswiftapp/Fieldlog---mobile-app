import { supabase } from '@/lib/supabase';

const LOGO_BUCKET = 'logos';

function extFromUri(uri: string) {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

function mimeFromExt(ext: string) {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

export async function uploadOrganizationLogo(orgId: string, uri: string) {
  const ext = extFromUri(uri);
  const path = `${orgId}/logo.${ext}`;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const contentType = mimeFromExt(ext);

  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, arrayBuffer, {
    upsert: true,
    contentType,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  const logoUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ logo_url: logoUrl })
    .eq('id', orgId);
  if (updateError) throw updateError;

  return logoUrl;
}

export type OrganizationPatch = {
  name?: string;
  brand_color?: string | null;
  trade?: string | null;
  license_number?: string | null;
  phone?: string | null;
  website?: string | null;
};

export async function updateOrganization(orgId: string, patch: OrganizationPatch) {
  const { error } = await supabase.from('organizations').update(patch).eq('id', orgId);
  if (error) throw error;
}

export async function updateProfileName(userId: string, fullName: string) {
  const { error } = await supabase.from('profiles').update({ full_name: fullName.trim() }).eq('id', userId);
  if (error) throw error;
}
