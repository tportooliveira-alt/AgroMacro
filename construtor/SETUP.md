# Construtor — Setup & Development

This directory contains the **Construtor** SaaS project - AI-powered landing page builder for e-books.

## Project Structure

```
construtor/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── auth/            # Auth pages (login, signup)
│   │   ├── dashboard/       # User dashboard (protected)
│   │   ├── editor/          # Visual editor placeholder
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx         # Home page
│   ├── lib/                 # Services (auth, database)
│   ├── __tests__/           # Test files
│   │   ├── unit/           # Unit tests (Jest)
│   │   ├── integration/    # Integration tests
│   │   └── e2e/            # E2E tests (Playwright)
│   └── middleware.ts        # Auth guard middleware
├── .github/
│   └── workflows/
│       └── test.yml        # CI/CD pipeline
├── jest.config.js          # Jest configuration
├── playwright.config.ts    # Playwright E2E config
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── TESTING.md              # Testing documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for production / integration tests)

### Installation

```bash
cd construtor
npm install

cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

npm run dev
```

Open http://localhost:3000 in your browser.

## Testing

```bash
npm test                  # Unit tests
npm run test:coverage    # With coverage report
npm run test:e2e         # E2E tests (requires running server)
npm run test:e2e:ui      # E2E with interactive UI
```

See [TESTING.md](./TESTING.md) for the full testing guide.

## Current Sprint: Sprint 1 (Auth + Database)

### Completed
- Testing infrastructure (Jest + Playwright)
- AuthService with signup/login/logout
- DatabaseService with CRUD operations
- Auth pages (signup, login) with form validation
- Dashboard page with user data and page count
- Middleware for auth guards (protected routes)
- 28 unit tests (100% passing)
- 33 integration tests (pending Supabase)
- 20 E2E tests (pending Playwright browsers)
- GitHub Actions CI/CD

### Next Steps
1. Setup Supabase test instance and run integration tests
2. Install Playwright browsers and run E2E tests
3. Performance benchmarking (Lighthouse)
4. Manual QA testing with test users
5. Approve Sprint 1 → Move to Sprint 2 (Copy Generation)

## Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **Testing**: Jest, Playwright, React Testing Library
- **State**: Zustand
- **HTTP**: Axios

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Claude API (Sprint 2)
ANTHROPIC_API_KEY=

# Flux/Replicate (Sprint 3)
REPLICATE_API_TOKEN=

# ElevenLabs (Sprint 3+)
ELEVENLABS_API_KEY=
```

---

**Version**: 2.0  
**Last Updated**: 2026-05-28  
**Sprint**: 1 (Auth + Database)
