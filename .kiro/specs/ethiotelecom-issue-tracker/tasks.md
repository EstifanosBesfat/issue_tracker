# Tasks

## Phase 1: Foundation

- [x] 1. Install new dependencies
  - Run `npm install next-auth@beta @auth/prisma-adapter cloudinary recharts`
  - Run `npm install --save-dev fast-check @types/fast-check`
  - Verify all packages appear in package.json
  - **Requirements:** 2, 3, 4, 9

- [x] 2. Update Prisma schema with all new models and fields
  - Add `Role` enum (`USER`, `ADMIN`)
  - Add `User` model with id, name, email, image, role, isActive, createdAt, updatedAt
  - Add `Account`, `Session`, `VerificationToken` models (required by @auth/prisma-adapter)
  - Add `IssueImage` model with id, url, issueId, createdAt and `onDelete: Cascade`
  - Add `Comment` model with id, content, authorId, issueId, createdAt and cascade relations
  - Add `ActivityLog` model with id, issueId, actorId (nullable), action, oldValue, newValue, createdAt
  - Add new Issue fields: department (String?), dueDate (DateTime?), reporterId (String?), assigneeId (String?)
  - Add Issue relations: reporter (@relation("ReportedBy")), assignee (@relation("AssignedTo")), images, comments, activityLogs
  - Change Issue `id` from `Int @id @default(autoincrement())` to `String @id @default(uuid())`
  - **Depends on:** Task 1
  - **Requirements:** 2, 3, 6, 7, 8

- [x] 3. Run Prisma migration
  - Run `npx prisma migrate dev --name add_auth_images_comments_activity`
  - Verify migration SQL is generated and applied successfully
  - Run `npx prisma generate` to regenerate the Prisma client
  - **Depends on:** Task 2
  - **Requirements:** 2, 3, 6, 7, 8

- [x] 4. Update validation schemas (validationSchemas.ts)
  - Update `createIssueSchema` to add optional fields: priority, category, department, dueDate, assigneeId, imageUrls (array max 5)
  - Create `patchIssueSchema` as `issueSchema.partial()`
  - Create `commentSchema` with non-empty content (min 1 char)
  - Create `patchUserSchema` with optional role and isActive fields
  - Create `bulkStatusSchema` with ids array (min 1) and status enum
  - **Depends on:** Task 1
  - **Requirements:** 6, 7, 12

## Phase 2: Authentication & Branding

- [x] 5. Create auth.ts (NextAuth v5 configuration)
  - Configure NextAuth with Google OAuth provider
  - Wire up PrismaAdapter from @auth/prisma-adapter
  - Add `signIn` callback that checks `user.isActive` — return false if deactivated
  - Add `session` callback that attaches `user.id` and `user.role` to the session object
  - Set custom pages: `signIn: "/auth/signin"`, `error: "/auth/signin"`
  - Export `{ handlers, auth, signIn, signOut }`
  - Create `types/next-auth.d.ts` to augment session User type with `id` and `role`
  - **Depends on:** Task 3
  - **Requirements:** 2

- [x] 6. Create middleware.ts (route protection)
  - Import `auth` from `@/auth`
  - Define protected path patterns: `/issues/new`, `/issues/.*/edit`, `/admin`, `/profile`
  - Redirect unauthenticated requests to `/auth/signin`
  - Configure `matcher` to exclude static files and API routes
  - **Depends on:** Task 5
  - **Requirements:** 2

- [x] 7. Create NextAuth API route handler
  - Create `app/api/auth/[...nextauth]/route.ts`
  - Import `handlers` from `@/auth` and export `{ GET, POST } = handlers`
  - **Depends on:** Task 5
  - **Requirements:** 2

- [x] 8. Create custom sign-in page
  - Create `app/auth/signin/page.tsx`
  - Display EthioTelecom logo and "Sign in with Google" button using Radix UI
  - Handle `?error=AccessDenied` query param — show "Your account has been deactivated" message
  - Handle `?error=` other values — show generic error message
  - Redirect authenticated users to dashboard
  - **Depends on:** Task 5
  - **Requirements:** 2

- [x] 9. Apply EthioTelecom branding to globals.css and layout.tsx
  - Update `app/globals.css`: add `--color-brand: #00A651` CSS variable in `:root`, ensure body has `background: #ffffff; color: #111827`
  - Update `app/layout.tsx`: set `<Theme accentColor="green">` on Radix UI Theme component
  - Wrap children with `SessionProvider` from `next-auth/react` in layout
  - **Depends on:** Task 5
  - **Requirements:** 1, 2

- [x] 10. Update NavBar with EthioTelecom logo and auth-aware UI
  - Replace the FaBug icon with `<Image src="/tele horizontal.png" alt="EthioTelecom" height={32} width={160} style={{ objectFit: 'contain', height: '32px', width: 'auto' }} />`
  - Make NavBar a client component using `useSession` from `next-auth/react`
  - Show "Sign In" button (calls `signIn("google")`) when no session
  - Show circular avatar (32×32), user name, and "Sign Out" button when session exists
  - Add "Admin" nav link visible only when `session.user.role === "ADMIN"`
  - Update active link indicator color to `text-[#00A651]` / `border-[#00A651]`
  - **Depends on:** Task 9
  - **Requirements:** 1, 2

## Phase 3: Shared Components & Upload API

- [x] 11. Create Avatar component
  - Create `app/components/Avatar.tsx`
  - Props: `image?: string | null`, `name: string`, `size?: number` (default 32)
  - If image is provided: render circular `<Image>` with `rounded-full` clip
  - If image is null/empty: render div with user's initials (first letter of each word in name), `bg-[#00A651]` background, white text
  - Export from `app/components/index.ts`
  - **Depends on:** Task 9
  - **Requirements:** 4

- [x] 12. Create PriorityBadge component
  - Create `app/components/PriorityBadge.tsx`
  - Props: `priority: Priority`
  - Color mapping: CRITICAL → red, HIGH → orange, MEDIUM → yellow, LOW → blue (Radix Badge colors)
  - Export from `app/components/index.ts`
  - **Depends on:** Task 3
  - **Requirements:** 6

- [x] 13. Create OverdueBadge and DueDateDisplay components
  - Create `app/lib/dueDateUtils.ts` with `getDueDateStatus(dueDate, status)` returning `"overdue" | "approaching" | "normal" | null`
  - Create `app/components/OverdueBadge.tsx` — renders red badge with white text
  - Create `app/components/DueDateDisplay.tsx` — formats date as "Jul 15, 2026"; applies amber styling when approaching (within 48h); hides overdue/approaching when status is CLOSED
  - Export both from `app/components/index.ts`
  - **Depends on:** Task 3
  - **Requirements:** 11

- [x] 14. Create Cloudinary upload API route
  - Create `app/api/upload/route.ts`
  - Call `auth()` — return 401 if no session
  - Parse `FormData`, extract `file` field
  - Validate MIME type (jpeg/png/gif/webp) — return 400 with specific error message on failure
  - Validate file size ≤ 5MB — return 400 with specific error message on failure
  - Upload to Cloudinary using `cloudinary.uploader.upload_stream` with buffer
  - Return `{ url: result.secure_url }` on success
  - Return 502 with `{ error: "Image upload failed. Please try again." }` if Cloudinary throws
  - Configure Cloudinary from env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - **Depends on:** Task 5
  - **Requirements:** 3, 4

- [x] 15. Create ImageUpload and ImageThumbnails client components
  - Create `app/components/ImageUpload.tsx` (client component)
    - File input accepting `image/*` only
    - Client-side MIME and size validation before upload
    - POST each file to `/api/upload`, collect returned URLs
    - Show preview thumbnails of selected images
    - Enforce max 5 images (disable input when limit reached)
    - Show per-file error messages for invalid files
    - Call `onUpload(urls: string[])` callback when uploads complete
  - Create `app/components/ImageThumbnails.tsx`
    - Display grid of image thumbnails from `urls: string[]` prop
    - Each thumbnail is clickable — opens full-size image in new tab (`target="_blank"`)
    - If no URLs, render nothing
  - Export both from `app/components/index.ts`
  - **Depends on:** Task 14
  - **Requirements:** 3

## Phase 4: Issue CRUD Enhancements

- [x] 16. Update POST /api/issues/route.ts
  - Call `auth()` — return 401 if no session
  - Validate request body with updated `createIssueSchema` (Zod v4)
  - Set `reporterId: session.user.id` when creating the issue
  - After issue creation, create `IssueImage` records for each URL in `imageUrls`
  - Create `ActivityLog` entry with `action: "ISSUE_CREATED"`, `actorId: session.user.id`
  - **Depends on:** Tasks 3, 4, 5
  - **Requirements:** 3, 6, 8, 12

- [x] 17. Create PATCH and DELETE /api/issues/[id]/route.ts
  - Call `auth()` — return 401 if no session
  - **PATCH**: validate body with `patchIssueSchema`; fetch current issue to get old values; update only provided fields; for each changed field (status, assigneeId, priority) create an `ActivityLog` entry with oldValue/newValue; return updated issue with 200
  - **PATCH**: return 404 if issue not found
  - **DELETE**: check `issue.reporterId === session.user.id || session.user.role === "ADMIN"` — return 403 if neither; delete issue (cascade removes images, comments, activityLogs via DB); return 200
  - **DELETE**: return 404 if issue not found
  - Note: `params` is a Promise — must `await params` to get `id`
  - **Depends on:** Tasks 3, 4, 5
  - **Requirements:** 6, 8, 12

- [ ] 18. Update issues list page (app/issues/page.tsx)
  - `searchParams` is a Promise — await it before using
  - Read filter params: status, priority, department, assignee, orderBy (default: createdAt), direction (default: desc), page (default: 1)
  - Build Prisma `where` clause only for non-default filter values; validate enum values — ignore invalid ones
  - Query issues with `skip`/`take` for pagination (PAGE_SIZE = 10), include `assignee` relation
  - Query total count for pagination calculation
  - Import and render `IssueFilters` client component (pass current params as props)
  - Render issues table with PriorityBadge, IssueStatusBadge, DueDateDisplay, OverdueBadge per row
  - Render `Pagination` component below table
  - **Depends on:** Tasks 3, 12, 13, 19, 20
  - **Requirements:** 6, 10, 11

- [x] 19. Create IssueFilters client component
  - Create `app/issues/IssueFilters.tsx` (client component, `'use client'`)
  - Render Radix UI `Select` dropdowns for: status, priority, department, orderBy, direction
  - On change: use `useRouter` and `useSearchParams` to call `router.replace` with updated query params, resetting `page` to 1
  - Pre-select the current value from URL params
  - **Depends on:** Task 3
  - **Requirements:** 10

- [x] 20. Create Pagination component
  - Create `app/components/Pagination.tsx` (client component)
  - Props: `currentPage`, `totalPages`, `baseUrl` (or use `useSearchParams`)
  - Render Previous / page numbers / Next using Radix UI `Button`
  - Disable Previous on page 1, disable Next on last page
  - On click: update `?page=` query param via `router.replace`
  - Export from `app/components/index.ts`
  - **Depends on:** Task 1
  - **Requirements:** 10

- [ ] 21. Update new issue form (app/issues/new/page.tsx)
  - Add `department` text input / dropdown (Network, IT, Customer Service, Finance, HR)
  - Add `dueDate` date input (HTML `<input type="date">` or Radix UI)
  - Add `assignee` dropdown — fetch all users server-side and pass as prop to client form
  - Add `ImageUpload` component — collect uploaded URLs and include in form submission
  - Pass all new fields to POST /api/issues
  - **Depends on:** Tasks 4, 15, 16
  - **Requirements:** 6

- [ ] 22. Create edit issue page (app/issues/[id]/edit/)
  - Create `app/issues/[id]/edit/page.tsx` (server component)
    - `params` is a Promise — await to get `id`
    - Call `auth()` — redirect to sign-in if no session
    - Fetch issue by id — call `notFound()` if not found
    - Fetch all users for assignee dropdown
    - Pass issue data and users list to `EditIssueForm`
  - Create `app/issues/[id]/edit/EditIssueForm.tsx` (client component)
    - Pre-populate title, description, status, priority, category, department, dueDate, assigneeId
    - Include `ImageUpload` for adding new images
    - Show existing images in `ImageThumbnails`
    - On submit: PATCH `/api/issues/[id]` with changed fields only
    - Disable submit button while submitting
    - Redirect to `/issues/[id]` on success
    - Show error callout on failure
  - **Depends on:** Tasks 11, 15, 17
  - **Requirements:** 6

- [ ] 23. Update issue detail page (app/issues/[id]/page.tsx)
  - `params` is a Promise — await to get `id`
  - Include relations in Prisma query: `reporter`, `assignee`, `images`, `comments.author`, `activityLogs.actor`
  - Display "Reported by" section with `Avatar` + reporter name
  - Display "Assigned to" section with `Avatar` + assignee name (if set)
  - Display `department`, `DueDateDisplay`, `OverdueBadge` (if applicable)
  - Display `ImageThumbnails` for issue images (omit section if no images)
  - Display Edit button (link to `/issues/[id]/edit`) and `DeleteButton` — only if authenticated
  - Pass comments to `CommentSection` client component
  - Pass activityLogs to `ActivityTimeline` component
  - **Depends on:** Tasks 11, 13, 15, 17, 24, 26
  - **Requirements:** 4, 6, 8, 11

- [ ] 24. Create DeleteButton component with AlertDialog
  - Create `app/issues/[id]/DeleteButton.tsx` (client component)
  - Use Radix UI `AlertDialog` for confirmation (Trigger → Root → Content → Cancel + Confirm)
  - On confirm: call DELETE `/api/issues/[id]`, show loading spinner on button, redirect to `/issues` on success
  - Show error callout (dismissible) on failure, stay on current page
  - Only render if user is authenticated (pass `canDelete` boolean prop)
  - **Depends on:** Task 17
  - **Requirements:** 6

## Phase 5: Comments & Activity Log

- [ ] 25. Create comment API routes
  - Create `app/api/issues/[id]/comments/route.ts`
    - **POST**: call `auth()` — 401 if no session; validate body with `commentSchema`; create `Comment` record; create `ActivityLog` entry with `action: "COMMENT_ADDED"`, `newValue: content.slice(0, 100)`; return created comment with author data
    - Note: `params` is a Promise — must await
  - Create `app/api/comments/[commentId]/route.ts`
    - **DELETE**: call `auth()` — 401 if no session; fetch comment; check `comment.authorId === session.user.id || session.user.role === "ADMIN"` — 403 if neither; 404 if not found; delete comment; create `ActivityLog` entry with `action: "COMMENT_DELETED"`; return 200
    - Note: `params` is a Promise — must await
  - **Depends on:** Tasks 3, 4, 5
  - **Requirements:** 7, 8, 12

- [ ] 26. Create CommentSection client component
  - Create `app/components/CommentSection.tsx` (client component, `'use client'`)
  - Props: `issueId`, `initialComments` (with author data), `currentUserId?`, `userRole?`
  - Render comment list sorted ascending by `createdAt`
  - Each comment: `Avatar` + author name + relative timestamp + content
  - Show Delete option if `comment.authorId === currentUserId || userRole === "ADMIN"`
  - On delete: call DELETE `/api/comments/[commentId]`, remove from local state (optimistic)
  - If authenticated: show textarea + "Post Comment" button; POST to `/api/issues/[id]/comments`; append new comment to list on success; clear textarea; show "Comment cannot be empty" if empty
  - If not authenticated: show "Sign in to comment" prompt with link to `/auth/signin`
  - **Depends on:** Tasks 11, 25
  - **Requirements:** 7

- [ ] 27. Create ActivityTimeline component
  - Create `app/components/ActivityTimeline.tsx` (server component)
  - Props: `activityLogs` (with actor data, descending order)
  - Render vertical timeline (most recent first)
  - Each entry: `Avatar` (actor) + actor name + human-readable action label + old→new values + timestamp
  - Entries ≤ 24h old: relative time ("2 hours ago"); older entries: absolute date ("Jun 26, 2026 10:30")
  - Action label mapping: ISSUE_CREATED → "created this issue", STATUS_CHANGED → "changed status from X to Y", ASSIGNEE_CHANGED → "changed assignee", PRIORITY_CHANGED → "changed priority", COMMENT_ADDED → "added a comment", COMMENT_DELETED → "deleted a comment"
  - Export from `app/components/index.ts`
  - **Depends on:** Tasks 11
  - **Requirements:** 8

## Phase 6: Admin Panel

- [ ] 28. Create admin API routes
  - Create `app/api/admin/users/[id]/route.ts`
    - **PATCH**: call `auth()` — 401 if no session; check `session.user.role === "ADMIN"` — 403 if not; validate body with `patchUserSchema`; update User record; return updated user
    - Note: `params` is a Promise — must await
  - Create `app/api/admin/issues/route.ts`
    - **PATCH**: call `auth()` — 401; check ADMIN role — 403; validate body with `bulkStatusSchema` (ids array + status); run `prisma.issue.updateMany` for matching ids; return count of updated records
  - **Depends on:** Tasks 3, 4, 5
  - **Requirements:** 5, 12

- [ ] 29. Create admin panel page and components
  - Create `app/admin/page.tsx` (server component)
    - Call `auth()` — redirect to sign-in if no session; return 403 page if `role !== "ADMIN"`
    - Fetch all users for UserTable
    - Fetch all issues (with assignee) for IssueTable
    - Compute stats: `prisma.issue.groupBy` by status and department; avg resolution time for CLOSED issues
    - Render StatsOverview, UserTable, IssueTable
  - Create `app/admin/components/StatsOverview.tsx` (server-renderable)
    - Display total by status, total by department, avg resolution time in hours
  - Create `app/admin/components/UserTable.tsx` (client component)
    - Table with name, email, role dropdown (USER/ADMIN), active/inactive toggle button, createdAt
    - Role change: PATCH `/api/admin/users/[id]` with `{ role }`; update local state on success
    - Activate/Deactivate: PATCH `/api/admin/users/[id]` with `{ isActive: true/false }`; update local state
  - Create `app/admin/components/IssueTable.tsx` (client component)
    - Checkbox column, title, status, priority, department, assignee, createdAt, delete action
    - Bulk status: select all/individual checkboxes + status select + "Apply" → PATCH `/api/admin/issues`
    - Delete: `AlertDialog` confirmation → DELETE `/api/issues/[id]`
  - **Depends on:** Tasks 11, 24, 28
  - **Requirements:** 5

## Phase 7: Dashboard & Profile

- [ ] 30. Create dashboard chart components (recharts)
  - Create `app/components/dashboard/StatusChart.tsx` (client component, `'use client'`)
    - Props: `data: { status: string; count: number }[]`
    - Render `<BarChart>` from recharts with ET green bars
  - Create `app/components/dashboard/PriorityChart.tsx` (client component, `'use client'`)
    - Props: `data: { priority: string; count: number }[]`
    - Render `<BarChart>` or `<PieChart>` from recharts
  - Create `app/components/dashboard/DepartmentChart.tsx` (client component, `'use client'`)
    - Props: `data: { department: string; count: number }[]`
    - Render `<BarChart>` from recharts
  - **Depends on:** Task 1
  - **Requirements:** 9

- [ ] 31. Create dashboard summary and activity components
  - Create `app/components/dashboard/SummaryCards.tsx` (server-renderable)
    - Props: `open`, `inProgress`, `closed` counts
    - Each card is a link to `/issues?status=OPEN` etc., using Radix UI Card
    - ET green accent on card borders/icons
  - Create `app/components/dashboard/OverdueCard.tsx` (server-renderable)
    - Props: `count: number`
    - Red-accented card linking to `/issues?overdue=true` (or just `/issues`)
  - Create `app/components/dashboard/RecentActivity.tsx` (server-renderable)
    - Props: `entries` (last 10 ActivityLog with actor + issue title)
    - List each entry: actor name + action label + issue title + relative timestamp
  - **Depends on:** Tasks 11, 27
  - **Requirements:** 9

- [ ] 32. Update dashboard homepage (app/page.tsx)
  - Make it a server component with `export const dynamic = 'force-dynamic'`
  - Fetch server-side with `Promise.all`:
    - `prisma.issue.groupBy({ by: ['status'] })`
    - `prisma.issue.groupBy({ by: ['priority'] })`
    - `prisma.issue.groupBy({ by: ['department'] })`
    - Overdue count: `prisma.issue.count({ where: { status: { not: 'CLOSED' }, dueDate: { lt: new Date() } } })`
    - Last 10 ActivityLog entries with actor + issue title
  - Pass serialized data as props to all chart and card components
  - Render: SummaryCards, OverdueCard, StatusChart, PriorityChart, DepartmentChart, RecentActivity
  - Show empty-state messages ("No data yet") when counts are all zero
  - **Depends on:** Tasks 30, 31
  - **Requirements:** 9

- [ ] 33. Create profile page (app/profile/page.tsx)
  - Server component — call `auth()`, redirect to sign-in if no session
  - Display current user name, email, and Avatar (32×32)
  - Include `ImageUpload` component limited to 1 image
  - On upload: PATCH `/api/users/me` with `{ image: url }` to update `User.image`
  - Create `app/api/users/me/route.ts` — PATCH endpoint to update `User.image` for authenticated user
  - Show success/error feedback using Radix UI Callout
  - **Depends on:** Tasks 11, 14, 15
  - **Requirements:** 4

## Phase 8: Tests

- [ ] 34. Set up test infrastructure
  - Create `vitest.config.ts` (or `jest.config.ts`) configured for TypeScript + path aliases
  - Create `__tests__/` directory structure: `unit/` and `integration/`
  - Verify `fast-check` import works in a sample test file
  - **Depends on:** Task 1
  - **Requirements:** all

- [ ] 35. PBT tests for dueDateUtils
  - Create `__tests__/unit/dueDateUtils.test.ts`
  - Property 30: any CLOSED issue never returns "overdue" regardless of dueDate
  - Property 30: any non-CLOSED issue with `dueDate < now` always returns "overdue"
  - Property 31: any non-CLOSED issue with `0 < dueDate - now <= 48h` always returns "approaching"
  - Property 24: null dueDate always returns null
  - Run with `{ numRuns: 100 }` per property
  - **Depends on:** Tasks 13, 34
  - **Requirements:** 11

- [ ] 36. PBT tests for Zod validation schemas
  - Create `__tests__/unit/validationSchemas.test.ts`
  - Property 4: any non-allowed MIME string fails upload validation with correct error message
  - Property 5: any file size > 5242880 bytes fails with "File must be under 5 MB"
  - Property 16: any empty or whitespace-only string fails `commentSchema` with "Comment cannot be empty"
  - Property 33: `patchIssueSchema.safeParse` on arbitrary non-object inputs returns `success: false`
  - **Depends on:** Tasks 4, 34
  - **Requirements:** 3, 7, 12

- [ ] 37. PBT tests for pagination, sort, and filter logic
  - Create `__tests__/unit/pagination.test.ts`
    - Property 27: any page result has at most 10 items
    - Property 28: absent/default filter values produce no `where` clause restriction
  - Create `__tests__/unit/sortFilter.test.ts`
    - Property 26: any valid `orderBy` + `direction` combination produces correctly ordered output
    - Property 17: comments sorted ascending by createdAt — oldest always first
    - Property 22: ActivityLog sorted descending by createdAt — newest always first
  - **Depends on:** Tasks 34
  - **Requirements:** 7, 8, 10

- [ ] 38. PBT tests for stats and activity log logic
  - Create `__tests__/unit/stats.test.ts`
    - Property 11: avg resolution time equals arithmetic mean of (updatedAt - createdAt) / 3600000 for any array of CLOSED issues; returns 0 for empty array
  - Create `__tests__/unit/activityLog.test.ts`
    - Property 19: status/assignee/priority change always produces ActivityLog entry with correct action, oldValue, newValue
    - Property 20: COMMENT_ADDED log newValue is always ≤ 100 characters for any comment content
    - Property 21: issue creation always produces exactly one ISSUE_CREATED ActivityLog entry
  - **Depends on:** Task 34
  - **Requirements:** 5, 8
