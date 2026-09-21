# Gamified Learning Management and Analytics System

Production-quality web-based LMS and analytics platform for two roles:
- Student
- Teacher
- Admin / School Head

Project directory: `glms/`

Built with Laravel 12 + MySQL + Blade + Livewire 3 + Alpine.js + Tailwind CSS + Chart.js.

## Core Capabilities
- Role-based authentication and redirection (`student`, `teacher`, `admin`)
- Public registration (`/register`) for new student/teacher accounts with profile auto-provisioning
- Student learning experience:
  - Dashboard with performance overview, strongest/weakest topics, trend chart
  - Lesson/topic/activity browsing
  - Gamified activity player (multiple choice, matching, guess word, 4 pics 1 word, visual challenge)
  - Immediate scoring feedback and attempt tracking
  - Score history and progress analytics
- Teacher management and analytics:
  - Student management (search, filter, archive, profile view)
  - Section management and section-level analytics
  - Lesson/topic/activity management
  - Instructional workflow module:
    - competency/class selection
    - mastery evaluation
    - progression gate (80% of class at >=75 mastery)
    - reteach tracking
    - remediation/enrichment assignment tracking
  - Dashboard with intervention-focused metrics and charts
  - Advanced analytics filters (date, student, section, lesson/topic, activity type)
  - Decision-support insights (least mastered topics, below-threshold students, repeated low performance)
- Admin / school-head governance:
  - School/grade/class/teacher analytics dashboard
  - MPS and grade distribution views
  - Weak/mastered competency monitoring
  - Quarterly performance summaries
  - Policy management for grading/mastery thresholds and weights
  - Report workspace (CSV/PDF/preview + submission logging)
  - Audit trail for critical actions
- Reporting:
  - Student report
  - Section report
  - Summary analytics report
  - Preview in web view
  - PDF export (DomPDF integration)
  - CSV export

## Tech Stack
- Laravel 12
- PHP 8.3+ (recommended)
- MySQL 8+
- Blade
- Livewire 3
- Alpine.js
- Tailwind CSS
- Chart.js
- Laravel policies + middleware for authorization
- `barryvdh/laravel-dompdf` for PDF

## Architecture Notes
- `app/Services/AnalyticsService.php`
  - Centralized analytics aggregation for student and teacher dashboards
  - Handles trend, topic mastery, distribution, intervention metrics
- `app/Services/ActivityScoringService.php`
  - Evaluates answers
  - Persists attempts, attempt answers, and score records
- `app/Services/ReportService.php`
  - Builds datasets for student/section/summary reports
  - Logs generated reports
- `app/Services/InstructionalWorkflowService.php`
  - Teacher mastery evaluation and progression decision logic
  - Auto intervention assignment generation
- `app/Services/AdminAnalyticsService.php`
  - School-level aggregation for admin dashboards and reports
- `app/Services/GradingPolicyService.php`
  - Policy resolution for mastery thresholds and component weights
- `app/Services/AuditLogService.php`
  - Centralized action logging for governance and traceability
- Role enforcement:
  - `app/Http/Middleware/EnsureRole.php`
  - Policies in `app/Policies/*`

## Database Schema
Main entities:
- `users` (with role enum and activation flag)
- `student_profiles`
- `teacher_profiles`
- `sections`
- `section_teacher` (teacher-section assignment)
- `lessons`
- `topics`
- `activities`
- `questions`
- `choices`
- `attempts`
- `attempt_answers`
- `score_records`
- `reports`
- `mastery_cycles`
- `intervention_assignments`
- `admin_report_submissions`
- `grading_policies`
- `audit_logs`

## Seeded Demo Data
`DemoDataSeeder` creates:
- 1 admin account
- 1 teacher account
- 3 sections
- 24 student accounts
- Multiple science lessons/topics
- 18+ activities with varied types
- Questions and choices
- Realistic attempts and score history
- Initial generated report record

Demo credentials:
- Admin: `admin@glms.test` / `password123`
- Teacher: `teacher@glms.test` / `password123`
- Student: `student1@glms.test` / `password123`

You can also create a new account from `/register`.

## Setup
1. Install dependencies:
```bash
composer install
npm install
```
2. Configure environment:
```bash
cp .env.example .env
php artisan key:generate
```
3. Update MySQL settings in `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gamified_lms
DB_USERNAME=root
DB_PASSWORD=
```
4. Run migrations and seed:
```bash
php artisan migrate:fresh --seed
```
5. Build frontend:
```bash
npm run dev
```
6. Start app:
```bash
php artisan serve
```

## Important Environment Note
This codebase targets Laravel 12 and PHP 8.3+.
If your local PHP runtime is older, upgrade PHP first to run full installation and tests.

## Directory Highlights
- `app/Http/Controllers/Student/*`
- `app/Http/Controllers/Teacher/*`
- `app/Http/Controllers/Admin/*`
- `app/Livewire/Student/ActivityPlayer.php`
- `app/Livewire/Teacher/AnalyticsExplorer.php`
- `resources/views/student/*`
- `resources/views/teacher/*`
- `resources/views/admin/*`
- `database/seeders/DemoDataSeeder.php`

## Enterprise Operations
- Go-live and rollback runbook: `docs/enterprise-readiness.md`
