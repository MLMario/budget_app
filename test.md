

# Budget App Constitution - Concise Version
TEST
**I. Security-First Architecture (NON-NEGOTIABLE)**
- Financial data encrypted at rest and in transit (AES-256, TLS 1.3+)
- No secrets in code - environment variables only
- Input validation and sanitization required (prevent SQL injection, XSS)
- Secure password hashing (bcrypt/Argon2)
- Security headers configured (CSP, HSTS, X-Frame-Options)
- Security review REQUIRED before production deployment

Rationale: Financial apps are high-value targets. Security must be architectural, not retrofitted.

**II. Test-First Development**
- Unit tests for all business logic (calculations, categorization, spend tracking)
- Integration tests for Plaid webhooks and transaction imports
- E2E tests for critical flows (budget CRUD, categorization, AI reports)
- Mock Plaid and Claude SDK for testing
- All tests pass before merge
- Minimum 80% code coverage for business logic

Rationale: Financial accuracy is critical. Tests prevent bugs that impact user finances.

**III. Mixed Approach to Cross-Platform Architecture**

Now - Web Monolith:
- Next.js full-stack application
- Server actions/API routes for backend
- Single deployment target

Future-Ready Guardrails:
- Business logic in separate service layer (not in UI components)
- Database access via repository pattern/ORM
- Clean separation: /services (logic) → /repositories (data) → /app (UI)
- TypeScript interfaces define data contracts

Migration Path: Service layer becomes API when mobile needed (~1-2 weeks refactor) Rationale: Mobile is medium priority. Thoughtful separation enables future mobile without current overhead.

**IV. Local Development & Testing**
- Complete stack runs locally (npm run dev or docker-compose up)
- Mock Plaid and Claude SDK for local testing
- Database migrations reversible and testable
- Seed scripts for realistic test data
- No production dependencies for core development

Rationale: Local-first development enables rapid iteration and confident refactoring.


 User Stories  : 
[P1] Users must be able to create secure accounts (two step email verification), No need for session persistance between loggins 
[P1] User need to be able to create budgets and edit them at any time. this budget shoudl have categories, planned spend and actual spend
[P1] Users need to be able to import bank and credit card transaction connecting them to our app using Plaid api services. 
[P1] User should be able to select transactions to ignore (not include into spend) and manually add transactions. 
[P1] Users spend should be automatically calculated from their imported and manually added transactions
[P1] Users should be able to see their current month budget and past months budget. 
[P1] Users  should be able to 


# Prompt to build desingns: 

Current Problem with budget Apps:
- Currently, budgeting application tend to be ver reactive, meaning that users don't really get good insights or notifications un they are close or over their budget limits. 
- In addition, budget apps are not really capable of making good suggestions to users as to how to improve their spending habits to reach thier goals while at the same time taking into account their own preference and constrains. 
- For example, it might be easy to say that you should decrease your highest spend for a 3 children family of 6,000 dollars for a family. But a family might have a strong preference to maintain that spend despite being the highest because of parent work goals or lifestyle preference, so a recommendation like that is not usefu.. 

Based on this problem I want to create an app  that: 

An user can create their own secure account, that they can use to import transaction from their bank account and credit cards as well as create a current and future months budget by categories. The app should automatically categorize and track that spend and income for all transactions, unless the user tags a transaction as ignored.  They should also have the ability to reclasify their transactions auto selected category 

In addition, the app should have an AI workflow that has the capabilities to address the current budget apps problems: 
- On Monthly basis, the AI should be able to access a machine to run python and perform analysis on the user budget to come up of recommendations on how to reduce spend (by default) or how achieve their stated goals. This would be a past looking report
- On weekly basis the AI should be able to access a machine to run python and perform analysis to asses if the user is on track to hit their goals, if not they should make suggestion on how to reach their end of month spend goal based on user stated preferences
- The user should be able to input their preferences: 
- On their transactions, they should be able to tagged them as non-negotiable (transaction they cannot reduce spend) 
- They should have a place to add their goals and prefences for the AI to take into account, this should be a place where they can type this preferences.  

I would like you to write three design.md files with proposal oh the web design from a user experience perspective based on the problems we are trying to solve (those are current problem with budget apps) and app I want to create. 

By web design I do not mean the architecture or sepcs, I literally mean the visual design structure. How will the experience be structured and how that translate into different screens and action bottoms are relevant to understand in this design