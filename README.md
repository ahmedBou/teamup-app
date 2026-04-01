# TeamUp

TeamUp is a mobile MVP for discovering, creating, and joining local cycling activities.

The product is designed around a social group formation flow:
users discover rides, join activities, enter a shared group space, and interact through a lightweight group chat and a visual puzzle-style participant board.

## Product Vision

TeamUp is not just an activity listing app.

Its long-term goal is to make joining local activities feel more social, more visual, and more rewarding by combining:

- local activity discovery
- lightweight group formation
- participant visibility
- shared group interaction
- progressive “group completion” through a puzzle mechanic

The first MVP focuses on cycling communities.

---

## Current MVP Features

### Authentication
- Google Sign-In with Supabase Auth
- session persistence across app relaunch
- protected authenticated routes

### User Profile
- automatic profile creation after first login
- onboarding flow
- onboarding completion persistence
- profile screen connected to backend data

### Activity Discovery
- discover upcoming rides
- create a new activity
- activity details screen
- host automatically joins created activity

### Participation
- join activity flow
- participant list
- participant count
- full/occupied group visualization

### Group Experience
- reusable PuzzleBoard component
- group screen per activity
- participant overview
- simple group chat V1

---

## Main User Flow

```text
Welcome
→ Google Login
→ Session Restore
→ Profile Auto-Creation
→ Onboarding
→ Discover Feed
→ Create Activity
→ Activity Details
→ Join Activity
→ Group Screen
→ Chat

## Current Status

### Sprint 4 Progress

The MVP is now beyond the initial foundation stage and includes a working social activity loop.

### Completed
- Google authentication
- session persistence
- profile auto-creation
- onboarding flow
- editable profile
- discover feed
- create activity flow
- activity details screen
- participant join flow
- host auto-join
- leave activity flow
- host controls
- activity cancel flow
- reusable PuzzleBoard
- group screen
- chat V1
- improved date/time input for activity creation

### In Review
- automatic `open/full` activity status sync
- leave activity edge-case validation

### In Progress
- realtime group chat validation across multiple clients

### Product State
The app now supports the full core loop:

```text id="r6g4ks"
Login
→ Onboarding
→ Discover
→ Create Activity
→ Activity Details
→ Join
→ Group
→ Chat