# Design Document: EthioTelecom Issue Tracker Enhancements

## Overview

This document describes the technical design for evolving the existing EthioTelecom Issue Tracker from a basic CRUD prototype into a production-quality internal tool. The existing application is built on Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, and Radix UI Themes.

The design covers twelve feature areas: branding, Google OAuth, image attachments, user profile pictures, an admin panel, issue enhancements, comments, activity logging, a dashboard, filter/sort/pagination, due-date indicators, and API security.

**Key runtime constraints from the Next.js 16 docs (verified in `node_modules/next/dist/docs/`):**
- `params` and `searchParams` in pages and route handlers are **Promises** and must be `await`ed.
- Route handler context signature: `(request, { params }: { params: Promise<{ id: string }> })`.
- Page props type helper: `PageProps<'/path/[param]'>` (globally available after `next build`/`next dev`).
- `auth()` from NextAuth v5 — not `getServerSession()`.
- Tailwind CSS v4: `@import "tailwindcss"` (not `@tailwind base/components/utilities`).

---

## Architecture

The application follows the Next.js 16 App Router full-stack model: server components fetch data directly from Prisma; API route handlers handle mutations; client components handle interactivity. There is no separate backend process.

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (Client)                         │
│  React 19 Client Components (forms, charts, comment input)   │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP / RSC
┌───────────────────────▼──────────────────────────────────────┐
│                   Next.js 16 App Router (Server)             │
│  ┌────────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │ Server Pages   │  │ API Routes    │  │  Middleware      │ │
│  │ (data fetch)   │  │ (mutations)   │  │  (auth guard)   │ │
│  └───────┬────────┘  └──────┬────────┘  └─────────────────┘ │
└──────────┼─────────────────┼────────────────────────────────┘
           │                 │
┌──────────▼─────────────────▼────────────────────────────────┐
│                  Service / Data Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Prisma 7   │  │ NextAuth v5 │  │  Cloudinary SDK      │ │
│  │ (PostgreSQL)│  │ (sessions)  │  │  (image upload)      │ │
│  └─────────────┘  └─────────────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User clicks "Sign In"
  → signIn("google") [NextAuth v5]
  → Google OAuth consent
  → callback → @auth/prisma-adapter creates/updates User, Account, Session
  → JWT/session cookie set
  → middleware.ts checks auth() on every protected request
  → auth() in server components and API routes for session data
```

---

## Components and Interfaces

### File / Folder Structure (new and modified files only)

```
issue-tracker/
├── auth.ts                              # NextAuth v5 config (Google provider + Prisma adapter)
├── middleware.ts                        # Route protection (redirect guests on protected routes)
├── prisma/
│   └── schema.prisma                   # Updated with all new models and fields
├── app/
│   ├── globals.css                     # Updated: --color-brand, body styles
│   ├── layout.tsx                      # Updated: Radix Theme accentColor="green", SessionProvider
│   ├── NavBar.tsx                      # Updated: ET logo, auth-aware Sign In/Out, avatar
│   ├── page.tsx                        # Dashboard (server component)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts           # NextAuth v5 handler (GET + POST)
│   │   ├── issues/
│   │   │   ├── route.ts               # Updated: auth guard, Zod v4, ActivityLog on create
│   │   │   └── [id]/
│   │   │       ├── route.ts           # Updated: auth guard, partial PATCH, cascade delete
│   │   │       └── comments/
│   │   │           └── route.ts       # POST comment, creates ActivityLog
│   │   ├── comments/
│   │   │   └── [commentId]/
│   │   │       └── route.ts           # DELETE comment, creates ActivityLog
│   │   ├── upload/
│   │   │   └── route.ts               # POST: Cloudinary upload endpoint (image + profile)
│   │   └── admin/
│   │       ├── users/
│   │       │   └── [id]/
│   │       │       └── route.ts       # PATCH: role change, activate/deactivate
│   │       └── issues/
│   │           └── route.ts           # PATCH: bulk status change
│   │
│   ├── issues/
│   │   ├── page.tsx                   # Updated: filter/sort/pagination, overdue badges
│   │   ├── new/
│   │   │   └── page.tsx               # Updated: department, dueDate, assignee, image upload
│   │   └── [id]/
│   │       ├── page.tsx               # Updated: images, comments, activity log, reporter/assignee
│   │       ├── edit/
│   │       │   ├── page.tsx           # Updated: auth check, new fields
│   │       │   └── EditIssueForm.tsx  # Updated: department, dueDate, assignee, image upload
│   │       └── DeleteButton.tsx       # Updated: AlertDialog, auth-aware
│   │
│   ├── admin/
│   │   ├── page.tsx                   # Admin panel (server component, ADMIN role check)
│   │   └── components/
│   │       ├── UserTable.tsx          # User management table (client)
│   │       ├── IssueTable.tsx         # Issue management table with bulk actions (client)
│   │       └── StatsOverview.tsx      # Stats cards (server-renderable)
│   │
│   ├── profile/
│   │   └── page.tsx                   # User profile page (upload custom avatar)
│   │
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx               # Custom sign-in page
│   │
│   └── components/
│       ├── Avatar.tsx                 # Reusable avatar: image or initials fallback
│       ├── PriorityBadge.tsx          # Color-coded priority badge
│       ├── StatusBadge.tsx            # Color-coded status badge
│       ├── OverdueBadge.tsx           # Red "Overdue" badge
│       ├── DueDateDisplay.tsx         # Date display with amber approaching logic
│       ├── CommentSection.tsx         # Comment list + form (client component)
│       ├── ActivityTimeline.tsx       # Activity log timeline (server component)
│       ├── ImageUpload.tsx            # Image upload input with validation (client)
│       ├── ImageThumbnails.tsx        # Thumbnail grid (client)
│       ├── IssueFilters.tsx           # Filter + sort controls (client)
│       ├── Pagination.tsx             # Pagination controls (client)
│       └── dashboard/
│           ├── SummaryCards.tsx       # Status/overdue summary cards
│           ├── StatusChart.tsx        # recharts bar chart by status (client)
│           ├── PriorityChart.tsx      # recharts bar chart by priority (client)
│           ├── DepartmentChart.tsx    # recharts bar chart by department (client)
│           └── RecentActivity.tsx     # Recent activity feed
│
└── validationSchemas.ts               # Updated: new Zod v4 schemas for all entities
```


### New Packages to Install

```bash
npm install next-auth@beta @auth/prisma-adapter cloudinary recharts
npm install @types/recharts --save-dev   # if needed
```

---

## Data Models

### Updated Prisma Schema

The full updated `prisma/schema.prisma` is shown below. New models and fields are annotated.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../app/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum Status {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Category {
  MOBILE_NETWORK
  FIBER_BROADBAND
  TELEBIRR_BILLING
  CORE_INFRASTRUCTURE
  OTHER
}

enum Role {         // NEW
  USER
  ADMIN
}

// ─── Auth Models (required by @auth/prisma-adapter) ──────────────────────────

model User {         // NEW
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]

  // Relations to application models
  reportedIssues  Issue[]       @relation("ReportedBy")
  assignedIssues  Issue[]       @relation("AssignedTo")
  comments        Comment[]
  activityLogs    ActivityLog[]
}

model Account {      // NEW - required by @auth/prisma-adapter
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {      // NEW - required by @auth/prisma-adapter
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {  // NEW - required by @auth/prisma-adapter
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Core Application Models ──────────────────────────────────────────────────

model Issue {
  id          String    @id @default(uuid())
  title       String    @db.VarChar(255)
  description String    @db.Text
  status      Status    @default(OPEN)
  priority    Priority  @default(MEDIUM)
  category    Category  @default(MOBILE_NETWORK)

  // NEW fields
  department  String?
  dueDate     DateTime?
  reporterId  String?
  assigneeId  String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // NEW relations
  reporter    User?         @relation("ReportedBy", fields: [reporterId], references: [id])
  assignee    User?         @relation("AssignedTo", fields: [assigneeId], references: [id])
  images      IssueImage[]
  comments    Comment[]
  activityLogs ActivityLog[]
}

model IssueImage {    // NEW
  id        String   @id @default(uuid())
  url       String
  issueId   String
  createdAt DateTime @default(now())

  issue Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
}

model Comment {       // NEW
  id        String   @id @default(uuid())
  content   String   @db.Text
  authorId  String
  issueId   String
  createdAt DateTime @default(now())

  author    User  @relation(fields: [authorId], references: [id], onDelete: Cascade)
  issue     Issue @relation(fields: [issueId], references: [id], onDelete: Cascade)
}

model ActivityLog {   // NEW
  id        String   @id @default(uuid())
  issueId   String
  actorId   String?
  action    String
  oldValue  String?
  newValue  String?
  createdAt DateTime @default(now())

  issue Issue  @relation(fields: [issueId], references: [id], onDelete: Cascade)
  actor User?  @relation(fields: [actorId], references: [id], onDelete: SetNull)
}
```

### Migration Strategy

1. Run `npx prisma migrate dev --name add_auth_and_enhancements` after updating the schema.
2. The migration adds the new tables and nullable/optional columns; the existing `Issue` table and its data are preserved.
3. For `reporterId` on existing issues: the column is nullable, so historical rows will have `NULL`, which is acceptable.
4. The `Role` enum default `USER` means no existing User rows need backfilling (the table is new).

---

## API Routes Design

All mutating routes follow this pattern:

```
1. Call auth() — return 401 if no session
2. Check role/ownership — return 403 if unauthorized
3. Parse + validate body with Zod v4 — return 400 on failure
4. Execute Prisma query (parameterized only)
5. Create ActivityLog entry if applicable
6. Return 200/201 response
```

### Route params signature (Next.js 16)

```ts
// Route handler — params is a Promise
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

### API Inventory

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET+POST | `/api/auth/[...nextauth]` | Public | NextAuth v5 handler |
| POST | `/api/issues` | Session required | Create issue + ISSUE_CREATED log |
| PATCH | `/api/issues/[id]` | Session required | Update issue fields + change logs |
| DELETE | `/api/issues/[id]` | Session (creator or ADMIN) | Delete issue + cascade images/comments/logs |
| POST | `/api/issues/[id]/comments` | Session required | Create comment + COMMENT_ADDED log |
| DELETE | `/api/comments/[commentId]` | Author or ADMIN | Delete comment + COMMENT_DELETED log |
| POST | `/api/upload` | Session required | Upload image to Cloudinary, return secure_url |
| PATCH | `/api/admin/users/[id]` | ADMIN only | Update role or isActive |
| PATCH | `/api/admin/issues` | ADMIN only | Bulk status change |


---

## Component Architecture

### NavBar (updated, client component)

```
NavBar (client)
├── Link href="/" → Image (Next.js) src="/tele horizontal.png" alt="EthioTelecom" h-8
├── Nav links: Dashboard, Issues, [Admin if role=ADMIN]
└── Auth section (uses useSession from next-auth/react):
    ├── [no session] → Button "Sign In" → signIn("google")
    └── [session] → Avatar (32x32) + name + Button "Sign Out" → signOut()
```

The NavBar imports `useSession` (client hook) for real-time session state. The root layout wraps children in NextAuth's `SessionProvider`.

### Avatar Component

```tsx
// app/components/Avatar.tsx
// Props: image?: string | null, name: string, size?: number
// - If image: render <Image> with circular clip
// - Else: render div with initials (first letter of each name word), bg-[#00A651]
```

### IssueFilters (client component)

```
IssueFilters
├── Select: status (All / OPEN / IN_PROGRESS / CLOSED)
├── Select: priority (All / CRITICAL / HIGH / MEDIUM / LOW)
├── Select: department (All / Network / IT / Customer Service / Finance / HR)
├── Select: assignee (All / <user list>)
├── Select: orderBy (createdAt / title / status / priority / dueDate)
├── Select: direction (asc / desc)
└── onChange → router.replace with updated URLSearchParams (no history entry)
```

### CommentSection (client component)

```
CommentSection (receives: issueId, initialComments, currentUserId, userRole)
├── Comment list (state, initially seeded from server-fetched initialComments)
│   └── For each comment:
│       ├── Avatar + author name + relative timestamp
│       ├── Comment content
│       └── [if author or ADMIN] Delete button
├── [if authenticated] Comment form
│   ├── Textarea
│   └── "Post Comment" button → POST /api/issues/[id]/comments
│       → on success: prepend to comment list, clear textarea
└── [if not authenticated] "Sign in to comment" prompt
```

### Dashboard Page (server component)

```
DashboardPage (server)
├── Fetch aggregated data server-side via Prisma
│   ├── Issue counts grouped by status
│   ├── Issue counts grouped by priority  
│   ├── Issue counts grouped by department
│   ├── Overdue count: count(status != CLOSED AND dueDate < now)
│   └── Recent 10 ActivityLog entries with actor + issue
├── SummaryCards (server) — counts passed as props
├── OverdueCard (server) — overdue count as prop
├── StatusChart (client, 'use client') — data prop from server
├── PriorityChart (client, 'use client') — data prop from server
├── DepartmentChart (client, 'use client') — data prop from server
└── RecentActivity (server) — entries as prop
```

The recharts components are client components (they use browser APIs). Data is serialized and passed as props from the server component — no client-side fetching.

### Admin Panel (server component + client sub-components)

```
AdminPage (server — checks auth(), role = ADMIN, else 403)
├── StatsOverview (server)
│   ├── Total by status (Prisma groupBy)
│   ├── Total by department (Prisma groupBy)
│   └── Avg resolution time for CLOSED issues
├── UserTable (client)
│   ├── Table: name, email, role, isActive, createdAt
│   ├── Role dropdown → PATCH /api/admin/users/[id] { role }
│   └── Activate/Deactivate button → PATCH /api/admin/users/[id] { isActive }
└── IssueTable (client)
    ├── Checkbox column
    ├── Table: title, status, priority, department, assignee, createdAt, actions
    ├── Bulk status select + "Apply" → PATCH /api/admin/issues { ids: [], status }
    └── Delete button → AlertDialog → DELETE /api/issues/[id]
```

### Activity Timeline (server component)

```
ActivityTimeline (server — receives: activityLogs with actor data)
└── Vertical timeline (descending order)
    └── For each entry:
        ├── Avatar (actor)
        ├── Actor name
        ├── Human-readable action label
        ├── oldValue → newValue (if applicable)
        └── Relative timestamp
```

Action label mapping:
```ts
const ACTION_LABELS: Record<string, string> = {
  ISSUE_CREATED:     "created this issue",
  STATUS_CHANGED:    "changed status",
  ASSIGNEE_CHANGED:  "changed assignee",
  PRIORITY_CHANGED:  "changed priority",
  COMMENT_ADDED:     "added a comment",
  COMMENT_DELETED:   "deleted a comment",
}
```

---

## Data Flow Diagrams

### Issue Creation Flow (with images and activity log)

```
User submits form
  │
  ├─ Client validates file: MIME type, size ≤ 5MB, count ≤ 5
  │
  ├─ POST /api/upload (for each image)
  │     ├─ auth() check → 401 if no session
  │     ├─ Cloudinary SDK v2 server-side upload
  │     └─ Return { secure_url }
  │
  └─ POST /api/issues
        ├─ auth() check → 401 if no session
        ├─ Zod v4 validate body → 400 on failure
        ├─ prisma.issue.create({ data: { ...fields, reporterId: session.user.id } })
        ├─ prisma.issueImage.createMany({ data: urls.map(url => ({ url, issueId })) })
        └─ prisma.activityLog.create({ action: "ISSUE_CREATED", actorId: session.user.id })
```

### Comment Flow

```
User submits comment
  │
  └─ POST /api/issues/[id]/comments
        ├─ auth() → 401 if no session
        ├─ Zod: content non-empty → 400 if empty
        ├─ prisma.comment.create({ content, authorId, issueId })
        ├─ prisma.activityLog.create({ action: "COMMENT_ADDED", newValue: content.slice(0,100) })
        └─ Return created comment (with author data)
             → client appends to comment list (no full reload)
```

### Status/Field Change Flow

```
PATCH /api/issues/[id] { status: "CLOSED" }
  │
  ├─ auth() → 401
  ├─ Zod patchIssueSchema → 400
  ├─ prisma.issue.findUnique to get oldValues
  ├─ prisma.issue.update
  └─ For each changed field:
      └─ prisma.activityLog.create({ action: "STATUS_CHANGED", oldValue, newValue })
```

---

## Req 1: Branding Implementation Details

- `app/globals.css`: add `--color-brand: #00A651;` inside `:root`. Body already has `background: #ffffff; color: #111827` applied.
- `app/layout.tsx`: wrap children with `<Theme accentColor="green">` from `@radix-ui/themes`.
- `app/NavBar.tsx`: replace the SVG bug icon with:
  ```tsx
  <Image src="/tele horizontal.png" alt="EthioTelecom" height={32} width={160} style={{ objectFit: 'contain', height: '32px', width: 'auto' }} />
  ```
- Active nav link indicator changes from `border-indigo-600` to `border-[#00A651]`.

---

## Req 2: NextAuth v5 Configuration

```ts
// auth.ts (root of project)
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      // Check isActive for returning users
      if (user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser && !dbUser.isActive) return false // blocks sign-in
      }
      return true
    },
    async session({ session, user }) {
      // Attach role and id to session
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
})
```

```ts
// middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PROTECTED_PATHS = ["/issues/new", "/issues/.*/edit", "/admin", "/profile"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PATHS.some(p => new RegExp(`^${p}$`).test(pathname))
  if (isProtected && !req.auth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
})

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] }
```

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

The `next-auth.d.ts` type augmentation adds `id` and `role` to the session's `user` object.


---

## Req 3 & 4: Image Uploads via Cloudinary

```ts
// app/api/upload/route.ts
import { v2 as cloudinary } from "cloudinary"
import { auth } from "@/auth"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!ALLOWED_TYPES.includes(file.type))
    return Response.json({ error: "Only JPG, PNG, GIF, and WebP images are allowed." }, { status: 400 })
  if (file.size > MAX_SIZE)
    return Response.json({ error: "File must be under 5 MB" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: "image" }, (err, res) => {
        if (err) reject(err); else resolve(res)
      }).end(buffer)
    }) as { secure_url: string }
    return Response.json({ url: result.secure_url })
  } catch {
    return Response.json({ error: "Image upload failed. Please try again." }, { status: 502 })
  }
}
```

Required environment variables:
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

The `ImageUpload` client component handles file selection, validates MIME/size client-side (for UX), posts to `/api/upload`, and stores the returned URLs. A running count prevents exceeding the 5-image limit before submission.

---

## Req 5: Admin Panel — Stats Calculation

Resolution time query:
```ts
// Get all CLOSED issues with createdAt and updatedAt
const closedIssues = await prisma.issue.findMany({
  where: { status: "CLOSED" },
  select: { createdAt: true, updatedAt: true },
})
const avgHours = closedIssues.length === 0
  ? 0
  : closedIssues.reduce((sum, i) => {
      return sum + (i.updatedAt.getTime() - i.createdAt.getTime()) / 3_600_000
    }, 0) / closedIssues.length
```

---

## Req 6: Issue Enhancements — Zod Schemas

```ts
// Updated validationSchemas.ts
import { z } from "zod"

export const issueSchema = z.object({
  title:       z.string().min(1, "Title is required.").max(255),
  description: z.string().min(1, "Description is required."),
  priority:    z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  category:    z.enum(["MOBILE_NETWORK","FIBER_BROADBAND","TELEBIRR_BILLING","CORE_INFRASTRUCTURE","OTHER"]).optional(),
  department:  z.string().optional(),
  dueDate:     z.string().datetime({ offset: true }).optional().nullable(),
  assigneeId:  z.string().cuid().optional().nullable(),
  imageUrls:   z.array(z.string().url()).max(5).optional(),
})

export const patchIssueSchema = issueSchema.partial()

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty."),
})

export const patchUserSchema = z.object({
  role:     z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
})

export const bulkStatusSchema = z.object({
  ids:    z.array(z.string()).min(1),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]),
})
```

---

## Req 10: Filter / Sort / Pagination

### Page component signature (Next.js 16 — searchParams is a Promise)

```tsx
// app/issues/page.tsx
export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const { status, priority, department, assignee, orderBy = "createdAt", direction = "desc", page = "1" } = params

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
  const PAGE_SIZE = 10

  const where: Prisma.IssueWhereInput = {
    ...(status     ? { status: status as Status }     : {}),
    ...(priority   ? { priority: priority as Priority } : {}),
    ...(department ? { department: department as string } : {}),
    ...(assignee   ? { assigneeId: assignee as string }  : {}),
  }

  // Validate assignee filter — if it matches no user, treat as no filter
  if (assignee) {
    const userExists = await prisma.user.findUnique({ where: { id: assignee as string }, select: { id: true } })
    if (!userExists) delete (where as any).assigneeId
  }

  const [total, issues] = await Promise.all([
    prisma.issue.count({ where }),
    prisma.issue.findMany({
      where,
      orderBy: { [orderBy as string]: direction },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignee: { select: { name: true } } },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(pageNum, totalPages)
  // ...render
}
```

---

## Req 11: Due Dates and Overdue Indicators

The overdue and approaching computations happen **server-side**. A utility function:

```ts
// app/lib/dueDateUtils.ts
export type DueDateStatus = "overdue" | "approaching" | "normal" | null

export function getDueDateStatus(dueDate: Date | null, status: string): DueDateStatus {
  if (!dueDate) return null
  if (status === "CLOSED") return null
  const now = new Date()
  const msUntilDue = dueDate.getTime() - now.getTime()
  if (msUntilDue < 0) return "overdue"
  if (msUntilDue <= 48 * 60 * 60 * 1000) return "approaching"
  return "normal"
}
```

Used in both the issues list page and issue detail page — called on the server during render. The result is passed as a prop or inline-computed during JSX rendering. No client-side date logic.

**Badge styling:**
- `overdue`: `bg-red-600 text-white ring-1 ring-red-600/20`
- `approaching`: `text-amber-600 font-semibold` (on the date display)
- `normal`: standard gray date text

---

## Req 12: API Security Pattern

All mutating route handlers follow this guard pattern:

```ts
import { auth } from "@/auth"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  // Admin check for admin routes:
  if (session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  // Ownership check for non-admin delete:
  const issue = await prisma.issue.findUnique({ where: { id } })
  if (issue?.reporterId !== session.user.id && session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  // Zod validation...
}
```

**Cloudinary secret handling:** API keys are in `.env` only, accessed server-side via `process.env`. Only the returned `secure_url` is stored in the database. The `.env` file is in `.gitignore`.


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**PBT Applicability Assessment:** This feature involves business logic functions (validation, authorization guards, aggregation, sort/filter, overdue computation, ActivityLog generation) that are pure or nearly-pure and have meaningful input variation. PBT is appropriate for these layers. UI rendering tests and infrastructure integration tests (Cloudinary, database adapter wiring) are excluded from PBT and handled by example tests and integration tests respectively.

After reviewing all acceptance criteria in the prework, the following properties were identified as unique and non-redundant after reflection:

- Properties 3.2/3.3 (MIME and size validation) are distinct and both valuable.
- Properties 8.3/8.4/8.5 (change logs) follow the same pattern and are consolidated into one property.
- Properties 5.6/5.7 (activate/deactivate) form a round-trip pair and are kept as a single round-trip property.
- Properties 9.1 and 9.6 (status counts and overdue count) are distinct aggregations and both kept.
- Properties 10.6 and 10.11/10.12 (pagination and filter defaults) are kept as distinct invariants.
- Properties 12.1/12.2/12.3 (auth guards) are consolidated into two properties: unauthenticated returns 401, unauthorized role returns 403.

---

### Property 1: New users always start with role USER

*For any* valid Google OAuth profile that has never authenticated before, the resulting `User` record created in the database SHALL have `role = USER`.

**Validates: Requirements 2.3**

---

### Property 2: Middleware redirects all unauthenticated requests to protected paths

*For any* HTTP request to a protected path (matching `/issues/new`, `/issues/*/edit`, `/admin`, `/profile`) that does not carry a valid NextAuth session, the middleware SHALL redirect the request to the sign-in page.

**Validates: Requirements 2.6**

---

### Property 3: Deactivated users cannot sign in (isActive round-trip)

*For any* user whose `isActive` field is `false`, the `signIn` callback SHALL return `false`, blocking the sign-in; and *for any* user whose `isActive` field is subsequently set to `true`, sign-in SHALL succeed. The activate/deactivate cycle is a round-trip: `activate(deactivate(user)).isActive === true`.

**Validates: Requirements 2.12, 5.6, 5.7**

---

### Property 4: Image MIME type validation rejects all non-allowed types

*For any* file whose MIME type is not one of `image/jpeg`, `image/png`, `image/gif`, `image/webp`, the upload validation SHALL reject it with the error message "Only JPG, PNG, GIF, and WebP images are allowed."

**Validates: Requirements 3.2, 3.4**

---

### Property 5: Image size validation rejects all files over 5 MB

*For any* file whose byte size exceeds 5,242,880 bytes, the upload validation SHALL reject it with the error message "File must be under 5 MB."

**Validates: Requirements 3.3**

---

### Property 6: Issue delete cascades to all associated IssueImages

*For any* issue that has one or more associated `IssueImage` records, deleting the issue SHALL result in all of its `IssueImage` records also being removed from the database (enforced by Prisma `onDelete: Cascade`).

**Validates: Requirements 3.10**

---

### Property 7: Maximum 5 images per issue is enforced

*For any* issue that already has 5 `IssueImage` records, attempting to add a 6th image SHALL be rejected by the API before writing to the database.

**Validates: Requirements 3.12**

---

### Property 8: Initials fallback for any user with null or empty image

*For any* user whose `image` field is `null` or an empty string, the `Avatar` component SHALL render a fallback element containing the user's initials (derived from `user.name`) against an ET_Brand_Green (`#00A651`) background, instead of an `<img>` element.

**Validates: Requirements 4.3**

---

### Property 9: ADMIN-only routes return 403 for any USER-role request

*For any* request to an `/api/admin/*` route from a user whose session `role` is `USER`, the route handler SHALL return HTTP 403 with body `{"error": "Forbidden"}`.

**Validates: Requirements 5.1, 12.3**

---

### Property 10: Bulk status change updates all selected issues

*For any* non-empty set of issue IDs and a target status, the bulk PATCH endpoint SHALL update every issue in the set to the target status and SHALL leave issues not in the set unchanged.

**Validates: Requirements 5.9**

---

### Property 11: Stats — average resolution time equals mean of (updatedAt - createdAt) for CLOSED issues

*For any* set of CLOSED issues, the computed average resolution time in hours SHALL equal the arithmetic mean of `(updatedAt.getTime() - createdAt.getTime()) / 3_600_000` for each issue in the set. For an empty set, the result SHALL be 0.

**Validates: Requirements 5.11, 5.12**

---

### Property 12: PATCH updates only the fields present in the request body

*For any* PATCH request body containing a subset of issue fields, only the fields present in the body SHALL be modified on the stored issue record; all other fields SHALL remain at their pre-patch values.

**Validates: Requirements 6.9**

---

### Property 13: Priority badges use the correct color class for every priority value

*For any* issue with priority `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`, the rendered priority badge SHALL apply exactly the color classes defined in the specification: CRITICAL → red, HIGH → orange, MEDIUM → yellow, LOW → blue.

**Validates: Requirements 6.13**

---

### Property 14: Issue detail page renders department, dueDate, and assignee for any issue that has them

*For any* issue where `department`, `dueDate`, or `assigneeId` is set, the rendered issue detail page SHALL display those values regardless of whether the viewer is authenticated.

**Validates: Requirements 6.14**

---

### Property 15: Any non-empty comment POST creates a Comment record

*For any* authenticated user and any non-empty comment content string, a POST to `/api/issues/[id]/comments` SHALL create a `Comment` record with the correct `authorId`, `issueId`, and `content`.

**Validates: Requirements 7.5**

---

### Property 16: Empty comment content is always rejected

*For any* string that is empty or consists entirely of whitespace, POSTing it as a comment SHALL return HTTP 400 with error "Comment cannot be empty" and SHALL NOT create a `Comment` record.

**Validates: Requirements 7.6**

---

### Property 17: Comments always render in ascending chronological order

*For any* list of `Comment` records on an issue, the rendered order SHALL be strictly ascending by `createdAt` (oldest first).

**Validates: Requirements 7.7**

---

### Property 18: Comment deletion removes record and creates ActivityLog entry

*For any* existing comment, a successful DELETE SHALL result in the comment no longer existing in the database, AND an `ActivityLog` entry with `action = "COMMENT_DELETED"` SHALL exist for the same `issueId`.

**Validates: Requirements 7.11, 7.12**

---

### Property 19: Every field change creates a correctly populated ActivityLog entry

*For any* issue update that changes `status`, `assigneeId`, or `priority`, the system SHALL create an `ActivityLog` entry with the correct `action` string, the previous value in `oldValue`, and the new value in `newValue`.

**Validates: Requirements 8.3, 8.4, 8.5**

---

### Property 20: COMMENT_ADDED log truncates content to 100 characters

*For any* newly created comment, an `ActivityLog` entry with `action = "COMMENT_ADDED"` SHALL be created, and its `newValue` SHALL be the comment content truncated to a maximum of 100 characters.

**Validates: Requirements 8.6**

---

### Property 21: ISSUE_CREATED log is created for every new issue

*For any* successfully created issue, exactly one `ActivityLog` entry with `action = "ISSUE_CREATED"` and the correct `issueId` and `actorId` SHALL exist.

**Validates: Requirements 8.8**

---

### Property 22: ActivityLog timeline renders in descending chronological order

*For any* list of `ActivityLog` entries for an issue, the rendered timeline SHALL be in descending `createdAt` order (most recent first).

**Validates: Requirements 8.11**

---

### Property 23: Dashboard status counts equal actual issue counts per status

*For any* distribution of issues across statuses, the count displayed on each summary card SHALL equal the actual count of `Issue` records with that `status` value in the database.

**Validates: Requirements 9.1**

---

### Property 24: Overdue count equals count of non-CLOSED issues with dueDate in the past

*For any* set of issues, the overdue count displayed on the Dashboard SHALL equal the number of issues where `dueDate < current UTC time` AND `status != CLOSED`.

**Validates: Requirements 9.6, 11.1**

---

### Property 25: Recent activity feed shows at most 10 most-recent entries

*For any* number of `ActivityLog` entries greater than 10, the Recent Activity feed SHALL display exactly 10 entries, and they SHALL be the 10 most recent by `createdAt`.

**Validates: Requirements 9.7**

---

### Property 26: Sorted issue list is always in the correct order for any sort field and direction

*For any* sort field (title, status, priority, createdAt, dueDate) and direction (asc, desc), the returned issues list SHALL be ordered according to the specified field in the specified direction.

**Validates: Requirements 10.2, 10.3**

---

### Property 27: Pagination never returns more than 10 issues per page

*For any* page number and filter combination, the issues list page SHALL return at most 10 issues.

**Validates: Requirements 10.6**

---

### Property 28: Default filter values do not restrict the Prisma query

*For any* filter whose value is absent or equal to the "All" default, the generated Prisma `where` clause SHALL NOT include that filter field, and the result set SHALL be identical to an unfiltered query.

**Validates: Requirements 10.11**

---

### Property 29: Invalid assignee filter is treated as no filter

*For any* `assignee` query parameter value that does not correspond to any existing `User.id`, the issues list SHALL return the same results as if no assignee filter were applied.

**Validates: Requirements 10.12**

---

### Property 30: Overdue badge appears for any non-CLOSED issue with a past dueDate, and never for CLOSED issues

*For any* issue where `dueDate < current UTC time` AND `status != CLOSED`, an "Overdue" badge SHALL be rendered. *For any* issue where `status = CLOSED`, no "Overdue" badge SHALL be rendered, regardless of `dueDate`.

**Validates: Requirements 11.1, 11.7, 11.8**

---

### Property 31: Approaching due date uses amber styling for any issue within 48 hours of due

*For any* issue where `0 < (dueDate - now) <= 48 hours` AND `status != CLOSED`, the due date display SHALL use amber/orange styling.

**Validates: Requirements 11.6**

---

### Property 32: Any mutating request without a valid session returns 401

*For any* POST, PATCH, or DELETE request to any API route that does not carry a valid NextAuth session, the handler SHALL return HTTP 401 with body `{"error": "Unauthorized"}`.

**Validates: Requirements 12.1**

---

### Property 33: Any invalid Zod request body returns 400 with error.format()

*For any* POST or PATCH request body that fails the applicable Zod v4 schema, the handler SHALL return HTTP 400 with the Zod `error.format()` object as the response body.

**Validates: Requirements 12.4, 12.5**


---

## Error Handling

### API Route Errors

| Scenario | HTTP Status | Response Body |
|----------|-------------|---------------|
| No session on mutating route | 401 | `{"error": "Unauthorized"}` |
| Wrong role or not owner | 403 | `{"error": "Forbidden"}` |
| Resource not found | 404 | `{"error": "Not found"}` |
| Zod validation failure | 400 | `validation.error.format()` |
| Cloudinary upload failure | 502 | `{"error": "Image upload failed. Please try again."}` |
| Invalid MIME type | 400 | `{"error": "Only JPG, PNG, GIF, and WebP images are allowed."}` |
| File too large | 400 | `{"error": "File must be under 5 MB"}` |
| Exceeds 5 image limit | 400 | `{"error": "Maximum 5 images per issue"}` |
| Prisma / DB error | 500 | `{"error": "Internal Server Error"}` |

### Client-Side Errors

- Form validation errors are shown inline next to the relevant field using Radix UI `Text` with `color="red"`.
- API error responses are surfaced via a toast / `Callout` component from Radix UI Themes.
- Image upload failures show inline error messages without blocking the rest of the form.
- If the NavBar avatar image fails to load, the `onError` handler swaps in the initials fallback.

### Deactivated User Handling

When `signIn` returns `false` (because `isActive = false`), NextAuth redirects to `/auth/signin?error=AccessDenied`. The custom sign-in page detects `error=AccessDenied` and renders "Your account has been deactivated. Please contact an administrator."

### Cascade Deletions

All cascade behaviors are enforced at the Prisma/database level (`onDelete: Cascade`):
- Deleting an `Issue` removes its `IssueImage`, `Comment`, and `ActivityLog` records.
- Deleting a `User` removes their `Account` and `Session` records.
- Setting `actorId` to `SetNull` on `ActivityLog` when a user is deleted preserves the audit trail.

---

## Testing Strategy

### Dual Testing Approach

Both unit/example tests and property-based tests are used. Unit tests cover specific UI states, integration points, and error conditions. Property tests verify universal invariants across many randomly generated inputs.

### Property-Based Testing

**Library:** `fast-check` (TypeScript-native, works with Jest/Vitest, no extra dependencies needed beyond `npm install --save-dev fast-check`).

**Configuration:** Each property test runs minimum **100 iterations** (fast-check default is 100; set explicitly with `{ numRuns: 100 }`).

**Tag format:** Each property test file includes a comment:
```
// Feature: ethiotelecom-issue-tracker, Property N: <property_text>
```

**What to test with PBT:**

| Property | Module | fast-check arbitraries |
|----------|--------|------------------------|
| P1: New users → role USER | `auth.ts` signIn callback | `fc.record({ email: fc.emailAddress(), name: fc.string() })` |
| P4: MIME validation | upload validation util | `fc.string()` (non-allowed MIME strings) |
| P5: Size validation | upload validation util | `fc.integer({ min: 5242881, max: 100_000_000 })` |
| P11: Avg resolution time | stats util function | `fc.array(fc.record({ createdAt: fc.date(), updatedAt: fc.date() }))` |
| P12: PATCH partial update | `patchIssueSchema` + update logic | `fc.subarray(issueFields)` |
| P13: Priority badge colors | `PriorityBadge` component | `fc.constantFrom("CRITICAL","HIGH","MEDIUM","LOW")` |
| P16: Empty comment rejection | `commentSchema` | `fc.stringMatching(/^\s*$/)` |
| P17: Comment sort order | sort utility | `fc.array(fc.record({ createdAt: fc.date(), ... }))` |
| P19: ActivityLog on field change | issue update handler | `fc.constantFrom("OPEN","IN_PROGRESS","CLOSED")` |
| P20: Comment log truncation | activityLog util | `fc.string({ minLength: 0, maxLength: 300 })` |
| P22: ActivityLog timeline sort | sort utility | `fc.array(fc.record({ createdAt: fc.date(), ... }))` |
| P23: Dashboard status counts | aggregation util | `fc.array(fc.constantFrom("OPEN","IN_PROGRESS","CLOSED"))` |
| P24: Overdue count | `getDueDateStatus` util | `fc.record({ dueDate: fc.date(), status: fc.constantFrom(...) })` |
| P26: Sort correctness | Prisma orderBy construction | `fc.constantFrom("title","status","priority","createdAt","dueDate")` + `fc.constantFrom("asc","desc")` |
| P27: Pagination ≤ 10 | pagination slice logic | `fc.integer({ min: 0, max: 1000 })` for total count |
| P28: Default filter omission | `buildWhereClause` util | `fc.record({ status: fc.option(fc.constantFrom(...)) })` |
| P30: Overdue badge logic | `getDueDateStatus` util | `fc.record({ dueDate: fc.option(fc.date()), status: fc.constantFrom(...) })` |
| P31: Approaching styling | `getDueDateStatus` util | `fc.date({ min: new Date(), max: new Date(Date.now() + 48*3600_000) })` |
| P32: Auth guard 401 | route handler test with mock | `fc.record({ method: fc.constantFrom("POST","PATCH","DELETE") })` |
| P33: Zod 400 on invalid body | `issueSchema.safeParse` | `fc.anything()` (arbitrary invalid shapes) |

**Example of a property test:**

```ts
// __tests__/dueDateUtils.test.ts
// Feature: ethiotelecom-issue-tracker, Property 30: Overdue badge for non-CLOSED past dueDate
import fc from "fast-check"
import { getDueDateStatus } from "@/app/lib/dueDateUtils"

test("overdue badge never appears for CLOSED issues", () => {
  fc.assert(
    fc.property(
      fc.date(),
      (dueDate) => {
        const result = getDueDateStatus(dueDate, "CLOSED")
        return result !== "overdue"
      }
    ),
    { numRuns: 100 }
  )
})

test("past dueDate on non-CLOSED issue is always overdue", () => {
  fc.assert(
    fc.property(
      fc.date({ max: new Date(Date.now() - 1) }),
      fc.constantFrom("OPEN", "IN_PROGRESS"),
      (dueDate, status) => {
        return getDueDateStatus(dueDate, status) === "overdue"
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit / Example Tests

- **NavBar branding:** Render NavBar with mock session, assert `<img alt="EthioTelecom">` exists with correct dimensions.
- **Avatar initials fallback:** Render `<Avatar name="Abebe Kebede" image={null} />`, assert initials "AK" are shown.
- **Comment form visibility:** Render issue detail with null session → assert "Sign in to comment" present; with session → assert textarea present.
- **Admin access control:** Mock session with `role=USER` → GET `/admin` page → assert 403 or redirect.
- **Overdue badge on issues list:** Render issue row with past dueDate and status=OPEN → assert "Overdue" badge class `bg-red-600` exists.
- **AlertDialog on delete:** Click delete button → assert AlertDialog is shown before DELETE is called.
- **Pagination controls:** Given 25 items and page=1 → assert "Previous" is disabled, "Next" is enabled, total pages = 3.
- **Empty-state dashboard:** No issues in DB → assert all summary cards show 0.

### Integration Tests

- **Cloudinary upload:** With valid file → mock `cloudinary.uploader.upload_stream` → assert `secure_url` is stored.
- **NextAuth session flow:** End-to-end test with a mock Google provider in a test environment.
- **Admin role change:** PATCH `/api/admin/users/[id]` with ADMIN session → assert DB record updated.
- **ActivityLog on status change:** PATCH `/api/issues/[id]` changing status → assert ActivityLog record exists in DB.

### Test File Locations

```
__tests__/
├── unit/
│   ├── dueDateUtils.test.ts      # PBT for getDueDateStatus (P30, P31, P24)
│   ├── validationSchemas.test.ts # PBT for Zod schemas (P4, P5, P16, P33)
│   ├── activityLog.test.ts       # PBT for log generation (P19, P20, P21)
│   ├── pagination.test.ts        # PBT for pagination logic (P27, P28, P29)
│   ├── sortFilter.test.ts        # PBT for sort/filter (P17, P22, P26)
│   ├── stats.test.ts             # PBT for resolution time (P11)
│   ├── priorityBadge.test.ts     # PBT for badge colors (P13)
│   └── avatarFallback.test.tsx   # Unit: initials fallback (P8)
└── integration/
    ├── auth.test.ts              # Auth guard 401/403 (P32, P9)
    ├── comments.test.ts          # Comment CRUD (P15, P16, P18)
    ├── issues.test.ts            # Issue CRUD, cascade, bulk (P6, P7, P10, P12)
    └── dashboard.test.ts         # Aggregation counts (P23, P24, P25)
```

