export type SignupEmailPayload = {
  email: string;
  password: string;
  redirectTo: string;
  metadata?: Record<string, unknown>;
};

export type PasswordResetEmailPayload = {
  email: string;
  redirectTo: string;
};

function authApiBase() {
  const base = process.env.EXPO_PUBLIC_AUTH_API_URL;
  if (!base) {
    throw new Error('Missing EXPO_PUBLIC_AUTH_API_URL. Point it to your FieldLog web app URL.');
  }
  return base.replace(/\/$/, '');
}

async function postAuth<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${authApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? 'Auth email request failed.');
  }
  return payload;
}

export function requestSignupEmail(payload: SignupEmailPayload) {
  return postAuth<{ needsEmailConfirmation: true }>('/api/auth/signup', payload);
}

export function requestPasswordResetEmail(payload: PasswordResetEmailPayload) {
  return postAuth<{ ok: true }>('/api/auth/password-reset', payload);
}
