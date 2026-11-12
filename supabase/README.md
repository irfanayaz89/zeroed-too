# Database

Zeroed (adult) uses the same Supabase project as Zero'd (teen), so one account works in both apps and progress carries over.

- The full schema lives in the teen repo (`irfanayaz89/Zeroed`, `supabase/schema.sql`). That file drops and recreates every table, so never run it against the shared project once people use it.
- Changes the adult app needs go in `migrations/` here. Each one must be additive (new columns with defaults, new tables) so the teen app keeps working.
- Run a migration by pasting it into the SQL Editor of the shared project.

## How the two apps read each other's data

- Block categories: the teen app writes `study`, `reading`, `project`, `hobby`; the adult app writes `work`, `learning`, `health`, `personal`, `side`. Each app maps the other's categories to its own (see `categoryOf` in `lib/focus.ts`).
- Old teen blocks for meals, sleep, chores, free time and wind-down are hidden, as they are in the teen app.
- `profiles.focus_struggle` ids differ between the apps. An id one app doesn't know shows as not set.
- Deleting the account (`delete_my_account`) removes it from both apps.
