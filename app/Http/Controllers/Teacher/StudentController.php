<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\UserRole;
use App\Http\Controllers\Concerns\GuardsStudentProfileSchema;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreStudentRequest;
use App\Http\Requests\Teacher\UpdateStudentRequest;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;

class StudentController extends Controller
{
    use GuardsStudentProfileSchema;

    public function index(Request $request): View
    {
        $allowedSectionIds = $request->user()->handledSections()->pluck('sections.id');

        $query = User::query()
            ->where('role', UserRole::STUDENT)
            ->whereHas('studentProfile', fn ($builder) => $builder->whereIn('section_id', $allowedSectionIds))
            ->with('studentProfile.section')
            ->orderBy('name');

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('section_id')) {
            $sectionId = (int) $request->query('section_id');
            $query->whereHas('studentProfile', fn ($builder) => $builder->where('section_id', $sectionId));
        }

        if ($request->filled('status')) {
            $isActive = $request->query('status') === 'active';
            $query->where('is_active', $isActive);
        }

        return view('teacher.students.index', [
            'students' => $query->paginate(12)->withQueryString(),
            'sections' => Section::query()->whereIn('id', $allowedSectionIds)->orderBy('name')->get(),
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('teacher.students.index', true)) {
            return $response;
        }

        $validated = $request->validated();
        $learnerReference = $validated['learner_reference'] ?? StudentProfile::generateLearnerReference();

        $student = User::query()->create([
            'name' => StudentProfile::composeDisplayName(
                (string) $validated['first_name'],
                $validated['middle_name'] ?? null,
                (string) $validated['last_name'],
            ),
            'email' => $validated['email'],
            'role' => UserRole::STUDENT,
            'password' => Hash::make(Str::random(40)),
        ]);

        $student->studentProfile()->create([
            'section_id' => $validated['section_id'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
            'learner_reference' => $learnerReference,
            'guardian_name' => $validated['guardian_name'] ?? null,
            'learning_goal' => $validated['learning_goal'] ?? null,
        ]);

        return redirect()->route('teacher.students.index')->with(
            'status',
            'Student account created successfully. Learner reference: '.$learnerReference.'.'
        );
    }

    public function show(Request $request, User $student): View|RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('teacher.students.index')) {
            return $response;
        }

        abort_if(! $student->isStudent(), 404);
        $this->ensureTeacherCanManageStudent($request, $student);

        $student->load('studentProfile.section');
        $attempts = $student->attempts()->with('activity.topic.lesson')->latest('completed_at')->paginate(10);
        $scoreRecords = $student->scoreRecords()->with('topic.lesson')->latest('attempted_at')->take(10)->get();

        return view('teacher.students.show', [
            'student' => $student,
            'attempts' => $attempts,
            'scoreRecords' => $scoreRecords,
            'sections' => $request->user()->handledSections()->orderBy('name')->get(),
        ]);
    }

    public function update(UpdateStudentRequest $request, User $student): RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('teacher.students.index', true)) {
            return $response;
        }

        abort_if(! $student->isStudent(), 404);
        $this->ensureTeacherCanManageStudent($request, $student);

        $validated = $request->validated();
        $learnerReference = $validated['learner_reference']
            ?? $student->studentProfile?->learner_reference
            ?? StudentProfile::generateLearnerReference();

        $student->update([
            'name' => StudentProfile::composeDisplayName(
                (string) $validated['first_name'],
                $validated['middle_name'] ?? null,
                (string) $validated['last_name'],
            ),
            'email' => $validated['email'],
            'is_active' => $request->boolean('is_active'),
        ]);

        $student->studentProfile()->updateOrCreate(
            ['user_id' => $student->id],
            [
                'section_id' => $validated['section_id'],
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'learner_reference' => $learnerReference,
                'guardian_name' => $validated['guardian_name'] ?? null,
                'learning_goal' => $validated['learning_goal'] ?? null,
            ]
        );

        return redirect()->route('teacher.students.show', $student)->with('status', 'Student profile updated.');
    }

    public function archive(Request $request, User $student): RedirectResponse
    {
        abort_if(! $student->isStudent(), 404);
        $this->ensureTeacherCanManageStudent($request, $student);

        $student->update(['is_active' => false]);

        return redirect()->route('teacher.students.index')->with('status', 'Student archived successfully.');
    }

    protected function ensureTeacherCanManageStudent(Request $request, User $student): void
    {
        abort_unless(
            $request->user()->handledSections()->whereKey($student->studentProfile?->section_id)->exists(),
            404
        );
    }
}
