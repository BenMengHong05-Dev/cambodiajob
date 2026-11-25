# CambodiaJobs

CambodiaJobs is a bilingual (Khmer & English) recruitment and career platform built with a React + TypeScript frontend and a Django REST Framework backend backed by MySQL. It connects job seekers, verified employers, and platform administrators across Cambodia with AI career tools, interview scheduling, and role-based access control.
## Screenshots

<img width="1917" height="875" alt="image" src="https://github.com/user-attachments/assets/00dd2d63-133c-4ed5-97d1-2cc99dc8597a" /><img width="1917" height="876" alt="image" src="https://github.com/user-attachments/assets/eef9ee35-dcec-4747-af52-d2612251d7e4" />



## Features

- **Job Seeker portal:** search and filter jobs by category, province, workplace type, employment type, and salary; bookmark vacancies; manage career profile, education, work experience, skills, and CV/resume uploads; apply for jobs and track application and interview status.
- **Employer portal:** create and manage company profiles, verification documents (business license / National ID), team members (`employer_members`), and job vacancies (with TinyMCE rich-text descriptions and AI job description generation); review candidate applications, export applicants to Excel (`.xlsx`), update pipeline statuses, and schedule/cancel interviews.
- **Admin console:** dashboard with KPI metrics and analytics charts, company verification queue, job moderation and editing, platform-wide candidate applications inspector (`/admin/applications`), job category management, user & RBAC role/permission management, audit logs, and site branding/announcement settings.
- **Public browsing:** visitors can explore jobs, companies, categories, and locations without signing in. Sign in to save jobs, submit applications, or manage company/admin workflows.
- **Location & interactive map picker:** in-person interview scheduling includes a Leaflet + OpenStreetMap picker with search, geolocation, and reverse geocoding; notification details embed a map preview and an **Open in Google Maps** link.
- **Video interviews:** supports pasting/generating Google Meet links (`GOOGLE_MEET_REFRESH_TOKEN` via Google Calendar API or `meet.google.com/new`).
- **AI Career & Recruitment Assistant:** integrated Gemini / DeepSeek AI service for job search assistance, salary/skill insights, candidate matching, and employer job post generation (`/api/v1/ai/`).
- **Language and theme preferences:** Khmer (`km`, default) and English (`en`) via `i18next`, with Light and Dark themes persisted in `localStorage`.
- **Notifications:** real-time-synced in-app notifications with unread badges for user actions (sign-in, sign-out, password change, profile/CV updates, job publishing, applications, status changes, and interviews) plus HTML email notifications (`email_logs`).
- **Custom RBAC & JWT authentication:** custom JWT access/refresh tokens with refresh token rotation, revocation, Google OAuth 2.0 sign-in, and granular permissions (`admin:access`, `moderate:jobs`, `verify:companies`, `manage:users`, etc.).

## Stack

- **Backend:** Python 3.10+, Django 5.2, Django REST Framework, PyJWT / SimpleJWT, PyMySQL, Pillow, and MySQL.
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Axios, i18next, Lucide Icons, Leaflet, TinyMCE, and SheetJS (`xlsx`).

## Quick start

### 1. Database setup (MySQL)

Create the database and load the SQL schema, indexes, and sample seed data:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS cambodia_jobs_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p cambodia_jobs_db < backend/sql/schema.sql
mysql -u root -p cambodia_jobs_db < backend/sql/indexes.sql
mysql -u root -p cambodia_jobs_db < backend/sql/seed.sql
```

### 2. Backend setup

From `backend/`, create a virtual environment, install dependencies, configure `.env`, and run the server:

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\activate
# macOS / Linux
# source venv/bin/activate

pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and update your MySQL, JWT, AI, and Google OAuth credentials, then run:

```bash
python manage.py check
python manage.py runserver 0.0.0.0:8000
```

### 3. Frontend setup

From `frontend/`, install packages, configure `.env`, and start Vite:

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`, verify `VITE_API_BASE_URL` matches your backend URL (e.g. `http://127.0.0.1:8000/api/v1`), and start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo accounts

Default quick-fill demo accounts shown on `/login` are configured via `frontend/.env`:

| Role | Email | Password | Portal |
| --- | --- | --- | --- |
| Admin | `admin@gmail.com` | `Password123!` | `/admin/dashboard` |
| Employer | `employees@gmail.com` | `Password123!` | `/employer/dashboard` |
| Seeker | `jobseeker@gmail.com` | `Password123!` | `/seeker/dashboard` |

Change or remove `VITE_DEMO_*` variables and demo account passwords before deploying to production.

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `DEBUG` | `True` | Django debug mode (`False` in production). |
| `SECRET_KEY` | — | Django cryptographic secret key. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hostnames accepted by Django. |
| `DB_NAME` | `cambodia_jobs_db` | MySQL database name. |
| `DB_USER` | `root` | MySQL username. |
| `DB_PASSWORD` | — | MySQL password. |
| `DB_HOST` | `127.0.0.1` | MySQL host address. |
| `DB_PORT` | `3306` | MySQL port. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed for CORS. |
| `JWT_SECRET_KEY` | `SECRET_KEY` | Signing secret for JWT access and refresh tokens. |
| `JWT_ACCESS_EXPIRATION_MINUTES` | `60` | Access token lifetime in minutes. |
| `JWT_REFRESH_EXPIRATION_DAYS` | `7` | Refresh token lifetime in days. |
| `TIME_ZONE` | `Asia/Phnom_Penh` | Server timezone. |
| `EMAIL_BACKEND` | `django.core.mail.backends.console.EmailBackend` | Use `django.core.mail.backends.smtp.EmailBackend` in production. |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server host. |
| `EMAIL_PORT` | `587` | SMTP port. |
| `EMAIL_USE_TLS` | `True` | Enable TLS for SMTP. |
| `EMAIL_HOST_USER` | empty | SMTP account email. |
| `EMAIL_HOST_PASSWORD` | empty | SMTP password / app password. |
| `DEFAULT_FROM_EMAIL` | `CambodiaJobs <no-reply@cambodiajobs.kh>` | Default sender address for notification emails. |
| `AI_MODEL` | `gemini` | AI provider (`gemini` or `deepseek`). |
| `AI_API_KEY` | empty | API key for Gemini or DeepSeek (`GEMINI_API_KEY` / `DEEPSEEK_API_KEY` also supported). |
| `AI_BASE_URL` | empty | Optional custom AI endpoint override. |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth 2.0 client ID. |
| `GOOGLE_CLIENT_SECRET` | empty | Google OAuth 2.0 client secret. |
| `GOOGLE_REDIRECT_URI` | `http://127.0.0.1:8000/api/v1/auth/google/callback/` | Authorized Google OAuth callback URI. |
| `GOOGLE_MEET_REFRESH_TOKEN` | empty | Optional Google Calendar OAuth refresh token for automatic Google Meet creation. |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend origin used for OAuth redirects and email links. |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | Backend API base URL. |
| `VITE_ASSET_BASE_URL` | `http://127.0.0.1:8000` | Backend media/asset origin for avatars, logos, banners, and CVs. |
| `VITE_DEMO_ADMIN_EMAIL` | `admin@gmail.com` | Optional demo admin button email on `/login`. |
| `VITE_DEMO_EMPLOYER_EMAIL` | `employees@gmail.com` | Optional demo employer button email on `/login`. |
| `VITE_DEMO_SEEKER_EMAIL` | `jobseeker@gmail.com` | Optional demo seeker button email on `/login`. |
| `VITE_DEMO_PASSWORD` | `Password123!` | Shared password autofilled by demo login buttons. |

## API modules

All backend APIs are mounted under `/api/v1/` in `backend/config/urls.py`:

| Prefix | App | Purpose |
| --- | --- | --- |
| `/api/v1/auth/` | `apps.accounts` | Register, login, Google OAuth, token refresh, logout, profile, password change |
| `/api/v1/jobs/` & `/api/v1/employer/jobs/` | `apps.jobs` | Public job search/details, bookmarks, employer CRUD & status updates |
| `/api/v1/companies/` & `/api/v1/employer/` | `apps.companies` | Company directory, employer profile, uploads, company members |
| `/api/v1/categories/`, `/api/v1/locations/`, `/api/v1/skills/` | Catalogs | Job categories, Cambodia provinces/cities, skills taxonomy |
| `/api/v1/seeker/`, `/api/v1/seeker/resumes/` | `apps.seeker_profiles`, `apps.resumes`, `apps.saved_jobs` | Candidate profile, education, experience, CVs, saved jobs |
| `/api/v1/applications/` & `/api/v1/interviews/` | `apps.applications`, `apps.interviews` | Job applications, pipeline status updates, interview scheduling, Google Meet |
| `/api/v1/notifications/` | `apps.notifications` | In-app notifications list, mark read, delete |
| `/api/v1/ai/` | `apps.ai_agent` | AI chat assistant, analytics insights, and job post generation |
| `/api/v1/admin/` & `/api/v1/site-settings/` | `apps.audit_logs` | Admin KPIs, user/company/job/application moderation, RBAC, audit logs, site settings |

## Useful commands

### Backend checks & tests

```bash
cd backend
python manage.py check
python manage.py test
```

### Frontend lint & production build

```bash
cd frontend
npm run lint
npm run build
```

### Production deployment (Ubuntu / Nginx + systemd)

Pull updates, rebuild the frontend static bundle (`frontend/dist`), and restart the Django/Gunicorn service:

```bash
cd /opt/apps/cambodiajob && git pull && cd frontend && npm install && npm run build && cd .. && sudo systemctl restart cambodiajob-api.service
```

Serve `frontend/dist` with Nginx and proxy `/api` and `/media` to the Django/Gunicorn backend on port `8000`.

## Project layout

```text
backend/
  apps/        Modular Django apps (accounts, jobs, companies, applications, interviews, notifications, ai_agent, audit_logs, ...)
  common/      Raw SQL database helpers, custom JWT authentication, RBAC permissions, pagination, validators
  config/      Django settings and URL routing
  media/       Uploaded company logos, banners, avatars, and candidate resumes
  sql/         MySQL schema.sql, indexes.sql, and seed.sql
frontend/
  public/      Static assets
  src/
    app/       Router, providers (auth, theme, language, site settings, toast)
    components/ UI primitives, layouts, navbar, notification bell, map picker
    features/  Feature pages for public, auth, seeker, employer, and admin portals
    locales/   English and Khmer i18next translations
    services/  Axios API client and domain service modules
```
