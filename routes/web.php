<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\StudentAccessController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\AuditController as AdminAuditController;
use App\Http\Controllers\Admin\PolicyController as AdminPolicyController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\SchoolTermController as AdminSchoolTermController;
use App\Http\Controllers\DashboardRedirectController;
use App\Http\Controllers\AppearanceController;
use App\Http\Controllers\Student\ActivityController as StudentActivityController;
use App\Http\Controllers\Student\DashboardController as StudentDashboardController;
use App\Http\Controllers\Student\GradingController as StudentGradingController;
use App\Http\Controllers\Student\LessonController as StudentLessonController;
use App\Http\Controllers\Student\PhaserResultController as StudentPhaserResultController;
use App\Http\Controllers\Student\ProfileController as StudentProfileController;
use App\Http\Controllers\Student\ProgressController as StudentProgressController;
use App\Http\Controllers\Student\ScoreController as StudentScoreController;
use App\Http\Controllers\Teacher\ActivityController as TeacherActivityController;
use App\Http\Controllers\Teacher\AiInsightController as TeacherAiInsightController;
use App\Http\Controllers\Teacher\AnalyticsController as TeacherAnalyticsController;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboardController;
use App\Http\Controllers\Teacher\GradingController as TeacherGradingController;
use App\Http\Controllers\Teacher\InsightsController as TeacherInsightsController;
use App\Http\Controllers\Teacher\LessonController as TeacherLessonController;
use App\Http\Controllers\Teacher\ProfileController as TeacherProfileController;
use App\Http\Controllers\Teacher\ReportController as TeacherReportController;
use App\Http\Controllers\Teacher\ScoreController as TeacherScoreController;
use App\Http\Controllers\Teacher\SectionController as TeacherSectionController;
use App\Http\Controllers\Teacher\StudentController as TeacherStudentController;
use App\Http\Controllers\Teacher\TopicController as TeacherTopicController;
use App\Http\Controllers\Teacher\WorkflowController as TeacherWorkflowController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'landing')->name('landing');

Route::middleware(['guest', 'canonical.auth-host'])->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::prefix('student')->as('student.access.')->group(function (): void {
        Route::get('/login', [StudentAccessController::class, 'createLogin'])->name('create');
        Route::post('/login', [StudentAccessController::class, 'storeLogin'])->name('store');
    });
    Route::get('/join', [StudentAccessController::class, 'createJoin'])->name('student.join.create');
    Route::post('/join/verify', [StudentAccessController::class, 'verifyJoinCode'])->name('student.join.verify');
    Route::post('/join', [StudentAccessController::class, 'storeJoin'])->name('student.join.store');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
});

Route::middleware('auth')->group(function (): void {
    Route::match(['get', 'post'], '/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/dashboard', DashboardRedirectController::class)->name('dashboard');
});

Route::middleware(['auth', 'role:teacher,admin'])->prefix('settings')->as('settings.')->group(function (): void {
    Route::get('/appearance', [AppearanceController::class, 'edit'])->name('appearance');
    Route::patch('/appearance', [AppearanceController::class, 'update'])->name('appearance.update');
});

Route::middleware(['auth', 'role:student'])->prefix('student')->as('student.')->group(function (): void {
    Route::get('/dashboard', StudentDashboardController::class)->name('dashboard');
    Route::get('/lessons', [StudentLessonController::class, 'index'])->name('lessons.index');
    Route::get('/lessons/{lesson}', [StudentLessonController::class, 'show'])->name('lessons.show');
    Route::get('/activities/{activity}', [StudentActivityController::class, 'show'])->name('activities.show');
    Route::post('/phaser-results', [StudentPhaserResultController::class, 'store'])->name('phaser-results.store');
    Route::get('/scores', [StudentScoreController::class, 'index'])->name('scores.index');
    Route::get('/grading', StudentGradingController::class)->name('grading.index');
    Route::get('/progress', [StudentProgressController::class, 'index'])->name('progress.index');
    Route::get('/profile', [StudentProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [StudentProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'role:teacher'])->prefix('teacher')->as('teacher.')->group(function (): void {
    Route::get('/dashboard', TeacherDashboardController::class)->name('dashboard');

    Route::get('/students', [TeacherStudentController::class, 'index'])->name('students.index');
    Route::post('/students', [TeacherStudentController::class, 'store'])->name('students.store');
    Route::get('/students/{student}', [TeacherStudentController::class, 'show'])->name('students.show');
    Route::patch('/students/{student}', [TeacherStudentController::class, 'update'])->name('students.update');
    Route::patch('/students/{student}/archive', [TeacherStudentController::class, 'archive'])->name('students.archive');
    Route::get('/scores', [TeacherScoreController::class, 'index'])->name('scores.index');
    Route::get('/grading', [TeacherGradingController::class, 'index'])->name('grading.index');
    Route::post('/grading', [TeacherGradingController::class, 'store'])->name('grading.store');

    Route::get('/sections', [TeacherSectionController::class, 'index'])->name('sections.index');
    Route::post('/sections', [TeacherSectionController::class, 'store'])->name('sections.store');
    Route::get('/sections/{section}', [TeacherSectionController::class, 'show'])->name('sections.show');
    Route::patch('/sections/{section}/phaser-locks', [TeacherSectionController::class, 'updatePhaserLocks'])->name('sections.phaser-locks.update');
    Route::patch('/sections/{section}', [TeacherSectionController::class, 'update'])->name('sections.update');

    Route::get('/lessons', [TeacherLessonController::class, 'index'])->name('lessons.index');
    Route::post('/lessons', [TeacherLessonController::class, 'store'])->name('lessons.store');
    Route::patch('/lessons/{lesson}', [TeacherLessonController::class, 'update'])->name('lessons.update');
    Route::post('/topics', [TeacherTopicController::class, 'store'])->name('topics.store');
    Route::patch('/topics/{topic}', [TeacherTopicController::class, 'update'])->name('topics.update');

    Route::get('/activities', [TeacherActivityController::class, 'index'])->name('activities.index');
    Route::post('/activities', [TeacherActivityController::class, 'store'])->name('activities.store');
    Route::patch('/activities/{activity}', [TeacherActivityController::class, 'update'])->name('activities.update');
    Route::post('/activities/{activity}/questions', [TeacherActivityController::class, 'addQuestion'])->name('activities.questions.store');
    Route::patch('/activities/{activity}/question-bank', [TeacherActivityController::class, 'updateBank'])->name('activities.question-bank.update');
    Route::patch('/questions/{question}', [TeacherActivityController::class, 'updateQuestion'])->name('questions.update');
    Route::delete('/questions/{question}', [TeacherActivityController::class, 'deleteQuestion'])->name('questions.destroy');

    Route::get('/analytics', [TeacherAnalyticsController::class, 'index'])->name('analytics.index');
    Route::get('/insights', TeacherInsightsController::class)->name('insights.index');
    Route::get('/insights/ai/generate', TeacherAiInsightController::class)->name('insights.ai.generate');

    Route::get('/reports', [TeacherReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/generate', [TeacherReportController::class, 'generate'])->name('reports.generate');
    Route::post('/reports/{report}/submit-school-head', [TeacherReportController::class, 'submitToSchoolHead'])->name('reports.submit_school_head');
    Route::get('/workflow', [TeacherWorkflowController::class, 'index'])->name('workflow.index');
    Route::post('/workflow/evaluate', [TeacherWorkflowController::class, 'evaluate'])->name('workflow.evaluate');
    Route::post('/workflow/{cycle}/reteach', [TeacherWorkflowController::class, 'logReteach'])->name('workflow.reteach');
    Route::patch('/workflow/interventions/{intervention}', [TeacherWorkflowController::class, 'updateIntervention'])->name('workflow.interventions.update');

    Route::get('/profile', [TeacherProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [TeacherProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'role:admin'])->prefix('admin')->as('admin.')->group(function (): void {
    Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
    Route::get('/school-term', [AdminSchoolTermController::class, 'index'])->name('school-term.index');
    Route::patch('/school-term', [AdminSchoolTermController::class, 'update'])->name('school-term.update');
    Route::get('/audit', [AdminAuditController::class, 'index'])->name('audit.index');
    Route::get('/policies', [AdminPolicyController::class, 'index'])->name('policies.index');
    Route::post('/policies', [AdminPolicyController::class, 'store'])->name('policies.store');
    Route::patch('/policies/{policy}', [AdminPolicyController::class, 'update'])->name('policies.update');
    Route::get('/reports', [AdminReportController::class, 'index'])->name('reports.index');
    Route::post('/reports/download', [AdminReportController::class, 'download'])->name('reports.download');
    Route::post('/reports/submit', [AdminReportController::class, 'submit'])->name('reports.submit');
    Route::patch('/reports/teacher-submissions/{delivery}/acknowledge', [AdminReportController::class, 'acknowledgeTeacherSubmission'])->name('reports.teacher_submissions.acknowledge');
});
