[README.md](https://github.com/user-attachments/files/27273085/README.md)
# MedCare — Clinical Operating System

> **B2B Healthcare SaaS Platform** · Built for the RagaAI Frontend Assessment

<div align="center">

🏥 **[Live Demo →](https://care-hub-ui.vercel.app)** &nbsp;&nbsp;|&nbsp;&nbsp; 📁 **[GitHub →](https://github.com/sushmakoteswari/care-hub-ui)**

</div>
<img width="1433" height="899" alt="image" src="https://github.com/user-attachments/assets/591f035d-f2ac-492c-bd71-39e2ecd2b300" />

---

## Test Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | admin@careiq.dev | Admin@123 | All pages, all patients, analytics, audit log |
| **Clinician** | clinician@careiq.dev | Clinic@123 | Assigned patients only, dashboard, notifications |

> Sign in with Google is also supported — role defaults to Clinician for new Google accounts.

---

## What Is MedCare

MedCare is a clinical operations dashboard for hospital administrators and clinicians. It manages patient records, tracks AI-generated risk scores, surfaces real-time alerts, and provides operational analytics — all within a HIPAA-aware interface.

This is not a tutorial app. Every feature maps to a real clinical workflow.

---

## Feature Highlights

### 🔐 Authentication & Access Control
- **Firebase Authentication** — Google OAuth + email/password
- **Role-Based Access Control (RBAC)** — Admin and Clinician roles with route-level guards via TanStack Router's `beforeLoad`
- **Session timeout** — 14-minute idle detection → warning modal with 60-second countdown → auto sign-out. Activity listeners pause during the modal so mouse movement doesn't steal the countdown
- Clinicians see only their assigned patients. Analytics and Audit Log are admin-only

### 🤖 AI-Powered Clinical Intelligence (Groq / Llama 3)
- **Ward Intelligence Panel** — Dashboard generates a live clinical briefing from the full patient census on every load
- **Risk Explanation** — Patient detail page: one click generates a plain-English explanation of why the patient is flagged at their current risk level, grounded in their actual vitals
- **SOAP Note Summarizer** — Condenses patient records into Subjective / Objective / Plan format
- **Graceful degradation** — Without `VITE_GROQ_API_KEY`, all AI features fall back to deterministic rule-based summaries derived from live patient data. The app is fully functional either way

### 👥 Patient Management
- **Grid and List views** with a toggle — preference persisted to localStorage
- **Debounced search** (320ms) across name, ID, condition, department
- **PHI Masking** — global toggle masks patient names, IDs, contact info and doctor names across every view simultaneously. Built for screen-sharing in clinical environments
- **Export CSV** — downloads the current filtered patient list instantly
- **Risk score gauge** — colour-coded acuity score (10–99) on every patient detail page
- **RBAC-scoped data** — clinicians only see patients assigned to them

### 📊 Analytics (Admin only)
Seven charts that tell a connected operational story:

| Chart | What It Answers |
|---|---|
| Admissions trajectory | Are we getting busier or slower? |
| Risk load by department | Which wards are carrying the most critical cases? |
| Claim denial — AI lift | What is our AI saving us in denied claims? (Before vs After) |
| Top presenting conditions | What are we actually treating most? |
| Physician workload | Who is overloaded? |
| AI diagnostic accuracy | Is our model improving over time? |
| Patient risk trend | Is our population getting healthier month over month? |

> The claim denial chart directly references RagaAI's published benchmark of 46.5% reduction in claim denials post-AI.

### 🔔 Notifications & Service Worker
- Registered Service Worker (`public/sw.js`) for native browser push notifications
- Clinically relevant alerts: risk elevations, lab results, appointment reminders
- **Notification centre** (`/notifications`) — full history with unread count badge, mark as read, mark all read, clear all
- Notifications fire on patient status changes and can be triggered manually from the dashboard

### 🛡️ HIPAA-Aware UI Patterns
- **PHI masking** across all views with a single toggle
- **Session auto-logout** after inactivity (standard in all regulated medical software)
- **Audit log** (`/audit-log`, admin only) — tracks who accessed which patient record and when, with action type, timestamp, and export to CSV
- Footer badge: `v1.0 · HIPAA-aware demo`

---

## Architecture

### Why TanStack Router over React Router

TanStack Router gives us **full type-safety on route params and search params**, and first-class support for router context — which means auth guards (`beforeLoad`) receive a typed `context.auth` object without any wrapper boilerplate. For an enterprise SaaS with complex navigation and role-based routing, this is a better fit than React Router.

```
src/
├── routes/               ← File-based routing (TanStack Router)
│   ├── _app.tsx          ← Auth guard + app layout wrapper
│   ├── _app.dashboard.tsx
│   ├── _app.analytics.tsx
│   ├── _app.patients.tsx
│   ├── _app.patients.$patientId.tsx
│   ├── _app.notifications.tsx
│   ├── _app.audit-log.tsx
│   └── login.tsx
├── components/
│   ├── ui/               ← Reusable primitives (Button, Card, Badge…)
│   └── [feature]/        ← Feature-specific components
├── data/
│   └── patients.ts       ← Seeded deterministic patient generator
├── lib/
│   ├── auth-context.tsx  ← Firebase auth + role derivation
│   ├── global-store.ts   ← Zustand: PHI mask, sidebar state
│   └── patient-census.ts ← Census aggregation utilities
├── services/
│   ├── groq.ts           ← AI service (Groq API + fallback)
│   └── sw-register.ts    ← Service worker registration
└── hooks/
    ├── use-idle-session.ts ← Session timeout logic
    └── use-notifications.ts ← Notification store + triggers
```

### State Management — Zustand

| Store | Manages |
|---|---|
| `authStore` (via Context) | user, role, isAdmin, Firebase session |
| `globalStore` | phiMaskEnabled, sidebarCollapsed |
| `notificationStore` | notifications[], unreadCount |

Auth state lives in React Context (Firebase-native pattern). UI state lives in Zustand with localStorage persistence. Patient data is never persisted — always derived fresh from the seeded generator (PHI should not sit in storage).

### AI Architecture

```
User action (button click / page load)
        ↓
groq.ts → POST https://api.groq.com/openai/v1/chat/completions
        ↓
Llama 3 (8B) — low latency, free tier
        ↓
Structured clinical response rendered in UI

If VITE_GROQ_API_KEY is absent:
        ↓
Deterministic fallback — generates response from real patient data
(same output structure, rule-based logic, always works)
```

> **Security note:** In production, API calls would be proxied through a backend worker to protect credentials and log all AI interactions for compliance auditing. Direct browser calls are used here for demo purposes. `VITE_AI_PROXY_URL` can be set to route through any OpenAI-compatible proxy.

---

## Tech Stack

| Technology | Why |
|---|---|
| **React 18 + TypeScript** | Type-safe component development |
| **TanStack Router** | Type-safe routing with context-based auth guards |
| **Zustand** | Lightweight state — no Redux boilerplate, better TS inference |
| **Firebase Auth** | Google OAuth + email/password, battle-tested session management |
| **Groq API (Llama 3)** | Sub-second AI inference, free tier, no CORS issues |
| **Recharts** | Composable chart primitives, tree-shakeable |
| **Tailwind CSS** | Utility-first, consistent design tokens |
| **Vite** | Fast builds, instant HMR |

---

## Performance

| Metric | Value |
|---|---|
| Lighthouse Performance | 90+ |
| First Contentful Paint | < 1.5s |
| Route-level code splitting | React.lazy + Suspense on every route |
| Chart bundle | Recharts tree-shaken — only imported chart types bundled |
| Search | Debounced 320ms — no re-renders on every keystroke |
| Icons | Individually imported from lucide-react |
| Dates | Native `Intl.DateTimeFormat` — no date library imported |

---

## Local Setup

```bash
# 1. Clone
git clone https://github.com/sushmakoteswari/care-hub-ui
cd care-hub-ui

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in Firebase config + optional Groq key

# 4. Run
npm run dev
```

### Environment Variables

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=

# AI Features (optional — app works without these)
VITE_GROQ_API_KEY=          # Groq API key for live AI responses
VITE_AI_PROXY_URL=          # Optional proxy URL for Anthropic/OpenAI-compatible API
```

> The app is **fully functional without any AI keys**. All AI panels fall back to deterministic clinical summaries generated from live patient data.

---

## What I'd Do With More Time

- **Real backend** — Node.js/Express API + PostgreSQL replacing the seeded patient generator
- **Firestore** — Live patient data with row-level security rules scoped to assigned doctor
- **Natural language patient search** — *"Show me critical patients in cardiology over 60"* → Groq parses query → filters list. Service layer is already written, needs UI wiring
- **E2E tests** — Playwright for critical flows: login, role guard enforcement, patient access, session timeout
- **Unit tests** — Vitest for all store logic, census utilities, and AI fallback functions
- **Storybook** — Component documentation for the shared UI primitives
- **True micro-frontend deployment** — Each feature module (Dashboard, Patients, Analytics) as an independently deployed Vite bundle via Module Federation. Current architecture is feature-bounded and MFE-ready — adding Module Federation requires only `vite.config` changes
- **WebSocket alerts** — Replace polling with real-time patient status updates
- **WCAG 2.1 AA audit** — Full accessibility pass with screen reader testing

---

## Assessment Criteria Coverage

| Criterion | Implementation |
|---|---|
| ✅ Authentication | Firebase Auth — Google OAuth + email/password, session timeout, route guards |
| ✅ Login page | Two-panel layout, validation, error states, redirect, Google sign-in |
| ✅ Dashboard | KPI cards with deltas, alert feed, AI ward briefing, quick actions |
| ✅ Analytics | 7 connected charts telling an operational narrative (admin only) |
| ✅ Patient details | Grid + list view, toggle, PHI masking, risk score, AI explanation |
| ✅ Notifications | Service worker, push notifications, notification centre with unread state |
| ✅ State management | Zustand — auth, global UI, notifications — with persistence strategy |
| ✅ Micro-frontend ready | Feature-bounded architecture with strict module boundaries |
| ✅ Reusable components | Shared UI primitives used across all feature pages |
| ✅ Performance | Code splitting, debounced search, tree-shaken imports, Lighthouse 90+ |
| ✅ Clean folder structure | Feature-based, not type-based — scales to team development |

---

<div align="center">
  <sub>Built with care for the RagaAI Frontend Assessment · MedCare Health Inc. · 2026</sub>
</div>
