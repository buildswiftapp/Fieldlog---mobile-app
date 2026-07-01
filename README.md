# FieldLog — Mobile App (GC + Sub)

A fresh, pixel-faithful React Native (Expo Router) implementation of the FieldLog
prototypes. **One download, two experiences:** after sign-in, Supabase stores each
user's role (`gc` or `sub`) and the app routes automatically to the General
Contractor interface (orange/blue) or the Subcontractor interface (purple).

This app reuses the existing FieldLog Supabase project (same URL / anon key / database
and RPCs) so it works against live data alongside the original app.

## Run

```bash
npm install        # deps (Expo 52 / RN 0.76)
npm run start      # Expo dev server
npm run web        # run in the browser
npm run typecheck  # tsc --noEmit
```

Supabase + AI endpoints are configured in `.env`:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — reused from the old project
- `EXPO_PUBLIC_AUTH_API_URL` — the FieldLog web app (used for AI transcribe / structure-log + review notify)

## Structure

```
app/
  _layout.tsx            Root: AuthProvider + Stack
  index.tsx              Routes by auth + role (gc/sub)
  (auth)/                login, signup, forgot-password, onboarding, auth-callback, reset-password
  (gc)/                  General Contractor portal (orange)
    home, projects, projects/new, projects/[id] (tabbed),
    log/new, logs/[id], search, activity, settings, faq, legal
  (sub)/                 Subcontractor portal (purple)
    home, projects, projects/[id], log/new, logs/[id],
    search, activity, settings, faq, legal
src/
  components/            Pixel-matched UI primitives (ui, shell, BottomNav, icons),
                         shared screens (RecordLog, LogDetail, Search, Activity, Settings, Faq, Legal)
  lib/                   supabase client, data layer (projects, logs, ai), roles, auth helpers, format
  context/AuthContext    session / profile / organization + signIn/signUp/bootstrap
  theme/                 design tokens (palette, role themes)
```

## Design system

Tokens mirror the prototype CSS variables exactly (backgrounds `#0D0F12`→`#21252C`,
text `#F0F2F5`/`#8A909A`/`#565C68`, accents orange `#F59E0B` (GC), purple `#8B5CF6`
(Sub), blue `#2563EB`, green/red). Role theming is centralized in `src/theme` and the
bottom nav / buttons / mic recolor automatically per portal.

## Wired to live data

- Auth: native Supabase email/password sign-in & sign-up, role-based routing, email
  confirmation & password reset deep links (`fieldlogapp://`).
- Projects: list, create, detail (overview / logs / sub-logs / team / reports / timeline),
  assign subcontractor.
- Daily logs: voice record → AI transcription → AI structuring → review → submit, photo
  attachments, GC approval, log detail.
- Home dashboards: live stats, project health, recent activity, AI alerts.
