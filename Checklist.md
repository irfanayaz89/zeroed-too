# Zeroed V1 — Feature Breakdown

---

## 1. Auth

- [x] Email sign up + sign in (Supabase Auth)
- [x] Session persistence + auto token refresh
- [x] COPPA notice for kids under 13
- [x] Sign out + delete data
- [ ] Delete account (double confirmation)

## 2. Onboarding

- [x] 5-screen flow with progress dots (welcome → account → about you → hobbies → challenge)
- [x] Auto-generate starter timetable by age group (weekday + weekend)
- [x] "Building your day…" animated loading screen
- [x] Schedule preview — accept or start fresh
- [ ] App Icon to use and splash screen

## 3. Today Tab

- [ ] Focus Score banner (circular ring, 0–100, real-time updates)
- [ ] "What should I do right now?" button (shows current/next block context)
- [x] Current block highlight (NOW badge, countdown timer, UP NEXT card)
- [x] Daily timeline — block cards with color-coded categories, time, checkbox
- [x] Block detail bottom sheet (add note, mark complete/skipped)
- [ ] Hobby prompt card ("Daily Spark" from DB)

## 4. Plan Tab

- [x] Weekday/weekend toggle + day selector
- [ ] Add/edit/delete blocks (title, category, times, days, reminder settings)
- [x] Block list sorted by time with swipe-to-delete
- [x] Conflict detection (overlapping blocks warning)

## 5. Progress Tab

- [x] Daily reflection check-in (mood emoji + optional note)
- [x] Focus Score summary (today, weekly average, personal best)
- [x] Streak tracking with milestone celebrations (3, 7, 14, 30… days)
- [x] Weekly bar chart + mood trend row
- [x] Snooze report card

## 6. Profile Tab

- [ ] User info (name, age group, hobbies, challenge) — all editable
- [ ] Parent weekly summary link (shareable URL or email)
- [ ] Notification settings (global toggle, default style, quiet hours)
- [ ] Dark mode toggle
- [ ] Export data + privacy/terms links

## 7. Notifications

- [ ] Local push reminders: pre-alert + start-time per block
- [ ] 3 styles: Gentle Nudge, Alarm, Motivational (with age-based quotes)
- [ ] Quiet hours enforcement
- [ ] Auto-reschedule on app launch + cancel on block edit/delete

## 8. Dark Mode

- [ ] Full theme toggle (light/dark) across all screens, modals, and components
- [ ] Preference saved to profile + AsyncStorage
- [ ] Dark palette: #1A1A2E background, #16213E surfaces, accent colors unchanged

## 9. Animations & Polish

- [ ] Block completion: checkbox animation + mini confetti + score increment
- [ ] Focus Score ring animated fill + color transitions
- [ ] Current block pulsing glow
- [ ] Streak milestone full-screen confetti
- [ ] Skeleton loaders for all data-loading states
