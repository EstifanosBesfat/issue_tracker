# Ethio Telecom Issue Tracker

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack issue tracking system built for **Ethio Telecom** to manage network infrastructure incidents and service requests — from a customer's first bug report to a technician closing the ticket. Built with Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL, TanStack Query/Table, and shadcn/ui.

> 🎓 This README doubles as a presentation script. Each feature section below explains **what it does, why it matters, and which files implement it**, so you can walk an instructor through the codebase live.

---

## 🌟 What Makes This Project Stand Out

| Capability | Why it's impressive |
|---|---|
| ⚖️ **Technician workload balancing** | When creating a ticket, the system live-queries open-ticket counts per technician and recommends whoever has the lightest load in that issue's category |
| ⚡ **Real-time notifications (SSE)** | Notifications push instantly over Server-Sent Events instead of polling every 30s, with automatic fallback to polling if the stream drops |
| 🗂️ **Division-based routing** | Issues are raised against an admin-managed **Division** (project/department) so tickets are organized and filterable by the team that owns them |
| 💬 **@mentions with notifications** | Type `@name` in a comment to autocomplete active users and notify them instantly |
| 🔐 **Self-service password reset** | Token-based reset flow (hashed, expiring, rate-limited) with email delivery via Resend |
| 🔒 **Fully authenticated API surface** | Every data-bearing route requires a session; nothing leaks to anonymous requests |
| 🧠 **Modern data layer** | TanStack Query for server-state caching/invalidation + TanStack Table for sortable, paginated, server-driven tables |

---

## ✨ Features

### User Features
- 🔐 Register and sign in with email & password (credentials-based auth)
- 🔑 Self-service "Forgot Password" with secure, expiring reset links
- 📝 Create, edit, and delete your own issues
- 🗂️ Raise issues against a **Division** (project/department) and filter by it
- 🔍 Search issues by title keyword, with sortable/paginated data table
- 🗂️ Filter by status, priority, and division
- 💬 Comment on issues, with **@mention autocomplete**
- 📅 View issue details, activity timeline, and due date alerts
- 📤 Export filtered issues to CSV for reporting
- 🔔 Instant, real-time notification bell (no refresh needed)

### Admin Features
- All user features, plus:
- ✅ Change issue statuses (OPEN → IN_PROGRESS → CLOSED)
- 👤 Assign issues to staff members — with a **workload-balancing suggestion**
- 👥 Manage users (change roles, activate/deactivate)
- 🗂️ Manage Divisions (create, rename, activate/deactivate)
- 📊 View system statistics, resolution-time analytics, and division breakdowns

### Notifications (Real-Time)
- ⚡ Live delivery over Server-Sent Events (SSE) — no polling delay
- 🔁 Automatic fallback to 60s polling if the live connection drops, with a "Live / Polling" indicator in the bell dropdown
- Notified when an issue is assigned to you
- Notified when the status of your reported issue changes
- Notified when someone `@mentions` you or comments on your issue

### Permissions
| Action | Anyone | Authenticated User | Admin |
|---|---|---|---|
| View issues | ❌ (auth required) | ✅ | ✅ |
| Create issue | ❌ | ✅ | ✅ |
| Edit/delete own issue | ❌ | ✅ | ✅ |
| Edit/delete any issue | ❌ | ❌ | ✅ |
| Change issue status | ❌ | ❌ | ✅ |
| Assign issues | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View analytics / export CSV | ❌ | ✅ | ✅ |

---

## ⚖️ Technician Workload Balancing (Deep Dive)

Instead of assigning tickets by gut feeling, `GET /api/technicians/workload?category=<CATEGORY>` runs two `groupBy` queries against `Issue` (`OPEN` + `IN_PROGRESS` tickets, grouped by `assigneeId`) — one for total load, one scoped to the ticket's category — and returns technicians sorted by **least loaded in that category first, then least loaded overall**.

The New Issue form calls this endpoint automatically whenever the selected category changes, and shows a live suggestion card:

> 💡 **Selam T.** has the lightest load in Fiber Broadband — 1 open in this category (3 total). → *Assign to Selam T.*

One click applies the suggestion to the assignee dropdown. This keeps ticket distribution fair without any manual spreadsheet tracking.

**Key files:**
- `app/api/technicians/workload/route.ts`
- `app/issues/new/NewIssueForm.tsx`

---

## ⚡ Real-Time Notifications over SSE (Deep Dive)

The original implementation polled `/api/notifications` every 30 seconds. That's wasted requests and up to 30s of lag. The new implementation uses **Server-Sent Events**:

1. `NotificationBell` opens a persistent `EventSource` connection to `GET /api/notifications/stream`.
2. The server authenticates the session, then keeps the HTTP response stream open (`ReadableStream` + `text/event-stream`), registering the connection in an in-memory pub/sub bus (`lib/notificationBus.ts`) keyed by `userId`.
3. Anywhere the app creates a notification — comment `@mentions`, issue assignment, status changes — it now goes through one shared helper, `createNotifications()` (`lib/notifications.ts`), which writes to Postgres **and** immediately pushes the new notification down every open SSE connection for that user via `publishToUser()`.
4. The bell UI updates instantly, no refresh needed, and shows a small **Live** / **Polling** indicator so you can visibly demonstrate the fallback: if the stream disconnects (e.g. behind a proxy that buffers responses), the client automatically falls back to 60s polling and keeps retrying the live connection every 5s.

> 📌 **Scaling note (great talking point):** this pub/sub is in-process, so it works perfectly for a single server instance (exactly how this app is deployed on Railway). Horizontally scaling to multiple instances would mean swapping the in-memory `Map` in `notificationBus.ts` for a shared broker like Redis Pub/Sub — the rest of the architecture (the SSE endpoint, the client `EventSource`) stays the same.

**Key files:**
- `lib/notificationBus.ts` — in-memory pub/sub
- `app/api/notifications/stream/route.ts` — SSE endpoint
- `lib/notifications.ts` — shared creation + publish helper
- `app/components/NotificationBell.tsx` — `EventSource` client with polling fallback

---

## 🧠 How the Data Layer Works (For Your Presentation)

### TanStack Query (React Query)
Used for all **client-side server-state** — the issues list, mutations, and cache invalidation.
- `app/issues/IssuesDataTable.tsx` uses `useQuery` to fetch `/api/issues` with the current filters/sort/page as the query key, so switching pages or filters automatically triggers a re-fetch and caches each combination.
- `app/issues/new/NewIssueForm.tsx` calls `queryClient.invalidateQueries({ queryKey: ['issues'] })` after creating an issue, so the issues list is guaranteed fresh the moment you navigate back — no manual refetching logic anywhere.
- `Providers` (in `app/layout.tsx`) wraps the whole app in a single `QueryClient`, so every component shares one cache.

### TanStack Table
Used for the main issues grid.
- `createColumnHelper<Issue>()` defines typed columns (title, status, priority, assignee, due date).
- `useReactTable({ data, columns, getCoreRowModel, manualSorting: true, manualPagination: true })` — sorting and pagination are **server-driven**: clicking a column header updates the query params, which changes the TanStack Query key, which triggers a new fetch with the right `orderBy`/`page` from Prisma. This scales correctly even with tens of thousands of rows, unlike client-side table sorting.
- `flexRender` renders each cell so custom components (badges, avatars) can live inside table cells without extra glue code.

### shadcn/ui
Every interactive primitive — `Table`, `Badge`, `Button`, `Input`, `Sidebar`, `Command` (the ⌘K command palette) — comes from shadcn/ui, copied directly into `components/ui/` rather than pulled from a black-box npm package. That means the components are fully owned, Tailwind-v4 styled, and easy to customize (e.g. the Ethio Telecom brand colors) without fighting a third-party design system.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Authentication | NextAuth.js v5 (Credentials) |
| Server State | TanStack Query 5 |
| Data Grid | TanStack Table 8 |
| UI Components | shadcn/ui + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Real-time | Server-Sent Events (native `ReadableStream`) |
| Image Uploads | Cloudinary |
| Charts | Recharts |
| Email | Resend |
| Password Hashing | bcryptjs |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted, e.g. Railway)
- Cloudinary account (for image uploads)
- Resend API key (for password reset emails) — optional in development

### Installation

**1. Clone the repository**
```bash
git clone <repo-url>
cd issue-tracker
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/issue-tracker?schema=public"

# NextAuth
AUTH_SECRET="your-secret-key-here"   # generate with: openssl rand -base64 32

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend (for password reset emails — optional locally, links log to console instead)
RESEND_API_KEY="re_xxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"
APP_URL="http://localhost:3000"
```

**4. Run database migrations**
```bash
npx prisma migrate dev
```

**5. (Optional) Seed the database with demo data**
```bash
npx tsx prisma/seed.ts
```

**6. Promote a user to admin**

After registering an account, run:
```bash
# List all users
npx tsx prisma/make-admin.ts

# Promote a specific user
npx tsx prisma/make-admin.ts your@email.com
```

**7. Start the development server**
```bash
npm run dev
```

**8. Open [http://localhost:3000](http://localhost:3000)**

---

## 📁 Project Structure

```
.
├── app/
│   ├── admin/                       # Admin dashboard
│   │   └── components/
│   │       ├── StatsOverview.tsx    # Status/division/resolution stats
│   │       ├── DivisionTable.tsx    # Division CRUD (create/rename/activate)
│   │       ├── UserTable.tsx
│   │       └── IssueTable.tsx
│   ├── api/
│   │   ├── technicians/workload/    # GET  — workload-balancing recommendation
│   │   ├── notifications/
│   │   │   ├── route.ts             # GET, PATCH — list / mark read
│   │   │   └── stream/              # GET  — SSE real-time channel
│   │   ├── auth/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── users/search/            # GET  — @mention autocomplete
│   │   ├── admin/divisions/         # GET, POST, PATCH — Division management
│   │   ├── issues/
│   │   │   ├── [id]/                # PATCH, DELETE, comments/
│   │   │   └── export/              # GET  — CSV export
│   │   └── analytics/               # GET  — dashboard chart data
│   ├── auth/
│   │   ├── signin/, register/
│   │   ├── forgot-password/, reset-password/
│   ├── components/                  # Shared reusable components
│   │   ├── NotificationBell.tsx     # SSE-powered live notifications
│   │   ├── AppShell.tsx             # Conditional sidebar layout
│   │   ├── CommentSection.tsx       # Comments + @mention autocomplete
│   │   └── ActivityTimeline.tsx
│   ├── issues/
│   │   ├── IssuesDataTable.tsx      # TanStack Table + TanStack Query grid
│   │   └── new/NewIssueForm.tsx     # Division select + workload suggestion
│   ├── lib/                         # issuesQuery, dueDateUtils, etc.
│   ├── layout.tsx                   # Root layout (providers)
│   └── page.tsx                     # Dashboard (home page)
├── lib/
│   ├── notificationBus.ts           # In-memory SSE pub/sub
│   ├── notifications.ts             # Shared create + publish helper
│   ├── mentions.ts                  # @mention parsing/resolution
│   ├── email.ts                     # Resend integration
│   └── passwordReset.ts             # Token generation/validation
├── components/
│   └── ui/                          # shadcn/ui components
├── prisma/
│   ├── migrations/                  # Database migration history
│   ├── schema.prisma                # Prisma schema (incl. Division model)
│   ├── client.ts                    # Prisma client singleton
│   ├── seed.ts                      # Demo data seed script
│   └── make-admin.ts                # Admin promotion utility
├── public/                          # Static assets
├── types/                           # TypeScript type augmentations
├── auth.ts                          # NextAuth config
├── auth.config.ts                   # Edge-safe auth config (for proxy.ts)
├── proxy.ts                         # Route protection (Next 16 renamed "middleware" → "proxy")
└── package.json
```

---

## 📜 Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Generate Prisma client + build for production
npm start             # Start production server
npm run lint          # Run ESLint
npm test              # Run Jest tests
npx tsc --noEmit      # Type-check without building
npx prisma studio     # Open Prisma visual database browser
npx prisma migrate dev # Run pending migrations
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** — never stored in plain text
- Sessions use **JWT tokens** stored in secure HTTP-only cookies
- Route protection is enforced at the Edge (`proxy.ts` — Next.js 16 renamed `middleware.ts` to `proxy.ts`) **and** re-checked in every API route (`auth()`)
- Every data-bearing API route (`/api/issues`, `/api/analytics`, `/api/issues/export`, `/api/notifications`, `/api/technicians/workload`, `/api/users/search`) requires an authenticated session — nothing is exposed to anonymous requests
- Admin-only endpoints verify both authentication and the `ADMIN` role
- Password reset tokens are single-use, hashed at rest, time-limited, and rate-limited per email

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

MIT
