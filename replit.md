# Zeroed

## Overview

Zeroed is a mobile-first time management and daily scheduling app built for kids, teens, and young adults. It helps users create structured timetables, track daily block completion, and build productive habits. The app features a multi-step onboarding flow that collects user preferences (age group, hobbies, challenges) and auto-generates a personalized daily schedule. Users can view their day, manage their weekly plan, and track progress.

The project uses a dual architecture: an Expo/React Native frontend for cross-platform mobile and web support, paired with an Express.js backend server. Authentication and data storage are handled through Supabase (hosted PostgreSQL + Auth), while Drizzle ORM is configured for schema management and migrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: expo-router v6 with file-based routing and typed routes
- **Navigation structure**: Three route groups:
  - `(auth)` — Sign in / Sign up screens
  - `(onboarding)` — 4-step onboarding wizard (name/age, hobbies, challenges, schedule generation)
  - `(tabs)` — Main app with 4 tabs: Today, Plan, Progress, Profile
  - `add-block` — Modal screen for creating/editing timetable blocks
- **State management**: React Context for auth state (`AuthProvider`), TanStack React Query for server state
- **UI**: Custom StyleSheet-based components (no UI library), Inter font family, category-based color system
- **Platform handling**: Supports iOS, Android, and Web with platform-specific adjustments (web top inset offsets, keyboard handling)
- **Key libraries**: react-native-reanimated, react-native-gesture-handler, expo-haptics, expo-linear-gradient, expo-blur, expo-image-picker, date-fns

### Backend (Express.js)
- **Server**: Express v5 running on Node.js with TypeScript (compiled via tsx for dev, esbuild for production)
- **API pattern**: Routes registered in `server/routes.ts`, prefixed with `/api`
- **CORS**: Dynamic origin allowlist based on Replit environment variables, plus localhost support for development
- **Storage layer**: `server/storage.ts` defines an `IStorage` interface with an in-memory implementation (`MemStorage`). This is a scaffold — the actual app data lives in Supabase, not this storage layer
- **Static serving**: In production, serves the Expo web build from a `dist/` directory; in development, proxies to the Metro bundler

### Authentication & Authorization
- **Provider**: Supabase Auth (email/password)
- **Token storage**: AsyncStorage for native, localStorage for web
- **Auth flow**: The root `_layout.tsx` checks session state and redirects users to auth, onboarding, or main tabs based on their session and profile completion status
- **Profile management**: User profiles stored in Supabase `profiles` table, fetched on auth state change

### Data Model (Supabase)
The app uses Supabase tables directly (not the Drizzle schema for runtime queries):
- **profiles** — User profile with name, age_group, hobbies (array), challenge, onboarding_complete flag
- **timetable_blocks** — Schedule blocks with title, category, start_time, end_time, days_of_week (array of day numbers), reminder flag
- **daily_logs** — Completion tracking per block per date (block_id, date, completed)

The Drizzle schema in `shared/schema.ts` defines a basic `users` table for the Express backend, but the core app data is managed in Supabase.

### Database Configuration
- **Drizzle config** (`drizzle.config.ts`): PostgreSQL dialect, schema in `shared/schema.ts`, migrations output to `./migrations`
- **Environment variable**: `DATABASE_URL` required for Drizzle operations
- **Runtime queries**: The frontend talks directly to Supabase using `@supabase/supabase-js`, not through the Express API for most CRUD operations

### Schedule Generation
- `lib/schedule-generator.ts` creates age-appropriate daily schedules with predefined block templates for kid, teen, and young_adult age groups
- Generates blocks for weekdays (Mon-Fri) during onboarding step 4

### Build & Deploy
- **Dev**: Two processes — `expo:dev` for Metro bundler, `server:dev` for Express
- **Production build**: `expo:static:build` creates a web build, `server:build` bundles the Express server with esbuild, `server:prod` serves everything
- **Database migrations**: `db:push` uses drizzle-kit to push schema changes

## External Dependencies

### Supabase
- **Purpose**: Authentication (email/password) and PostgreSQL database
- **Config**: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables
- **Client**: Configured in `lib/supabase.ts` with SecureStore adapter for session persistence
- **Tables used**: profiles, timetable_blocks, daily_logs

### PostgreSQL (via DATABASE_URL)
- **Purpose**: Used by Drizzle ORM for schema management and migrations
- **Note**: This may be a separate Postgres instance from Supabase, or could point to the Supabase database

### Key NPM Dependencies
- `@supabase/supabase-js` — Supabase client SDK
- `@tanstack/react-query` — Server state management
- `drizzle-orm` + `drizzle-zod` — ORM and schema validation
- `expo-router` — File-based routing
- `expo-secure-store` — Secure token storage on native
- `express` — Backend HTTP server
- `pg` — PostgreSQL client for Drizzle
- `date-fns` — Date formatting utilities
- `patch-package` — Post-install patches (check `patches/` directory for any custom patches)