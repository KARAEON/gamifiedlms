# Enterprise Readiness and Go-Live Runbook

## 1) Scope and Release Baseline
This runbook covers go-live readiness for:
- Teacher instructional workflow (mastery gate, reteach, interventions)
- Admin/school-head analytics, policy management, reporting, and audit trail

Out of scope in this release:
- Student-side redesign and student portal expansion

## 2) Environment Requirements
- PHP 8.3+
- Laravel 12
- Node.js 20+
- MySQL 8+ (recommended for production)
- Queue driver configured for your environment (if background jobs are used)
- HTTPS-enabled web server (Nginx/Apache/IIS)

## 3) Pre-Deployment Checklist
- Confirm `.env` has production DB credentials and `APP_DEBUG=false`.
- Confirm app key is set: `php artisan key:generate` (if not already set).
- Confirm storage and cache directories are writable.
- Confirm `barryvdh/laravel-dompdf` is installed and PDF export works.
- Confirm backup process exists for DB and `storage/`.
- Confirm admin credential ownership and password rotation plan.

## 4) Deployment Sequence (Recommended)
1. Put app in maintenance mode:
```bash
php artisan down
```
2. Pull/update code and dependencies:
```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
```
3. Run migrations:
```bash
php artisan migrate --force
```
4. Warm caches:
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
5. Bring app up:
```bash
php artisan up
```

## 5) Data and Migration Checks
After migration, verify these tables exist:
- `grading_policies`
- `audit_logs`
- `mastery_cycles`
- `intervention_assignments`
- `admin_report_submissions`

Also verify admin account exists:
- `admin@glms.test` (or your production admin account)

## 6) Smoke Test (Critical Path)
Use one admin and one teacher account.

### Teacher path
1. Login as teacher.
2. Open `Instructional Flow`.
3. Load a section/topic snapshot.
4. Run `Evaluate and Save Cycle`.
5. Confirm decision is shown (`Proceed` or `Reteach`).
6. If reteach required, log reteach completion.
7. Update at least one intervention status.

Expected:
- Mastery cycle is created.
- Intervention assignments are visible.
- No 500 errors.

### Admin path
1. Login as admin.
2. Open dashboard, policies, reports, audit.
3. Create a grading policy with weights totaling 100.
4. Download class report in CSV.
5. Preview report in browser.
6. Generate report in PDF.
7. Log a report submission.

Expected:
- Policy saves and appears in registry.
- Reports render/download correctly.
- Submission appears in history.
- Audit entries appear for actions.

## 7) UAT Acceptance Criteria
- `AC-01` Teacher progression gate enforces class attainment logic.
- `AC-02` Reteach logging updates cycle state.
- `AC-03` Remediation/enrichment assignments can be updated.
- `AC-04` Admin can view school/class/teacher analytics.
- `AC-05` Admin policy creation fails when weights do not sum to 100.
- `AC-06` Admin reports support CSV/PDF/preview.
- `AC-07` Audit log captures teacher/admin critical actions.

## 8) Operational Monitoring
Track:
- 5xx errors (especially workflow/report endpoints)
- DB migration failures
- Report generation latency
- Audit log write failures

Suggested checks:
- App health endpoint/page load
- Laravel logs (`storage/logs/laravel.log`)
- Web server logs
- DB performance metrics

## 9) Security and Governance
- Restrict admin account creation to controlled process.
- Enforce strong password policy and periodic rotation.
- Ensure least privilege for DB credentials.
- Keep `audit_logs` immutable from UI (view-only for admins).
- Review and archive logs based on retention policy.

## 10) Rollback Plan
If critical regression occurs:
1. Put app in maintenance mode.
2. Restore DB backup to pre-release snapshot.
3. Revert app build to previous release artifact.
4. Clear and rebuild cache:
```bash
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
5. Bring app up and re-run smoke tests on previous version.

## 11) Post-Go-Live (First 7 Days)
- Day 1: verify teacher/admin route usage and report generation.
- Day 2-3: review audit logs for unauthorized access attempts.
- Day 4-5: validate policy-driven thresholds in real class usage.
- Day 6-7: gather stakeholder feedback and issue list for patch release.
