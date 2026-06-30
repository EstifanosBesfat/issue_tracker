# Ethio Telecom Issue Tracker

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)
![License](https://img.shields.io/badge/License-MIT-green)

A full-stack issue tracking system built for **Ethio Telecom** to manage network infrastructure incidents and service requests. Built with Next.js 16, TypeScript, Prisma ORM, PostgreSQL, and shadcn/ui.

---

## ✨ Features

### User Features
- 🔐 Register and sign in with email & password (credentials-based auth)
- 📝 Create, edit, and delete your own issues
- 🔍 Search issues by title keyword
- 🗂️ Filter by status, priority, and department
- 💬 Comment on issues
- 📅 View issue details, activity timeline, and due date alerts
- 📤 Export filtered issues to CSV for reporting

### Admin Features
- All user features, plus:
- ✅ Change issue statuses (OPEN → IN_PROGRESS → CLOSED)
- 👤 Assign issues to staff members
- 👥 Manage users (change roles, activate/deactivate)
- 📊 View system statistics and dashboard charts

### Notifications
- 🔔 In-app notification bell (updates every 30 seconds)
- Get notified when an issue is assigned to you
- Get notified when the status of your reported issue changes

### Permissions
| Action | Anyone | Authenticated User | Admin |
|---|---|---|---|
| View issues | ✅ | ✅ | ✅ |
| Create issue | ❌ | ✅ | ✅ |
| Edit/delete own issue | ❌ | ✅ | ✅ |
| Edit/delete any issue | ❌ | ❌ | ✅ |
| Change issue status | ❌ | ❌ | ✅ |
| Assign issues | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Authentication | NextAuth.js v5 (Credentials) |
| UI Components | shadcn/ui + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Image Uploads | Cloudinary |
| Charts | Recharts |
| Password Hashing | bcryptjs |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- Cloudinary account (for image uploads)

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
│   ├── admin/              # Admin dashboard & user management
│   ├── api/
│   │   ├── auth/
│   │   │   └── register/   # POST — register new user
│   │   ├── issues/
│   │   │   ├── [id]/       # PATCH, DELETE — update/delete issue
│   │   │   └── export/     # GET  — CSV export
│   │   └── notifications/  # GET, PATCH — in-app notifications
│   ├── auth/
│   │   ├── signin/         # Login page
│   │   └── register/       # Registration page
│   ├── components/         # Shared reusable components
│   │   └── NotificationBell.tsx
│   ├── issues/             # Issue list and detail pages
│   ├── lib/                # Utilities (dueDateUtils, etc.)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard (home page)
├── components/
│   └── ui/                 # shadcn/ui components (table, badge, input, button)
├── prisma/
│   ├── migrations/         # Database migration history
│   ├── schema.prisma       # Prisma schema
│   ├── client.ts           # Prisma client singleton
│   ├── seed.ts             # Demo data seed script
│   └── make-admin.ts       # Admin promotion utility
├── public/                 # Static assets (logo, images)
├── types/                  # TypeScript type augmentations
├── auth.ts                 # NextAuth config (Credentials + Prisma adapter)
├── auth.config.ts          # Edge-safe auth config (for middleware)
├── middleware.ts            # Route protection middleware
└── package.json
```

---

## 📜 Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
npx tsc --noEmit      # Type-check without building
npx prisma studio     # Open Prisma visual database browser
npx prisma migrate dev # Run pending migrations
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (salt rounds: 10) — never stored in plain text
- Sessions use **JWT tokens** stored in secure HTTP-only cookies
- Route protection is enforced at the middleware level (Edge runtime)
- Admin-only endpoints verify both authentication and the `ADMIN` role

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
