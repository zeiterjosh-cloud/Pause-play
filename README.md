# PausePay

An impulse-control budgeting app that helps users pause **before** spending, not just review spending after.

## Core Concept

When a user is about to make a discretionary purchase, they log it in the app and go through a short cooldown with reflection prompts before confirming.

---

## Free Plan — Core Control

Everything needed to genuinely improve behavior:

### Budgeting
- Manual expense tracking
- Daily/weekly spending limits
- Remaining balance display

### Impulse Control
- “Pause before purchase” timer (default: 30–60 seconds)
- Reflection prompts:
  - “Do you need this?”
  - “What’s your remaining budget?”

### Awareness
- Category breakdown
- Daily/weekly summaries
- Limit warnings

### Light Guardrails
- Soft spending limits (warning only, no hard block)

---

## Paid Plan — Structure & Accountability ($5–10/month)

Premium enhances control and accountability without paywalling core behavior-change value.

### 1) Automation
- Bank/credit card sync
- Auto-categorization
- Real-time alerts

### 2) Advanced Controls
- Custom cooldown timers (5 min → 24 hrs)
- Rule engine:
  - Time-based restrictions
  - Transaction limits
- Optional hard lock mode

### 3) Accountability
- Add trusted person (parent/friend/mentor)
- Weekly reports
- Overspending/rule-break alerts

### 4) Advanced Insights
- Spending trends
- Impulse trigger detection
- Monthly reports

### 5) Proof Mode
- Downloadable behavior reports:
  - Budget adherence
  - Spending improvement over time
  - Rule consistency

---

## MVP Scope (v1)

Build only:
1. Home screen with daily remaining amount + progress indicator
2. Log purchase flow (amount + category)
3. Pause-before-confirm countdown with reflection prompts
4. Daily limit tracking and warning state

Not in MVP:
- Bank sync
- AI features
- Advanced dashboards
- Accountability sharing

---

## Screen Blueprint

### Home (Daily Control Hub)
- “You have $X left today”
- Spent vs limit progress
- “Log Purchase” action
- Near-limit warning

### Log Purchase (Core Flow)
1. Enter amount + category
2. Start countdown
3. Show reflection prompts + post-purchase remaining estimate
4. Confirm or cancel

### Insights
- Basic category breakdown
- Daily/weekly totals

### Settings
- Daily/weekly budget
- Pause timer toggle

### Accountability (Paid)
- Invite trusted person
- Weekly report + overspending alert toggles

---

## Validation & Cost Guardrails

- Target build budget for v1: **$0–$50**
- Use free tooling and free tiers first
- Validate with personal usage for 1–2 weeks before expanding scope
- Monetize convenience, structure, and accountability (not basic access to budgeting)
