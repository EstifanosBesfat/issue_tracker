# Requirements Document

## Introduction

This document defines the requirements for enhancing the existing EthioTelecom Issue Tracker — a Next.js 16 / React 19 / Prisma 7 / PostgreSQL application used to manage internal IT service desk tickets. The enhancements transform the basic CRUD prototype into a production-quality, branded internal tool suitable as a standout EthioTelecom internship project.

The system already supports creating, listing, viewing, and deleting issues with `Status`, `Priority`, and `Category` enums. The enhancement adds Google OAuth authentication, role-based access control, image attachments via Cloudinary, an admin panel, comments, activity logging, a rich dashboard, and comprehensive filtering/sorting/pagination — all under EthioTelecom brand identity (primary green `#00A651`).

All new routes, APIs, and Prisma models must comply with the following hard technical constraints:
- Next.js 16 App Router: `params` and `searchParams` must be awaited as Promises
- Tailwind CSS v4 syntax: `@import "tailwindcss"` (not `@tailwind` directives)
- NextAuth v5 (beta): `auth()` function, `auth.ts` config, `middleware.ts` for route protection
- Radix UI Themes for all UI components (no shadcn, no MUI)
- Cloudinary npm package for all server-side image uploads

---

## Glossary

- **System**: The EthioTelecom Issue Tracker web application as a whole
- **Issue_Tracker**: The Next.js application described in this document
- **NavBar**: The top navigation bar rendered in the root layout
- **User**: A registered person who has signed in via Google OAuth
- **Admin**: A User with `role = ADMIN` who has elevated privileges
- **Guest**: An unauthenticated visitor with read-only access
- **Issue**: A service desk ticket recording a problem, request, or incident
- **IssueImage**: A Cloudinary-hosted image attachment linked to an Issue
- **Comment**: A text note posted by a User on an Issue
- **ActivityLog**: An immutable audit record of a change made to an Issue
- **Assignee**: The User to whom an Issue has been assigned for resolution
- **Dashboard**: The homepage (`/`) displaying summary statistics and charts
- **Admin_Panel**: The `/admin` route accessible only to Admin users
- **Cloudinary**: The third-party image hosting service used for all uploads
- **NextAuth**: The `next-auth@beta` (v5) authentication library
- **Prisma**: The ORM used to interact with the PostgreSQL database
- **ET_Brand_Green**: EthioTelecom primary brand color `#00A651`
- **Overdue_Issue**: An Issue whose `dueDate` is in the past and `status` is not `CLOSED`
- **EARS**: Easy Approach to Requirements Syntax — the pattern used for all acceptance criteria

---

## Requirements

### Requirement 1: EthioTelecom Branding

**User Story:** As a developer, I want the application to display EthioTelecom brand identity throughout, so that the project is immediately recognizable as an official EthioTelecom internal tool.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL replace the bug SVG icon in the NavBar with the image at `/public/tele horizontal.png` using the Next.js `Image` component with appropriate `alt="EthioTelecom"` text.
2. THE Issue_Tracker SHALL set the Radix UI `Theme` `accentColor` prop to the nearest Radix color scale matching ET_Brand_Green (`"green"`).
3. THE Issue_Tracker SHALL update `app/globals.css` to use the Tailwind CSS v4 `@import "tailwindcss"` directive and define `--color-brand: #00A651` as a CSS custom property.
4. THE Issue_Tracker SHALL apply `background-color: #ffffff` and `color: #111827` to the root `<body>` element via `globals.css` so that the styling applies regardless of whether any page content is rendered.
5. THE NavBar SHALL display the EthioTelecom horizontal logo at a height of 32px and a maximum width that maintains its natural aspect ratio.
6. WHEN the NavBar logo image fails to load, THE NavBar SHALL display the `alt` text "EthioTelecom" and may additionally render a styled placeholder element (e.g., a green rectangle with the text "ET") in place of the broken image.
7. THE Issue_Tracker SHALL use ET_Brand_Green as the primary action color for buttons, active link indicators, and focus rings throughout the application.

---

### Requirement 2: Google OAuth Authentication

**User Story:** As an EthioTelecom employee, I want to sign in using my Google account, so that I can access protected features without managing a separate password.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL configure NextAuth v5 with Google OAuth as the sole authentication provider in `auth.ts`.
2. THE Issue_Tracker SHALL use `@auth/prisma-adapter` to persist `User`, `Account`, `Session`, and `VerificationToken` records in PostgreSQL.
3. WHEN a User authenticates for the first time, THE Issue_Tracker SHALL create a new `User` record in the database with `role = USER`.
4. THE Issue_Tracker SHALL define a Prisma `User` model with fields: `id`, `name`, `email` (unique), `image`, `role` (enum: `USER`, `ADMIN`), `isActive` (Boolean, default true), `createdAt`, and `updatedAt`.
5. THE Issue_Tracker SHALL define Prisma `Account`, `Session`, and `VerificationToken` models as required by `@auth/prisma-adapter`.
6. WHEN a Guest visits a protected route (create issue, edit issue, delete issue, admin panel), THE Issue_Tracker SHALL redirect the Guest to the sign-in page via `middleware.ts`.
7. WHEN an authenticated User visits the sign-in page, THE Issue_Tracker SHALL redirect the User to the Dashboard.
8. THE NavBar SHALL display a "Sign In" button when no User session is present.
9. WHEN a User is authenticated, THE NavBar SHALL display the User's profile picture, name, and a "Sign Out" button.
10. WHEN the "Sign Out" button is clicked, THE Issue_Tracker SHALL end the NextAuth session and redirect the User to the Dashboard.
11. THE Issue_Tracker SHALL create a Prisma migration for all new auth-related models before the feature is deployed.
12. IF a User's `isActive` field is `false`, THEN THE Issue_Tracker SHALL reject new sign-in attempts for that User and display a "Your account has been deactivated" message; existing authenticated sessions for that User SHALL remain valid until they naturally expire.

---

### Requirement 3: Image Attachments on Issues

**User Story:** As a User, I want to attach screenshot images when creating or editing an issue, so that I can provide visual evidence of the problem.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL add an image upload input to both the create issue form and the edit issue form.
2. WHEN a User selects a file, THE Issue_Tracker SHALL validate that the file MIME type is one of: `image/jpeg`, `image/png`, `image/gif`, or `image/webp`.
3. WHEN a User selects a file exceeding 5,242,880 bytes (5 MB), THE Issue_Tracker SHALL display the error message "File must be under 5 MB" and reject the file.
4. IF a file fails MIME type validation, THEN THE Issue_Tracker SHALL display the error message "Only JPG, PNG, GIF, and WebP images are allowed."
5. WHEN a valid image file is submitted, THE Issue_Tracker SHALL upload the file to Cloudinary using the server-side `cloudinary` npm package and store the returned secure URL.
6. THE Issue_Tracker SHALL define a `IssueImage` Prisma model with fields: `id` (uuid), `url` (String), `issueId` (foreign key to `Issue`), and `createdAt`.
7. THE Issue_Tracker SHALL define a one-to-many relation between `Issue` and `IssueImage` in the Prisma schema.
8. WHEN an issue detail page is rendered and at least one `IssueImage` record exists for the issue, THE Issue_Tracker SHALL display those images as responsive thumbnails; WHEN no images are attached, THE Issue_Tracker SHALL omit the image section entirely.
9. WHEN a thumbnail image is clicked on the issue detail page, THE Issue_Tracker SHALL open the full-size image in a new browser tab.
10. WHEN an issue is deleted, THE Issue_Tracker SHALL delete all associated `IssueImage` records from the database.
11. IF the Cloudinary upload fails, THEN THE Issue_Tracker SHALL return HTTP 502 with error message "Image upload failed. Please try again." without saving the issue.
12. THE Issue_Tracker SHALL allow uploading a maximum of 5 images per issue.

---

### Requirement 4: User Profile Pictures

**User Story:** As a User, I want my profile picture to appear throughout the application, so that issues and comments are clearly attributed to me.

#### Acceptance Criteria

1. WHEN a User first signs in with Google OAuth, THE Issue_Tracker SHALL store the Google profile picture URL in the `User.image` field via `@auth/prisma-adapter`.
2. THE Issue_Tracker SHALL render the authenticated User's profile picture in the NavBar as a circular avatar with an exact 32px width and 32px height using the `style` or `className` attributes; any other size is not permitted.
3. WHEN a User's `image` field is null or empty, THE Issue_Tracker SHALL display a fallback avatar showing the User's initials in a circle with an ET_Brand_Green background.
4. THE Issue_Tracker SHALL provide a profile settings page at `/profile` where authenticated Users can upload a custom profile picture.
5. WHEN a Cloudinary upload for a custom profile picture succeeds, THE Issue_Tracker SHALL store the returned `secure_url` in `User.image` and update the NavBar avatar; IF the upload fails, THEN THE Issue_Tracker SHALL display an error message and leave `User.image` unchanged.
6. WHEN rendering an issue detail page, THE Issue_Tracker SHALL display the reporter User's profile picture and name in a "Reported by" section.
7. WHEN rendering the issue detail page, THE Issue_Tracker SHALL display the assignee User's profile picture and name if an assignee exists.
8. THE profile picture upload SHALL enforce the same file type and 5 MB size constraints defined in Requirement 3.

---

### Requirement 5: Admin Panel

**User Story:** As an Admin, I want a dedicated admin panel, so that I can manage users, oversee all issues, and view system-wide statistics.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL create an Admin_Panel at route `/admin` accessible only to Users with `role = ADMIN`.
2. WHEN a User with `role = USER` attempts to access `/admin`, THE Issue_Tracker SHALL return HTTP 403 and display an "Access Denied" message.
3. WHEN a Guest attempts to access `/admin`, THE Issue_Tracker SHALL redirect the Guest to the sign-in page.
4. THE Admin_Panel SHALL display a user management table listing all `User` records with columns: name, email, role, status (active/inactive), and createdAt.
5. WHEN an Admin changes a User's role using the role dropdown in the user management table, THE Issue_Tracker SHALL update the `User.role` field via a PATCH request and reflect the change in the table without a full page reload.
6. WHEN an Admin clicks "Deactivate" for a User, THE Issue_Tracker SHALL set `User.isActive = false` via a PATCH request, preventing that User from signing in.
7. WHEN an Admin clicks "Activate" for a deactivated User, THE Issue_Tracker SHALL set `User.isActive = true` via a PATCH request, restoring sign-in access.
8. THE Admin_Panel SHALL display an issue management table listing all issues with columns: title, status, priority, department, assignee, createdAt, and actions.
9. WHEN an Admin selects multiple issues using checkboxes, THE Admin_Panel SHALL enable a "Bulk Change Status" control that updates all selected issues to the chosen status via a single PATCH request.
10. WHEN an Admin clicks "Delete" on any issue in the admin issue table, THE Issue_Tracker SHALL display a Radix UI `AlertDialog` confirmation; the delete operation SHALL only proceed after the user interacts with and confirms the dialog. Direct API calls and bulk operations are permitted to skip the UI dialog but the API endpoint SHALL still require Admin authentication.
11. THE Admin_Panel SHALL display a statistics overview section showing: total issues grouped by status, total issues grouped by department, and average resolution time in hours for CLOSED issues.
12. WHEN the statistics overview is rendered, THE Issue_Tracker SHALL calculate average resolution time as the mean of `(updatedAt - createdAt)` in hours for all CLOSED issues.

---

### Requirement 6: Issue Enhancements

**User Story:** As a User, I want issues to capture priority, department, due date, and assignee information, so that tickets can be properly triaged and routed.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL add a `department` field of type `String` to the `Issue` Prisma model, representing organizational units such as "Network", "IT", "Customer Service", "Finance", and "HR".
2. THE Issue_Tracker SHALL add a `dueDate` field of type `DateTime?` (optional) to the `Issue` Prisma model.
3. THE Issue_Tracker SHALL add an `assigneeId` field of type `String?` (optional, foreign key to `User`) to the `Issue` Prisma model.
4. THE Issue_Tracker SHALL define a many-to-one relation between `Issue` and `User` named `assignee` in the Prisma schema.
5. WHEN creating or editing an issue, THE Issue_Tracker SHALL display a dropdown populated with all registered Users for the assignee field.
6. WHEN creating or editing an issue, THE Issue_Tracker SHALL display a date picker for the `dueDate` field.
7. WHEN creating or editing an issue, THE Issue_Tracker SHALL display a text input or dropdown for the `department` field.
8. WHEN a request to render `/issues/[id]/edit` is received, THE Issue_Tracker SHALL verify the user's NextAuth session before rendering any form content; WHEN no valid session exists, THE Issue_Tracker SHALL redirect to the sign-in page without exposing the pre-populated form.
9. WHEN an authenticated User submits the edit form, THE Issue_Tracker SHALL send a PATCH request to `/api/issues/[id]` and update only the provided fields.
10. WHEN a Guest or unauthenticated User visits `/issues/[id]/edit`, THE Issue_Tracker SHALL redirect to the sign-in page.
11. WHEN an authenticated User clicks "Delete" on an issue detail page, THE Issue_Tracker SHALL display a Radix UI `AlertDialog` confirmation before sending a DELETE request to `/api/issues/[id]`.
12. WHEN an issue is successfully deleted, THE Issue_Tracker SHALL redirect the User to `/issues`.
13. THE issues list SHALL display `priority` values with color-coded badges: CRITICAL (red), HIGH (orange), MEDIUM (yellow), LOW (blue).
14. WHEN an issue detail page is rendered, THE Issue_Tracker SHALL display the `department`, `dueDate`, and assignee name to all visitors (authenticated or unauthenticated) if those fields are set.

---

### Requirement 7: Comments on Issues

**User Story:** As a User, I want to post comments on issues, so that I can provide updates, ask questions, and collaborate with colleagues without sending emails.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL define a `Comment` Prisma model with fields: `id` (uuid), `content` (Text), `authorId` (foreign key to `User`), `issueId` (foreign key to `Issue`), and `createdAt`.
2. THE Issue_Tracker SHALL define a one-to-many relation from `Issue` to `Comment` and from `User` to `Comment` in the Prisma schema.
3. WHEN an authenticated User visits an issue detail page, THE Issue_Tracker SHALL display a textarea and "Post Comment" button below the issue body.
4. WHEN a Guest visits an issue detail page, THE Issue_Tracker SHALL display a "Sign in to comment" prompt instead of the comment form.
5. WHEN an authenticated User submits a non-empty comment, THE Issue_Tracker SHALL POST to `/api/issues/[id]/comments`, create the `Comment` record, and append the comment to the list without a full page reload.
6. IF a User submits an empty comment, THEN THE Issue_Tracker SHALL display the validation error "Comment cannot be empty" and not create the record.
7. THE Issue_Tracker SHALL render comments in ascending chronological order on the issue detail page.
8. WHEN rendering each comment, THE Issue_Tracker SHALL display the author's profile picture (or initials fallback), author name, relative timestamp, and comment content.
9. WHEN the author of a comment views that comment, THE Issue_Tracker SHALL display a "Delete" option for that comment.
10. WHEN an Admin views any comment, THE Issue_Tracker SHALL display a "Delete" option for that comment.
11. WHEN a comment's "Delete" option is clicked, THE Issue_Tracker SHALL send a DELETE request to `/api/comments/[commentId]`, remove the comment from the database, and remove it from the rendered list.
12. WHEN a comment is deleted, THE Issue_Tracker SHALL create an `ActivityLog` entry recording the deletion as defined in Requirement 8.

---

### Requirement 8: Activity Log / Timeline

**User Story:** As a User, I want to see a chronological timeline of all changes made to an issue, so that I have a full audit trail of its history.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL define an `ActivityLog` Prisma model with fields: `id` (uuid), `issueId` (foreign key to `Issue`), `actorId` (foreign key to `User`), `action` (String), `oldValue` (String, nullable), `newValue` (String, nullable), and `createdAt`.
2. THE Issue_Tracker SHALL define a one-to-many relation from `Issue` to `ActivityLog` and from `User` to `ActivityLog` in the Prisma schema.
3. WHEN an Issue's `status` field is changed, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "STATUS_CHANGED"`, `oldValue` = previous status, `newValue` = new status.
4. WHEN an Issue's `assigneeId` field is changed, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "ASSIGNEE_CHANGED"`, `oldValue` = previous assignee name (or `null`), `newValue` = new assignee name (or `null`).
5. WHEN an Issue's `priority` field is changed, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "PRIORITY_CHANGED"`, `oldValue` = previous priority, `newValue` = new priority.
6. WHEN a `Comment` is created on an Issue, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "COMMENT_ADDED"` and `newValue` = a truncated preview of the comment content (maximum 100 characters).
7. WHEN a `Comment` is deleted from an Issue, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "COMMENT_DELETED"`.
8. WHEN an Issue is created, THE Issue_Tracker SHALL create an `ActivityLog` entry with `action = "ISSUE_CREATED"`.
9. THE Issue_Tracker SHALL display the ActivityLog as a vertical timeline on the issue detail page, below the comments section.
10. WHEN rendering each ActivityLog entry, THE Issue_Tracker SHALL display: the actor's profile picture (or initials fallback), actor name, action label (human-readable), old/new values where applicable, and a relative timestamp.
11. THE ActivityLog timeline SHALL render entries in descending chronological order (most recent first).
12. THE `actorId` in an `ActivityLog` entry SHALL reference the authenticated User who performed the action; system-generated entries SHALL reference a designated system account or use a nullable `actorId`.

---

### Requirement 9: Dashboard Homepage

**User Story:** As a User, I want an informative dashboard on the homepage, so that I can immediately see the health of all open service tickets at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display three summary cards showing the counts of OPEN, IN_PROGRESS, and CLOSED issues respectively.
2. WHEN a summary card is clicked, THE Issue_Tracker SHALL navigate to `/issues?status=<STATUS>`. WHEN the count shown on a card is zero, THE Issue_Tracker SHALL still render the card as clickable and navigate to the filtered (empty) list.
3. THE Dashboard SHALL display a bar chart rendered with the `recharts` library showing issue counts grouped by `status`.
4. THE Dashboard SHALL display a second chart (bar or pie) rendered with `recharts` showing issue counts grouped by `priority`.
5. THE Dashboard SHALL display a third bar chart rendered with `recharts` showing issue counts grouped by `department`.
6. THE Dashboard SHALL display a count of Overdue_Issues in a prominently styled card with a red color indicator.
7. THE Dashboard SHALL display a "Recent Activity" feed showing the last 10 `ActivityLog` entries across all issues, each with actor name, action label, issue title, and relative timestamp.
8. WHEN the Dashboard is rendered, THE Issue_Tracker SHALL fetch all required aggregated data server-side and pass it to client chart components as serializable props.
9. WHEN no issues exist, THE Dashboard SHALL display zero values in all summary cards and render the chart areas with zero-value axis ticks alongside empty-state messages (e.g., "No data yet").
10. THE Dashboard SHALL update its data on every full page load (`export const dynamic = 'force-dynamic'`).

---

### Requirement 10: Filter, Sort, and Pagination on Issues List

**User Story:** As a User, I want to filter, sort, and paginate the issues list, so that I can quickly locate the specific tickets I am responsible for or interested in.

#### Acceptance Criteria

1. THE Issue_Tracker SHALL add filter controls to the issues list page (`/issues`) for: `status`, `priority`, `department`, and `assignee`.
2. THE Issue_Tracker SHALL add sort controls to the issues list page for: `title`, `status`, `priority`, `createdAt`, and `dueDate`.
3. THE Issue_Tracker SHALL support sort direction: ascending and descending.
4. WHEN a filter or sort value is changed, THE Issue_Tracker SHALL update the URL query parameters (`?status=`, `?priority=`, `?department=`, `?assignee=`, `?orderBy=`, `?direction=`) and re-render the filtered/sorted list without a client-side navigation stack entry that breaks the back button.
5. WHEN the issues list page is rendered, THE Issue_Tracker SHALL read all filter/sort/page values from the `searchParams` Promise (awaited per Next.js 16 App Router rules) and apply them to the Prisma query.
6. THE Issue_Tracker SHALL paginate the issues list to display 10 issues per page.
7. THE Issue_Tracker SHALL render pagination controls showing the current page, total pages, previous page button, and next page button.
8. WHEN the `?page=` query parameter is absent, THE Issue_Tracker SHALL default to page 1.
9. WHEN the `?page=` query parameter exceeds the total number of pages, THE Issue_Tracker SHALL display the last page of results.
10. THE Issue_Tracker SHALL compose all filter, sort, and page state into a single URL so that the resulting URL is bookmarkable and shareable.
11. WHEN filter controls are rendered, THE Issue_Tracker SHALL apply only the filters whose values differ from their default ("All") state; filters left at their default value SHALL be omitted from the Prisma query and SHALL NOT restrict the result set.
12. IF the `assignee` filter query parameter contains a value that does not match any `User.id`, THEN THE Issue_Tracker SHALL treat it as no assignee filter and return all issues.

---

### Requirement 11: Due Dates and Overdue Indicators

**User Story:** As a User, I want overdue issues to be visually highlighted, so that I can prioritize tickets that have missed their resolution deadline.

#### Acceptance Criteria

1. WHEN an issue's `dueDate` is in the past and `status` is not `CLOSED`, THE Issue_Tracker SHALL render an "Overdue" badge on that issue's row in the issues list.
2. THE "Overdue" badge SHALL use a red background (`bg-red-600`) with white text and a `ring-1 ring-red-600/20` border.
3. WHEN an issue detail page is rendered for an Overdue_Issue, THE Issue_Tracker SHALL display the "Overdue" badge prominently near the issue title.
4. THE Dashboard SHALL display the count of Overdue_Issues in a dedicated summary card as required by Requirement 9, Criterion 6.
5. WHEN an issue's `dueDate` is set and the issue is not overdue, THE Issue_Tracker SHALL display the due date in the issues list and on the issue detail page using a human-readable format (e.g., "Jul 15, 2026").
6. WHEN an issue's `dueDate` is within 48 hours of the current time, the issue's status is not `CLOSED`, and the issue is not yet overdue, THE Issue_Tracker SHALL display the due date in amber/orange to indicate it is approaching.
7. THE Overdue_Issue determination SHALL be computed server-side at render time by comparing `issue.dueDate` to the current UTC timestamp, not in the client browser.
8. WHEN an issue transitions to `CLOSED` status, THE Issue_Tracker SHALL remove the "Overdue" badge and any amber/orange due date coloring even if the `dueDate` has passed.

---

### Requirement 12: Data Integrity and API Security

**User Story:** As a system architect, I want all API endpoints to enforce authentication and input validation, so that the database is protected from unauthorized writes and malformed data.

#### Acceptance Criteria

1. WHEN any mutating API route (POST, PATCH, DELETE) receives a request without a valid NextAuth session, THE Issue_Tracker SHALL return HTTP 401 with body `{"error": "Unauthorized"}`.
2. WHEN a non-Admin User sends a DELETE request to `/api/issues/[id]` for an issue they did not create, THE Issue_Tracker SHALL return HTTP 403 with body `{"error": "Forbidden"}`.
3. WHEN the `/api/admin/*` routes receive a request from a User with `role = USER`, THE Issue_Tracker SHALL return HTTP 403 with body `{"error": "Forbidden"}`.
4. THE Issue_Tracker SHALL validate all POST and PATCH request bodies using Zod v4 schemas before writing to the database.
5. IF a request body fails Zod validation, THEN THE Issue_Tracker SHALL return HTTP 400 with the Zod `error.format()` error object.
6. THE Issue_Tracker SHALL use parameterized Prisma queries exclusively; raw SQL `$queryRawUnsafe` calls are prohibited.
7. WHEN a Cloudinary upload URL is returned, THE Issue_Tracker SHALL store only the `secure_url` field (HTTPS) and not store any Cloudinary API keys or secrets in the database.
8. THE `auth()` function from NextAuth v5 SHALL be called in all server components and API routes that require the current session, replacing any usage of the deprecated `getServerSession()` function.
