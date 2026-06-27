# FieldLog — Mobile App (GC + Sub)

One Expo (React Native) app serving **two role-based experiences** from a single binary:

| Role | Accent | After login |
|------|--------|-------------|
| **General Contractor (GC)** | Orange `#F59E0B` | `app/(gc)/` tabs |
| **Subcontractor (Sub)** | Purple `#8B5CF6` | `app/(sub)/` tabs |

Routing uses `profiles.user_type` from the shared Supabase backend (see `Fieldlog-Web-app/supabase/`).

## Milestone 1 (complete)

- Email/password auth: login, GC signup, Sub signup
- Google + Microsoft OAuth (GC login/signup; Sub signup with correct role)
- Forgot password + set new password (`reset-password`)
- OAuth callback + org onboarding for SSO users
- Role-based navigation with profile-load gating
- Tab shells: Home, Projects, Alerts, Settings
- Editable settings: name, company, logo, brand color, trade/license
- Legal links (Terms + Privacy) on all auth screens
- Architecture-themed brand loader

Projects and Alerts tabs are **M2/M4 placeholders** by design.

## Setup

### 1. Environment

Create `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Or set `extra.supabaseUrl` / `extra.supabaseAnonKey` in `app.json`.

### 2. Backend

Apply migrations from the web repo:

```bash
cd ../Fieldlog-Web-app
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 3. Auth redirect URLs

In Supabase Dashboard, add mobile redirect URLs (see web README).

Enable **Google** and **Azure (Microsoft)** providers if using SSO.

### 4. Run

```bash
npm install
npm start
```

Press `w` for web, `a` for Android, or scan QR for Expo Go.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Metro / Expo dev server |
| `npm run android` / `npm run ios` | Device or simulator |
| `npm run web` | Web bundle |
| `npm run typecheck` | TypeScript check |

## Deep links

| Path | Purpose |
|------|---------|
| `fieldlog://auth-callback` | OAuth return |
| `fieldlog://reset-password` | Password reset from email |

## Logo uploads

Company logos upload to the Supabase **`logos`** bucket at `{org_id}/logo.{ext}`. Ensure storage migrations are applied.
