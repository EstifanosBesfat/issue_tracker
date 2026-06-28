# Ethio Telecom Issue Tracker

A modern, full-stack issue tracking system built for Ethio Telecom using Next.js 16, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Static type checking
- **Prisma 7** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **NextAuth.js** - Authentication (Google OAuth)
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Cloudinary** - Image uploads
- **Recharts** - Data visualization

## Features

### User Features

- Sign in with Google
- Create new issues with attachments
- Edit and delete their own issues
- Comment on issues
- View issue details and activity log
- Filter, sort, and paginate issues
- View issue statistics

### Admin Features

- All user features
- Change issue statuses (OPEN → IN_PROGRESS → CLOSED)
- Bulk update issue statuses
- Manage users (change roles, activate/deactivate)
- View system statistics and reports

### Permissions

- **Anyone** can view issues
- **Authenticated users** can create issues, comment, and edit/delete their own issues
- **Admins** can edit/delete any issue, change statuses, and manage users

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud project (for OAuth)
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository

```bash
git clone <repo-url>
cd issue-tracker
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/issue-tracker?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

4. Run Prisma migrations

```bash
npx prisma migrate dev
```

5. (Optional) Seed the database with demo data

```bash
npx tsx prisma/seed.ts
```

6. Make a user an admin

```bash
# List all users
npx tsx prisma/make-admin.ts

# Make a specific user admin
npx tsx prisma/make-admin.ts your@email.com
```

7. Start the development server

```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check
```

## Project Structure

```
.
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── auth/           # Auth pages
│   ├── components/     # Reusable components
│   ├── issues/         # Issue pages
│   ├── lib/            # Utilities
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── validationSchemas.ts
├── prisma/
│   ├── migrations/     # Database migrations
│   ├── schema.prisma   # Prisma schema
│   ├── client.ts       # Prisma client setup
│   ├── seed.ts         # Demo data seed script
│   └── make-admin.ts   # Admin promotion script
├── public/             # Static assets
├── types/              # Type definitions
├── auth.ts             # NextAuth config
├── auth.config.ts      # Edge-safe auth config
├── middleware.ts       # Next.js middleware
└── package.json
```

## License

MIT
