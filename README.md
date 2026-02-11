# Appointment Scheduler

A full-featured appointment scheduling application built with Next.js 16, Better Auth, Prisma, and Hono.

## Features

- **Authentication**: Complete auth system with email/password, social login, email verification
- **Appointments**: Create, edit, delete, and manage appointments
- **Dashboard**: Admin dashboard with statistics and appointment management
- **Email Notifications**: Automatic appointment reminders via cron jobs
- **Responsive UI**: Modern, accessible UI with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Better Auth
- **Database**: PostgreSQL with Prisma ORM
- **API**: Hono (for cron jobs and API routes)
- **UI**: React, Tailwind CSS, shadcn/ui
- **Forms**: React Hook Form, Zod
- **Email**: Nodemailer (Gmail SMTP)

## Project Structure

```
appointment-scheduler/
├── app/                      # Next.js App Router pages
│   ├── (protected)/          # Protected routes (require auth)
│   │   ├── admin/           # Admin dashboard
│   │   ├── dashboard/       # User dashboard
│   │   │   └── appointments/ # Appointment management
│   │   └── settings/        # User settings
│   ├── api/                 # API routes
│   │   └── [[...route]]/   # Hono API routes
│   │       └── cron/       # Cron job endpoints
│   ├── login/               # Login page
│   ├── signup/             # Signup page
│   ├── forgot-password/     # Password recovery
│   └── reset-password/      # Password reset
├── components/             # Shared UI components
│   └── ui/                 # shadcn/ui components
├── features/               # Feature modules
│   ├── admin/              # Admin features
│   ├── appointment/        # Appointment features
│   │   ├── api/           # API hooks
│   │   ├── components/    # Appointment components
│   │   ├── hooks/         # Custom hooks
│   │   └── types/         # TypeScript types
│   ├── auth/              # Authentication
│   │   ├── components/    # Auth forms
│   │   ├── hooks/         # Auth hooks
│   │   ├── lib/           # API layer
│   │   └── types/         # Auth types
│   ├── dashboard/         # Dashboard components
│   ├── form/              # Form components
│   ├── landing/           # Landing page
│   ├── mail/              # Email templates
│   │   ├── components/    # Email templates
│   │   └── lib/          # Email sending
│   └── nav/               # Navigation components
├── hooks/                 # Shared hooks
├── lib/                   # Utilities and configurations
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── docs/                 # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- SMTP credentials for email

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd appointment-scheduler
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and SMTP credentials
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Environment Variables

| Variable                     | Description                    | Required |
| ---------------------------- | ------------------------------ | -------- |
| `DATABASE_URL`               | PostgreSQL connection string   | Yes      |
| `BETTER_AUTH_URL`            | Application URL                | Yes      |
| `BETTER_AUTH_SECRET`         | Auth secret key                | Yes      |
| `BETTER_AUTH_API_KEY`        | Auth API key                   | Yes      |
| `NEXT_PUBLIC_API_URL`        | Public API URL                 | Yes      |
| `NEXT_PUBLIC_APP_URL`        | Public app URL                 | Yes      |
| `SMTP_HOST`                  | SMTP server host               | Yes      |
| `SMTP_PORT`                  | SMTP server port               | Yes      |
| `SMTP_USER`                  | SMTP username                  | Yes      |
| `SMTP_PASS`                  | SMTP password                  | Yes      |
| `SMTP_FROM`                  | From email address             | Yes      |
| `CRON_SECRET`                | Secret for cron authentication | No       |
| `TEST_SEND_TO_MAIL`          | Test email for cron testing    | No       |
| `TEST_CRON_INTERVAL_MINUTES` | Test cron interval             | No       |

## Cron Jobs

### Appointment Reminders

The system automatically sends reminder emails 24 hours before scheduled appointments.

**Cron Schedule:**
- Production: `0 * * * *` (every hour)
- Test mode: `*/5 * * * *` (every 5 minutes)

**Trigger manually:**
```bash
curl http://localhost:3000/api/cron/reminders
```

**Test Mode:**
Set `TEST_SEND_TO_MAIL` in `.env` to enable test mode. All reminders will be sent to this email address for testing.

## Authentication

### Built-in Pages

| Route                       | Description                |
| --------------------------- | -------------------------- |
| `/login`                    | User login                 |
| `/signup`                   | User registration          |
| `/forgot-password`          | Password recovery          |
| `/reset-password?token=xxx` | Password reset             |
| `/verification-pending`     | Email verification pending |
| `/verify-email?token=xxx`   | Email verification         |

### Protected Routes

Routes under `/dashboard` and `/admin` require authentication. Unauthorized users are redirected to `/login`.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Cron
- `GET /api/cron/reminders` - Trigger reminder job
- `GET /api/cron/cleanup` - Run cleanup job

## Database Schema

### Core Models

**User**
- Authentication data (Better Auth)
- Role-based access (USER, ADMIN)
- Soft delete support

**Appointment**
- Title, description, duration
- Start and end datetime
- Status (SCHEDULED, COMPLETED, CANCELLED, NO_SHOW)
- Location and meeting URL
- Reminder tracking

**AuditLog**
- Action tracking (CREATE, UPDATE, DELETE, etc.)
- Entity type and ID
- Changed values (old/new)
- IP address and user agent

**Notification**
- User notifications
- Read/unread status
- Type-based filtering

## Development

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Adding Components

This project uses shadcn/ui for UI components:

```bash
# Add a new component
npx shadcn@latest add button

# Add a new component from registry
npx shadcn@latest add dialog
```

### Feature Development

Features are organized in the `features/` directory following this pattern:

```
features/[feature-name]/
├── api/           # API hooks (TanStack Query)
├── components/    # Feature-specific UI components
├── hooks/         # Custom React hooks
├── lib/           # API and utility functions
└── types/         # TypeScript types
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Cron Jobs on Vercel

Cron jobs are configured in `vercel.ts`:

```typescript
export const config: VercelConfig = {
  crons: [
    { path: "/api/cron/reminders", schedule: "0 * * * *" },
  ],
};
```

### System Cron (Local)

For local development, cron jobs are set up via system crontab:

```bash
# View crontab
crontab -l

# Add cron job
echo "0 * * * * curl https://ap-peter.vercel.app/api/cron/reminders" | crontab -
```

## Testing

### Manual Testing

1. Enable test mode in `.env`:
```bash
TEST_SEND_TO_MAIL=your-email@example.com
TEST_CRON_INTERVAL_MINUTES=5
```

2. Trigger cron manually:
```bash
curl http://localhost:3000/api/cron/reminders
```

3. Check logs:
```bash
tail -f /tmp/cron-reminders.log
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

## License

MIT
