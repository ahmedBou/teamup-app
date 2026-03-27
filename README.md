# TeamUp App

TeamUp is a mobile MVP for creating and joining local cycling activities.

The app lets users:
- sign in with Google
- complete onboarding
- discover upcoming rides
- create activities
- join activities
- view group details
- chat inside an activity group
- visualize participants through a puzzle-style group board

## Current MVP Scope

### Authentication
- Google Sign-In with Supabase Auth
- persistent session restore
- protected app areas

### Profile
- automatic profile creation after login
- onboarding completion flow
- profile storage in Supabase
- profile screen

### Activities
- discover upcoming activities
- create a new cycling activity
- activity details screen
- participant join flow
- host auto-joins on activity creation

### Group
- participant list
- puzzle board preview
- group screen
- simple group chat

---

## Tech Stack

- **Expo**
- **React Native**
- **Expo Router**
- **TypeScript**
- **Supabase**
  - Auth
  - Postgres
  - Row Level Security

---

## Project Structure

```text
app/
  (tabs)/
    home.tsx
    create.tsx
    profile.tsx
    _layout.tsx
  activity/
    [id].tsx
  group/
    [id].tsx
  auth/
    callback.tsx
  index.tsx
  onboarding.tsx

components/
  auth/
  puzzle/

hooks/
  useAuth.ts
  useProfile.ts
  useActivities.ts
  useActivity.ts
  useActivityParticipants.ts
  useParticipantProfiles.ts
  useMessages.ts

src/
  auth/
  lib/
  services/
  types/