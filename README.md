# PausePay Boilerplate (React Native + Firebase)

PausePay is an impulse-control budgeting app starter built with React Native (Expo) and Firebase Realtime Database.

## MVP Features Included

### 1) Home Screen
- Daily spending limit
- Remaining balance
- Progress bar (spent vs daily limit)
- Soft warning when close to limit
- Quick button to open purchase logging

### 2) Log Purchase Screen
- Amount input
- Category selection (Food, Transport, Shopping, Bills, Other)
- 30-second pause-before-confirm timer
- Reflection prompts:
  - “Do you need this right now?”
  - “What’s your remaining budget after this?”
- Confirm or cancel purchase

### 3) Insights Screen
- Weekly total spend
- Category summary bar chart
- Daily breakdown for last 7 days

### 4) Settings Screen
- Daily and weekly budget setup
- Toggle soft limit warnings
- Toggle pause timer

### 5) Feedback System
- Rating (1–5)
- Feedback type (suggestion, bug report, general)
- Feedback message input
- Submits feedback to Firebase Realtime Database

---

## Tech Stack
- **React Native** with **Expo**
- **TypeScript**
- **Firebase Realtime Database**

---

## Firebase Data Shape

All app data is stored under a user key (`users/demo-user` by default):

- `users/{userId}/settings`
  - `dailyBudget`
  - `weeklyBudget`
  - `softLimitWarnings`
  - `pauseTimerEnabled`
- `users/{userId}/transactions`
  - push list of transaction objects
- `users/{userId}/feedback`
  - push list of feedback submissions

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase
1. Create a Firebase project.
2. Enable **Realtime Database**.
3. Copy `.env.example` to `.env` and fill values:
```bash
cp .env.example .env
```

If env vars are missing, the app still runs in local-only mode (no remote writes).

### 3. Run app
```bash
npm run start
```

Then open using:
- iOS simulator (`npm run ios`)
- Android emulator (`npm run android`)
- Web (`npm run web`)

### 4. Type check
```bash
npm run typecheck
```

---

## Deployment (MVP)

### Expo build preview
```bash
npx expo export --platform web
```

### Mobile release builds (EAS)
1. Install EAS CLI:
```bash
npm install -g eas-cli
```
2. Login and configure:
```bash
eas login
eas build:configure
```
3. Build:
```bash
eas build --platform android
# or
eas build --platform ios
```

---

## Notes
- Current boilerplate uses `demo-user` as the default user key.
- Authentication and multi-user handling can be added in the next iteration.
