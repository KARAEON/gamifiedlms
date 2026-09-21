# UAT Sign-Off Pack (Teacher + Admin Scope)

## 1) Document Control
- Project: Gamified LMS + Assessment Analytics + Class Record
- UAT Scope: Teacher workflows and Admin/School Head workflows only
- Version: 1.0
- Prepared Date: 2026-04-13

## 2) UAT Objective
Validate that the implemented to-be workflow is functionally correct, usable, and ready for operational deployment for:
- Teacher instructional cycle
- Admin analytics, governance, reporting, and intervention decision support

## 3) UAT Entry Criteria
- Latest migrations executed successfully.
- Seed/demo data available or equivalent prepared test data.
- Teacher and admin accounts active.
- Critical routes accessible:
  - `/teacher/workflow`
  - `/admin/dashboard`
  - `/admin/policies`
  - `/admin/reports`
  - `/admin/audit`
- No blocking environment errors.

## 4) UAT Exit Criteria
- All `Critical` and `High` test cases passed.
- No open `Critical` defects.
- `High` defects either fixed or approved with mitigation.
- Signed approval from Academic Lead and School Head/Administrator.

## 5) Test Environment
- Application URL: __________________
- Browser(s): ______________________
- DB Environment: __________________
- Build/Release Tag: _______________
- Test Start Date: _________________
- Test End Date: ___________________

## 6) Roles and Responsibilities
- UAT Lead: plans test schedule and consolidates results
- Teacher Evaluator(s): executes teacher-side scenarios
- Admin Evaluator(s): executes admin-side scenarios
- Technical Support: resolves defects and deploys fixes
- Sign-Off Authority: School Head / Project Adviser

## 7) UAT Test Cases

| TC ID | Role | Scenario | Steps (Summary) | Expected Result | Priority | Status | Tester | Date | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| UAT-TCH-001 | Teacher | Login and access workflow page | Login as teacher and open `/teacher/workflow` | Page loads with section/topic filters and metrics cards | Critical |  |  |  |  |
| UAT-TCH-002 | Teacher | Evaluate mastery cycle | Select section/topic and run evaluation | Mastery cycle saved; decision shown (`Proceed` or `Reteach`) | Critical |  |  |  |  |
| UAT-TCH-003 | Teacher | 80/75 gate behavior | Use data where class attainment >=80 at mastery >=75 | Decision is `Proceed to next lesson` | Critical |  |  |  |  |
| UAT-TCH-004 | Teacher | Reteach enforcement | Use data below threshold; log reteach | Decision `Reteach`; after logging, cycle updates with strategy and attempt count | High |  |  |  |  |
| UAT-TCH-005 | Teacher | Intervention auto-assignment | Save cycle with mixed low/high performers | Remediation and enrichment assignments auto-created | High |  |  |  |  |
| UAT-TCH-006 | Teacher | Intervention status update | Update assignment status to `completed` | Status and notes saved successfully | High |  |  |  |  |
| UAT-TCH-007 | Teacher | Activity phase classification | Create activities with gamified/formative/summative phase | Activity list and filters show correct workflow phase | Medium |  |  |  |  |
| UAT-TCH-008 | Teacher | Policy-aware thresholds | Run workflow where active policy differs from defaults | Snapshot reflects active policy thresholds and weights | High |  |  |  |  |
| UAT-ADM-001 | Admin | Login and dashboard access | Login as admin and open `/admin/dashboard` | Dashboard loads school/class/teacher analytics | Critical |  |  |  |  |
| UAT-ADM-002 | Admin | Analytics drill-down filters | Apply section/teacher/subject/date filters | Dashboard metrics/tables refresh consistently | High |  |  |  |  |
| UAT-ADM-003 | Admin | Policy creation validation | Create policy where weights do not total 100 | Validation blocks save | High |  |  |  |  |
| UAT-ADM-004 | Admin | Policy creation success | Create valid policy (weights total 100) | Policy saved and appears in registry | Critical |  |  |  |  |
| UAT-ADM-005 | Admin | Policy update success | Edit existing policy and save | Updated values persist and take effect | High |  |  |  |  |
| UAT-ADM-006 | Admin | Report export CSV | Generate admin report with CSV format | Download returns valid CSV | Critical |  |  |  |  |
| UAT-ADM-007 | Admin | Report export PDF | Generate admin report with PDF format | Download returns PDF with tabular content | High |  |  |  |  |
| UAT-ADM-008 | Admin | Report preview | Generate admin report with preview mode | Browser preview renders correct headers/rows | Medium |  |  |  |  |
| UAT-ADM-009 | Admin | Report submission logging | Log submission from report workspace | Submission appears in history list | High |  |  |  |  |
| UAT-ADM-010 | Admin | Audit trail visibility | Open `/admin/audit` and filter logs | Critical events visible with action/entity/time | High |  |  |  |  |
| UAT-SEC-001 | Access Control | Role protection (teacher to admin route) | Login as teacher and visit `/admin/dashboard` | Access denied (403) | Critical |  |  |  |  |
| UAT-SEC-002 | Access Control | Role protection (admin to teacher workflow) | Login as admin and visit restricted teacher route | Access follows role policy design | High |  |  |  |  |

## 8) Defect Severity Matrix
- Critical: blocks core flow; no workaround; go-live blocker.
- High: major function wrong; workaround limited; must resolve or formally defer.
- Medium: function works with minor issue; acceptable with scheduled patch.
- Low: cosmetic/non-blocking.

## 9) Defect Log Template
Use: `docs/templates/uat-defect-log.csv`

Minimum fields:
- Defect ID
- Linked TC ID
- Module
- Severity
- Summary
- Steps to Reproduce
- Actual vs Expected
- Status
- Owner
- Target Fix Date
- Retest Result

## 10) Sign-Off Sheet Template
Use: `docs/templates/uat-signoff-sheet.csv`

Required approvals:
- UAT Lead
- Teacher Representative
- Admin/School Head Representative
- Technical Lead
- Project Adviser / Final Approver

## 11) Final UAT Recommendation
- UAT Decision: `Pass` / `Pass with Conditions` / `Fail`
- Production Deployment Recommendation: `Go` / `No-Go`
- Notes: _____________________________________________
