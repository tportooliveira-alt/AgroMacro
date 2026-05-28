# Construtor — AI Page Builder SaaS

AI-powered landing page builder focused on e-books, with multi-provider IA orchestration and native Kiwify/Hotmart integration.

**Stack**: Next.js 14 + Supabase + Puck Editor + Claude + Flux + ElevenLabs

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Claude API key

### Installation

```bash
cd construtor
npm install

cp .env.local.example .env.local
# Edit .env.local with your API keys

npm run dev
```

Open http://localhost:3000 in your browser.

---

## Project Structure

```
construtor/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── auth/            # Auth pages (login, signup)
│   │   ├── dashboard/       # User dashboard
│   │   ├── editor/          # Visual editor (Sprint 4)
│   │   └── page.tsx         # Home page
│   ├── lib/                 # Services
│   │   ├── supabase.ts      # Supabase client
│   │   ├── auth.service.ts  # Auth operations
│   │   └── database.service.ts
│   ├── __tests__/           # Tests (unit, integration, e2e)
│   └── middleware.ts        # Next.js auth guard
├── jest.config.js
├── playwright.config.ts
├── package.json
└── TESTING.md
```

---

## Features (MVP)

**Sprint 1: Auth + Database (Implementation Complete)**
- [x] **Home page** with feature overview
- [x] **Auth pages** (signup & login UI)
- [x] **AuthService** with Supabase integration
- [x] **DatabaseService** with CRUD operations
- [x] **Dashboard page** with user data
- [x] **Middleware** for protected routes
- [x] **Test infrastructure** (Jest + Playwright)
- [x] **70+ test cases** (28 unit, 33 integration, 20 E2E)

**Sprint 2: Copy Generation**
- [ ] Landing page generation (Claude API)
- [ ] Rate limiting (1 LP/free tier)
- [ ] Quality scoring (AI-generated content)

**Sprint 3: Image Generation**
- [ ] Image generation (Flux)
- [ ] Visual quality validation

**Sprint 4: Puck Editor**
- [ ] Visual editor fully functional

**Sprint 5: Checkout**
- [ ] Kiwify/Stripe checkout integration
- [ ] Pricing tiers: Free, Pro (R$49/mo), Agency (R$199/mo)

---

## Database Schema

### Users Table
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
plan TEXT ('free', 'pro', 'agency')
created_at TIMESTAMP
```

### Landing Pages Table
```sql
id UUID PRIMARY KEY
user_id UUID FOREIGN KEY
title TEXT
content JSONB
published BOOLEAN
created_at TIMESTAMP
```

---

## Testing (Sprint 1)

**Test Coverage**: 70+ test cases across 3 levels
- **Unit Tests**: 28 cases (AuthService, DatabaseService) — **28/28 passing**
- **Integration Tests**: 33 cases (Supabase flows, RLS policies) — requires Supabase
- **E2E Tests**: 20 cases (UI flows, form validation, auth guards) — requires Playwright browsers

```bash
npm test                # Run unit tests
npm run test:coverage  # With coverage report
npm run test:e2e        # E2E tests (needs running dev server)
```

See [TESTING.md](./TESTING.md) for detailed testing guide.

---

## Status

**Sprint 1**: 🟡 Implementation complete, awaiting full test execution  
**Next milestone**: Sprint 1 approval → Sprint 2 (Copy Generation with Claude API)  
**Target launch**: June 2026
