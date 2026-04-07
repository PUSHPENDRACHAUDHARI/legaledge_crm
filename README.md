# LegalEdge CRM

LegalEdge CRM is a full-stack, multi-role customer relationship platform built for legal and professional-services teams. It combines CRM operations, marketing execution, sales tracking, service workflows, internal communication, and role-based reporting in one product-style codebase.

The project pairs a React 18 + Vite frontend with a Django REST backend, JWT authentication, team-aware data scoping, email sync flows, and production-oriented backend configuration for PostgreSQL, WhiteNoise, and Gunicorn.

## Project Highlights

- Built as a real product, not a single-feature demo: the app spans CRM, marketing, sales, service, content, admin, and communication workflows.
- Supports three distinct user personas with separate landing experiences: `admin`, `manager`, and `user`.
- Includes a working REST API for contacts, leads, deals, tasks, companies, tickets, calls, meetings, dashboards, notifications, inbox, and user management.
- Implements connected-email workflows with Gmail and Outlook OAuth, plus SMTP fallback for outbound mail.
- Ships with seed data, localStorage import tooling, and cron-friendly inbox sync commands to support onboarding, demos, and operational testing.

## What The Product Does

### Core CRM

- Manage contacts, leads, deals, tasks, companies, tickets, calls, meetings, notes, and recent activity.
- Convert sales activity into role-aware dashboards for admins, managers, and individual contributors.
- Enforce team-based and user-based access rules across records and routes.

### Marketing And Growth

- Track campaigns, ads, forms, events, social activity, buyer intent, and lead-scoring records.
- Store flexible marketing payloads in reusable backend modules to support fast iteration.
- Support content and demand-generation workflows across campaigns, email, forms, events, and social.

### Communication And Inbox

- Send email from inside the app.
- Connect Gmail or Outlook accounts through OAuth.
- Fall back to SMTP when OAuth is not configured.
- Sync inbox threads, sent mail, unread state, and thread grouping.

### Reporting And Operations

- Serve admin, manager, and user dashboard endpoints with KPIs, pipeline summaries, charts, and activity feeds.
- Surface notification feeds and unread counts from recent activity.
- Provide seeded demo users plus sample CRM data for fast local setup.

### Product Surfaces In The Frontend

The frontend exposes workspaces for:

- CRM: Contacts, Companies, Deals, Leads, Tasks, Tickets, Calls, Inbox, Segments
- Marketing: Campaigns, Email, Social, Forms, Lead Scoring, Events
- Sales: Meetings, Sequences, Forecast, Analytics, Sales Workspace, Target Accounts
- Service: Help Desk, Knowledge Base, Feedback, Service Analytics
- Commerce: Quotes, Products, Orders, Invoices, Payments, Subscriptions
- Content: Website Pages, Landing Pages, Blogs, Videos, Podcasts, Case Studies, SEO, Brand, Design Manager
- Data and AI: Data Integration, Data Quality, Breeze Studio, Knowledge Vaults, Prospecting Agent, Customer Agent, Buyer Intent
- Admin: User Management, profile controls, connected apps, added agents, marketplace views

## Architecture

| Layer | Implementation | Responsibility |
| --- | --- | --- |
| Frontend | React 18, React Router, Vite, Chart.js | Multi-role UI, dashboards, CRUD screens, inbox, navigation, charts |
| State | `CRMContext` + local reducer | Store hydration, optimistic updates, refresh cycles, toast messaging |
| API Client | `src/services/api.js` | JWT auth, refresh-token retry, REST wrappers, inbox and notification calls |
| Backend API | Django + Django REST Framework | Auth, CRUD resources, dashboard analytics, email workflows, notifications |
| Auth | Custom Django user model + Simple JWT | Signup, login, profile, password change, role-aware access |
| Data | SQLite for quick local setup, PostgreSQL-ready config for deployment | Persistent CRM, account, marketing, and email records |
| Delivery | WhiteNoise + Gunicorn-ready backend config | Production deployment support |

## Key Backend Modules

| Module | Purpose |
| --- | --- |
| `accounts` | Custom user model, signup/login, JWT profile endpoints, password changes |
| `crm` | CRM entities, dashboards, notifications, inbox, email integration, marketing payload modules |
| `config` | Django settings, URL routing, environment loading, database and static config |
| `crm.management.commands.seed_data` | Seeds demo users and sample CRM records |
| `crm.management.commands.import_localstorage_dump` | Imports browser localStorage exports into backend tables |
| `crm.management.commands.sync_email_inbox` | Cron-friendly inbox synchronization for connected email accounts |

## API Surface

Base API path: `/api`  
Auth base path: `/api/auth`

### Auth

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/login/` | `POST` | Authenticate and return JWT access/refresh tokens |
| `/api/auth/signup/` | `POST` | Create a new user account |
| `/api/auth/me/` | `GET`, `PATCH` | Read or update the current authenticated profile |
| `/api/auth/refresh/` | `POST` | Refresh JWT access token |
| `/api/auth/change-password/` | `POST` | Change the logged-in user's password |

### Dashboards And Admin

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/dashboard/admin/` | `GET` | Admin KPI dashboard |
| `/api/dashboard/manager/` | `GET` | Manager team dashboard |
| `/api/dashboard/user/` | `GET` | Individual contributor dashboard |
| `/api/dashboard/stats/` | `GET` | Aggregate platform stats |
| `/api/dashboard/revenue-chart/` | `GET` | Revenue chart dataset |
| `/api/dashboard/leads-chart/` | `GET` | Lead status chart dataset |
| `/api/dashboard/deals-pipeline/` | `GET` | Pipeline summary by stage |
| `/api/dashboard/recent-activity/` | `GET` | Recent activity feed |
| `/api/users/` | `GET`, `POST` | List or create users |
| `/api/users/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a specific user |

### CRM Resources

Each resource below is exposed through Django REST Framework `ModelViewSet` routes.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/contacts/` | `GET`, `POST` | List or create contacts |
| `/api/contacts/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a contact |
| `/api/leads/` | `GET`, `POST` | List or create leads |
| `/api/leads/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a lead |
| `/api/deals/` | `GET`, `POST` | List or create deals |
| `/api/deals/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a deal |
| `/api/tasks/` | `GET`, `POST` | List or create tasks |
| `/api/tasks/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a task |
| `/api/companies/` | `GET`, `POST` | List or create companies |
| `/api/companies/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a company |
| `/api/tickets/` | `GET`, `POST` | List or create tickets |
| `/api/tickets/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a ticket |
| `/api/calls/` | `GET`, `POST` | List or create call logs |
| `/api/calls/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a call log |
| `/api/meetings/` | `GET`, `POST` | List or create meetings |
| `/api/meetings/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a meeting |
| `/api/activities/` | `GET`, `POST` | List or create activity items |
| `/api/activities/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete an activity item |
| `/api/notes/` | `GET`, `POST` | List or create notes |
| `/api/notes/{id}/` | `GET`, `PATCH`, `DELETE` | Retrieve, update, or delete a note |

### Email, Inbox, And Notifications

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/email/send/` | `POST` | Send email through OAuth, SMTP, or internal delivery |
| `/api/email/sent/` | `GET` | List sent messages |
| `/api/email/accounts/` | `GET` | List connected email accounts |
| `/api/email/connect-url/` | `POST` | Generate Gmail or Outlook OAuth connect URL |
| `/api/email/oauth/{provider}/callback/` | `GET` | Complete OAuth callback flow |
| `/api/email/accounts/{id}/disconnect/` | `POST` | Disconnect an email account |
| `/api/email/sync/` | `POST` | Sync inbox messages for one or more connected accounts |
| `/api/inbox/` | `GET` | List inbox messages |
| `/api/inbox/threads/` | `GET` | List grouped inbox threads |
| `/api/inbox/{id}/read/` | `PATCH` | Mark a message as read |
| `/api/inbox/{id}/` | `DELETE` | Delete an inbox message |
| `/api/notifications/` | `GET` | List notifications |
| `/api/notifications/{id}/read/` | `PATCH` | Mark a notification as read |
| `/api/notifications/mark-all-read/` | `PATCH` | Mark all notifications as read |
| `/api/notifications/unread-count/` | `GET` | Return unread notification count |

### Marketing And Design Payload Modules

These endpoints follow the same collection/detail CRUD pattern as the CRM resources above.

| Endpoint | Purpose |
| --- | --- |
| `/api/marketing-campaigns/` and `/api/marketing-campaigns/{id}/` | Campaign tracking payloads |
| `/api/marketing-ads/` and `/api/marketing-ads/{id}/` | Paid ads payloads |
| `/api/marketing-forms/` and `/api/marketing-forms/{id}/` | Form capture payloads |
| `/api/marketing-events/` and `/api/marketing-events/{id}/` | Event payloads |
| `/api/marketing-social/` and `/api/marketing-social/{id}/` | Social campaign payloads |
| `/api/marketing-buyer-intent/` and `/api/marketing-buyer-intent/{id}/` | Buyer intent payloads |
| `/api/marketing-lead-scoring/` and `/api/marketing-lead-scoring/{id}/` | Lead scoring payloads |
| `/api/design-files/` and `/api/design-files/{id}/` | Design manager file payloads |

## Tech Stack

- Frontend: React 18, React Router, Vite, Chart.js, Font Awesome
- Backend: Django, Django REST Framework, Simple JWT, django-cors-headers
- Data: SQLite for local development, PostgreSQL-ready configuration for production
- Email: Gmail OAuth, Outlook OAuth, SMTP fallback
- Tooling: Vitest, ESLint, Prettier

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+

### Important Setup Note

Use `legaledge_backend/requirements.txt` for the backend install. That is the dependency file that includes the REST and JWT packages used by the running application.

### 1. Install Frontend Dependencies

```bash
npm install
```

If Windows PowerShell blocks `npm` because of execution policy, run the same commands with `npm.cmd` instead, for example:

```powershell
npm.cmd install
```

### 2. Create And Activate A Python Virtual Environment

```bash
python -m venv venv
```

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source venv/bin/activate
```

### 3. Install Backend Dependencies

```bash
pip install -r legaledge_backend/requirements.txt
```

### 4. Configure Backend Environment

Copy the example backend environment file:

```bash
cp legaledge_backend/.env.example legaledge_backend/.env
```

Windows PowerShell:

```powershell
Copy-Item legaledge_backend/.env.example legaledge_backend/.env
```

For the fastest local setup, edit `legaledge_backend/.env` and change:

```env
DJANGO_DEBUG=True
DB_ENGINE=sqlite
FRONTEND_URL=http://127.0.0.1:5173
```

Leave the email and OAuth keys blank until you want to test outbound mail or account connection flows.

### 5. Run Database Migrations

```bash
python manage.py migrate
```

### 6. Seed Demo Data

```bash
python manage.py seed_data
```

### 7. Start The Backend

```bash
python manage.py runserver
```

The Django API will be available at `http://127.0.0.1:8000`.

### 8. Start The Frontend

```bash
npm run dev
```

The Vite app will be available at `http://127.0.0.1:5173`.

The frontend is already configured to proxy `/api` requests to `http://127.0.0.1:8000`.

## Demo Credentials

After running `python manage.py seed_data`, you can log in with:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `shailesh@legaledge.in` | `Admin@123` |
| Manager | `arjun@legaledge.in` | `Manager@123` |
| User | `priya@legaledge.in` | `User@123` |

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend development server |
| `npm run build` | Create a production frontend build |
| `npm run test` | Run the Vitest suite |
| `npm run lint` | Run frontend linting |
| `python manage.py check` | Validate Django project configuration |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py seed_data` | Seed demo users and CRM records |
| `python manage.py import_localstorage_dump --input <file>` | Import browser localStorage data into backend tables |
| `python manage.py sync_email_inbox` | Sync connected email inboxes |

## Project Structure

```text
.
|-- src/                      # React application, routes, pages, layouts, services, context
|-- public/                   # Static frontend assets
|-- legaledge_backend/
|   |-- accounts/             # Custom user model and auth APIs
|   |-- crm/                  # CRM models, dashboards, email, notifications, marketing APIs
|   |-- config/               # Django settings and URL configuration
|   |-- .env.example          # Backend environment template
|-- manage.py                 # Root Django entrypoint
|-- package.json              # Frontend scripts and dependencies
|-- vite.config.js            # Vite config with `/api` proxy
```

## Production Readiness

- JWT-based authentication with refresh-token support
- Role-based route protection and backend queryset scoping
- PostgreSQL-ready database configuration via environment variables
- WhiteNoise and Gunicorn-ready backend dependencies
- Dedicated API client with retry and error-normalization logic
- Buildable Vite frontend with chunk splitting already configured

## Why This Project Stands Out

LegalEdge CRM showcases more than CRUD screens. It demonstrates product thinking across authentication, role-based UX, analytics, communications, team workflows, extensible backend modeling, and production deployment concerns. For recruiters and engineering teams, it reads as a practical full-stack SaaS application rather than a narrow coding exercise.
