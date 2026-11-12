# Zeroed (adult) V1 checklist

Spec: ADULT-APP-CONTEXT.md. Same features as the teen Focus'd V1, with no character, a dark-only theme, the polished arc and rolling countdown, full-screen focus mode and calm copy.

## Decisions still open

- [ ] App name ("Zeroed" is a placeholder)
- [ ] Default accent: Glacier (current) or Cobalt
- [ ] Supabase: new project (recommended) or the shared one
- [ ] Bundle ID (`com.zeronoiselabs.zeroedtoo` is a placeholder)
- [ ] App icon and splash screen

## Base

- [x] Bootstrapped from the teen app (irfanayaz89/Zeroed PR #6 head)
- [x] Renamed app, slug, scheme and bundle ID
- [x] Character removed (Dot, balloon, mood faces)
- [x] Line icons, no emoji, short calm copy
- [x] Theme: Graphite (default) and Black, seven accents, Sora and Manrope
- [x] Supabase schema trimmed (no age group, hobbies or buddy name) and `extra_minutes` added

## Auth

- [x] Welcome, email sign in and sign up, guest (anonymous) start
- [x] Save your progress (guest to email)
- [x] Sign out (warns guests), delete account (type DELETE)

## Onboarding

- [x] Name, focus areas (grouped by category, add your own), biggest challenge with an if-then plan
- [x] Free times, blocks a day, block length
- [x] 2-minute warm-up block on the real timer (skippable)
- [x] Notification pre-prompt with a real example
- [x] Building your plan, then plan preview (accept, or start with one block)

## Now

- [x] Focus Score card (today and 7-day)
- [x] Arc with orb, glow and tail; rolling-digit countdown
- [x] Done, Note, Skip (move to later or skip today)
- [x] Gap state with the next block and a wrap-up card for blocks that ended
- [x] Day done and empty states
- [x] Full-screen focus mode with +5 min, Done and auto-finish at time's up

## Plan

- [x] Week strip with good-day dots, timeline with status pills
- [x] Add and edit block (time, length, category, repeat days, overlap warning)
- [x] Delete one day or the whole block, with Undo
- [x] Running late (+15 to the current block, pushes later blocks)
- [x] Better time tip and next-week review

## Insights

- [x] 7-day score ring, daily chart with a good-day line and rest days
- [x] Streak (rest days never break it), focused hours, blocks done, best window, average block
- [x] What slips, weekly check-in

## Me

- [x] Theme and accent pickers
- [x] Default length, day start, heads-up time
- [x] Live Activity, not-started nudge, quiet hours, haptics
- [x] Export CSV

## Notifications and Live Activity

- [x] Heads-up before each block, quiet hours respected
- [x] Nudge if a block started 5 minutes ago and was not opened
- [x] Live Activity for the running block (iOS)

## Verification

- [x] `npx tsc --noEmit -p .` (one old error in `server/index.ts`)
- [x] `npx eslint .`
- [x] Web run with sample data: Now (block, gap, done, empty), focus mode, Plan, Insights, Me, add block, onboarding
- [ ] Device run on iOS (Live Activity, notifications, haptics)
