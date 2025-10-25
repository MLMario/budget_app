<!--
SYNC IMPACT REPORT
Version: 1.0.0 → 2.0.0
Rationale: MAJOR version bump - Complete redefinition of core principles based on user-
          provided architecture and security requirements

Modified Principles:
- REMOVED: I. Data Integrity & Validation (replaced by Security-First Architecture)
- REMOVED: II. User-Centric Design (moved to separate section, enhanced)
- REMOVED: III. Privacy & Security (merged into Security-First Architecture)
- REMOVED: IV. Test Coverage (replaced by Test-First Development)
- REMOVED: V. Simplicity & Maintainability (replaced by Cross-Platform Architecture)
- NEW: I. Security-First Architecture (NON-NEGOTIABLE)
- NEW: II. Test-First Development (mandatory, with coverage requirements)
- NEW: III. Mixed Approach to Cross-Platform Architecture
- NEW: IV. Local Development & Testing
- NEW: V. User-Centric Design (enhanced from previous version)

Added Sections:
- Technology Stack section (now concrete: Next.js, Plaid, Claude SDK)

Removed Sections: None

Templates Status:
- ✅ plan-template.md: Compatible with new constitution gates
- ✅ spec-template.md: Aligns with enhanced user-centric requirements
- ✅ tasks-template.md: Supports new testing and security requirements
- ✅ Commands: No agent-specific references found

Follow-up TODOs: None - all placeholders resolved
-->

# Budget App Constitution

## Core Principles

### I. Security-First Architecture (NON-NEGOTIABLE)

Security MUST be architectural, not retrofitted. Financial applications are high-value
targets and require defense-in-depth from the ground up.

**Rules**:
- Financial data MUST be encrypted at rest and in transit (AES-256, TLS 1.3+)
- NO secrets in code - environment variables only
- Input validation and sanitization REQUIRED to prevent SQL injection, XSS
- Secure password hashing REQUIRED (bcrypt or Argon2)
- Security headers MUST be configured (CSP, HSTS, X-Frame-Options)
- Security review REQUIRED before production deployment
- All API endpoints handling financial data MUST implement authentication and
  authorization
- Audit logging MUST be implemented for all data modifications

**Rationale**: Financial apps are high-value targets. Security must be architectural, not
retrofitted. Data breaches can cause severe harm to users and create legal liability.

### II. Test-First Development

Tests prevent bugs that impact user finances. All business logic MUST be covered by
automated tests before production deployment.

**Rules**:
- Unit tests REQUIRED for all business logic (calculations, categorization, spend
  tracking)
- Integration tests REQUIRED for Plaid webhooks and transaction imports
- E2E tests REQUIRED for critical flows (budget CRUD, categorization, AI reports)
- Mock Plaid and Claude SDK for testing
- All tests MUST pass before merge
- Minimum 80% code coverage REQUIRED for business logic
- Compilation MUST succeed before marking task complete (`npm run build`)
- Static analysis MUST pass (ESLint, TypeScript strict mode)

**Code Quality Gates**:

1. **Pre-Commit Checks**:
   - TypeScript compilation (`tsc --noEmit`)
   - ESLint validation (`npm run lint`)
   - All tests pass (`npm test`)
   - No console.log in production code (use proper logging)

2. **Import/Export Validation**:
   - Named imports match named exports
   - Default imports match default exports
   - All imported packages exist in package.json
   - No unused imports (ESLint catches)

3. **Async/Await Validation**:
   - All `createClient()` calls have `await`
   - All async functions have try/catch
   - All promises are handled (no floating promises)
   - ESLint rules: `@typescript-eslint/no-floating-promises`

**Recommended ESLint Config**:
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/require-await": "error",
    "@typescript-eslint/await-thenable": "error",
    "import/no-default-export": ["error", {
      "allow": ["*.config.js", "*.page.tsx", "**/app/**/layout.tsx"]
    }]
  }
}
```

**Rationale**: Financial accuracy is critical. Tests prevent bugs that impact user
finances and provide confidence during refactoring. Code quality gates catch errors
before they reach runtime, reducing debugging time and improving developer experience.

### III. Mixed Approach to Cross-Platform Architecture

Start with a web monolith but maintain clean separation to enable future mobile support
without full rewrite.

**Current Architecture (Now - Web Monolith)**:
- Next.js full-stack application
- Server Actions for client/server bridge ('use server' directive)
- Services for business logic (server-side only)
- Single deployment target

**Future-Ready Guardrails**:
- Business logic MUST be in separate service layer (NOT in UI components)
- Database access MUST use repository pattern (lib/supabase/server.ts)
- Clean separation REQUIRED: UI (app/) → Server Actions (app/actions/) → Services (services/) → Data (lib/)
- TypeScript interfaces MUST define data contracts
- Client components MUST use Server Actions, CANNOT import services directly
- Server Actions MUST be thin wrappers with NO business logic

**Coding Standards for Separation**:

1. **Import Rules**:
   - Client components → Import from `app/actions/*` only
   - Server Actions → Import from `services/*` only
   - Services → Import from `lib/*` and other services only
   - Violation causes: "You're importing a component that needs next/headers"

2. **Export Patterns**:
   - UI components → Named exports (`export function ComponentName`)
   - Pages → Default exports (`export default function PageName`)
   - Services → Named exports (`export async function serviceName`)
   - Server Actions → Named exports with 'use server' directive

3. **Async Patterns**:
   - `createClient()` is async → MUST use `await`
   - Service functions MUST be async and return Promise
   - All database operations MUST use await

**Architecture Layers**:
```
Client Components ('use client')
    ↓ calls
Server Actions ('use server')
    ↓ calls
Services (business logic)
    ↓ calls
Data Layer (Supabase)
```

**Migration Path**: Service layer becomes API when mobile needed (~1-2 weeks refactor)

**Rationale**: Mobile is medium priority. Thoughtful separation enables future mobile
without current overhead of maintaining separate API infrastructure. Coding standards
prevent architectural violations at compile/runtime and maintain clean boundaries between
layers.

### IV. Local Development & Testing

Complete development environment MUST run locally without production dependencies to
enable rapid iteration and confident refactoring.

**Rules**:
- Complete stack MUST run locally (npm run dev or docker-compose up)
- Mock Plaid and Claude SDK for local testing
- Database migrations MUST be reversible and testable
- Seed scripts REQUIRED for realistic test data
- NO production dependencies for core development

**Rationale**: Local-first development enables rapid iteration, confident refactoring,
and reduces friction for new developers joining the project.

### V. User-Centric Design

Features MUST prioritize user experience and accessibility. The application should make
budget tracking simple and intuitive, not add cognitive overhead.

**Rules**:
- User interfaces MUST be intuitive and require minimal training
- Error messages MUST be clear, actionable, and non-technical
- Features MUST support common budget tracking workflows (income tracking, expense
  categorization, goal setting, AI-powered insights)
- The application MUST be responsive and accessible on devices users commonly use
- Loading states and feedback MUST be immediate and clear
- Onboarding flows MUST guide users to first successful action within 2 minutes
- Accessibility standards MUST be met (WCAG 2.1 Level AA minimum)

**Rationale**: Budget tracking tools fail when they're too complex. Users abandon
applications that feel like work rather than helpful tools. Financial wellness requires
consistent engagement, which requires excellent UX.

## Technology Stack

**Language/Framework**: Next.js (TypeScript)
**Backend**: Next.js Server Actions / API Routes
**Storage**: PostgreSQL (or similar relational database with ORM)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E)
**External APIs**: Plaid (bank integration), Claude SDK (AI insights)
**Deployment**: Vercel or similar Next.js-optimized platform
**Architecture**: Web monolith with service layer separation for future mobile support

This stack supports the security-first, test-first, and local development principles
while maintaining simplicity and rapid iteration capability.

## Development Workflow

### Feature Development Process

1. **Specification**: All features MUST have a spec.md documenting user scenarios and
   requirements
2. **Planning**: Complex features MUST have a plan.md with technical design and
   architecture decisions
3. **Test-First**: Write tests FIRST, ensure they FAIL, then implement
4. **Implementation**: Follow tasks.md when generated; work in feature branches
5. **Security Review**: Features handling financial data MUST pass security checklist
6. **Code Review**: All code changes MUST be reviewed for alignment with core principles
7. **Validation**: Features MUST pass all automated tests and manual acceptance criteria

### Constitution Compliance

All feature specifications, plans, and implementations MUST be checked against these core
principles:

- **Security Check**: Does the feature maintain encryption, validation, and secure
  practices?
- **Test Coverage Check**: Are unit, integration, and E2E tests present and passing?
- **Architecture Check**: Is business logic separated from UI? Does it maintain clean
  layering?
- **Local Development Check**: Can the feature be developed and tested entirely locally?
- **User-Centric Check**: Is the UX intuitive, accessible, and does it reduce cognitive
  load?

Violations of principles MUST be documented and justified in plan.md under "Complexity
Tracking."

## Governance

### Amendment Process

This constitution can be amended when:
- Core principles prove insufficient for project needs
- New non-negotiable requirements emerge (e.g., regulatory compliance)
- Team consensus identifies principle conflicts or gaps

**Amendment Requirements**:
1. Document the change rationale
2. Update version following semantic versioning:
   - MAJOR: Principle removal or redefinition (breaking change)
   - MINOR: New principle or section added
   - PATCH: Clarifications, wording improvements
3. Review and update dependent templates (plan, spec, tasks)
4. Update all command files if governance changes affect workflows

### Versioning Policy

- Version format: MAJOR.MINOR.PATCH
- Track ratification and amendment dates
- Breaking changes MUST be clearly documented

### Compliance Review

- Feature specifications MUST reference applicable principles
- Implementation plans MUST include constitution check section with all 5 checks
- Rejected alternatives MUST be documented with principle-based justification
- Security reviews MUST be documented in plan.md before production deployment

**Version**: 2.0.0 | **Ratified**: 2025-10-23 | **Last Amended**: 2025-10-23
