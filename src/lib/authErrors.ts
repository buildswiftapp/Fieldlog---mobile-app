export function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('redirect') && lower.includes('url')) {
    return (
      'This app URL is not allowed in Supabase. In the Supabase dashboard open Authentication → URL Configuration and add fieldlog://auth-callback and fieldlog://reset-password (and your Expo web URL if testing in a browser).'
    );
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (lower.includes('fetch failed') || lower.includes('network')) {
    return 'Could not reach Supabase. Check your internet connection and Supabase project URL.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email from the verification link we sent, then sign in again.';
  }
  return message;
}
