<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Concerns\GuardsStudentProfileSchema;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StudentCodeLoginRequest;
use App\Http\Requests\Auth\StudentJoinCodeRequest;
use App\Http\Requests\Auth\StudentJoinRequest;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\View\View;

class StudentAccessController extends Controller
{
    use GuardsStudentProfileSchema;

    protected const JOIN_SESSION_KEY = 'student_join_section';

    public function createLogin(): View
    {
        return view('auth.student-login');
    }

    public function storeLogin(StudentCodeLoginRequest $request): RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('student.access.create', true)) {
            return $response;
        }

        $validated = $request->validated();
        $section = $this->findActiveSectionByCode((string) $validated['section_code']);

        if (! $section) {
            return back()
                ->withErrors(['section_code' => 'The section code is invalid or inactive.'])
                ->withInput();
        }

        $matches = $this->findMatchingStudents(
            $section->id,
            (string) $validated['first_name'],
            $validated['middle_name'] ?? null,
            (string) $validated['last_name'],
        );

        if ($matches->isEmpty()) {
            return back()
                ->withErrors(['last_name' => 'No active student matched that section code and name.'])
                ->withInput();
        }

        $student = null;
        $learnerReference = $validated['learner_reference'] ?? null;

        if ($matches->count() > 1) {
            if (! filled($learnerReference)) {
                return back()
                    ->withErrors(['learner_reference' => 'Multiple students match this name. Enter your learner reference to continue.'])
                    ->withInput()
                    ->with('student_login_requires_learner_reference', true);
            }

            $student = $matches->first(function (User $candidate) use ($learnerReference): bool {
                return $candidate->studentProfile?->learner_reference === $learnerReference;
            });

            if (! $student) {
                return back()
                    ->withErrors(['learner_reference' => 'The learner reference did not match the selected student record.'])
                    ->withInput()
                    ->with('student_login_requires_learner_reference', true);
            }
        } else {
            $student = $matches->first();
        }

        Auth::login($student);
        $request->session()->regenerate();

        return redirect()->route('student.dashboard')->with('status', 'Welcome back, '.$student->name.'.');
    }

    public function createJoin(Request $request): View
    {
        return view('auth.join', [
            'verifiedSection' => $this->verifiedSectionFromSession($request),
        ]);
    }

    public function verifyJoinCode(StudentJoinCodeRequest $request): RedirectResponse
    {
        $request->session()->forget(self::JOIN_SESSION_KEY);

        $section = $this->findActiveSectionByCode((string) $request->validated('section_code'));

        if (! $section) {
            return back()
                ->withErrors(['section_code' => 'The join code is invalid or inactive.'])
                ->withInput();
        }

        $request->session()->put(self::JOIN_SESSION_KEY, [
            'id' => $section->id,
            'code' => $section->code,
        ]);

        return redirect()->route('student.join.create');
    }

    public function storeJoin(StudentJoinRequest $request): RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('student.join.create', true)) {
            return $response;
        }

        $section = $this->verifiedSectionFromSession($request);

        if (! $section) {
            return redirect()->route('student.join.create')
                ->withErrors(['section_code' => 'Enter a valid join code before creating a student account.']);
        }

        /** @var array<string, mixed> $validated */
        $validated = $request->validated();

        $student = DB::transaction(function () use ($validated, $section): User {
            $student = User::query()->create([
                'name' => StudentProfile::composeDisplayName(
                    (string) $validated['first_name'],
                    $validated['middle_name'] ?? null,
                    (string) $validated['last_name'],
                ),
                'email' => (string) $validated['email'],
                'role' => UserRole::STUDENT,
                'password' => Hash::make(Str::random(40)),
            ]);

            $learnerReference = StudentProfile::generateLearnerReference();

            $profile = $student->studentProfile()->create([
                'section_id' => $section->id,
                'first_name' => $validated['first_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'last_name' => $validated['last_name'],
                'learner_reference' => $learnerReference,
            ]);

            $student->setRelation('studentProfile', $profile);

            return $student;
        });

        $request->session()->forget(self::JOIN_SESSION_KEY);
        Auth::login($student);
        $request->session()->regenerate();

        return redirect()->route('student.dashboard')->with(
            'status',
            'Student account created successfully. Save your learner reference: '.$student->studentProfile->learner_reference.'.'
        );
    }

    /**
     * @return Collection<int, User>
     */
    protected function findMatchingStudents(
        int $sectionId,
        string $firstName,
        ?string $middleName,
        string $lastName,
    ): Collection {
        $normalizedFirstName = StudentProfile::normalizedNamePart($firstName);
        $normalizedMiddleName = StudentProfile::normalizedNamePart($middleName);
        $normalizedLastName = StudentProfile::normalizedNamePart($lastName);

        return User::query()
            ->where('role', UserRole::STUDENT)
            ->where('is_active', true)
            ->whereHas('studentProfile', function ($builder) use (
                $sectionId,
                $normalizedFirstName,
                $normalizedMiddleName,
                $normalizedLastName
            ): void {
                $builder->where('section_id', $sectionId)
                    ->whereRaw("LOWER(TRIM(COALESCE(first_name, ''))) = ?", [$normalizedFirstName])
                    ->whereRaw("LOWER(TRIM(COALESCE(middle_name, ''))) = ?", [$normalizedMiddleName])
                    ->whereRaw("LOWER(TRIM(COALESCE(last_name, ''))) = ?", [$normalizedLastName]);
            })
            ->with('studentProfile')
            ->get();
    }

    protected function verifiedSectionFromSession(Request $request): ?Section
    {
        $payload = $request->session()->get(self::JOIN_SESSION_KEY);
        if (! is_array($payload) || ! isset($payload['id'], $payload['code'])) {
            return null;
        }

        $section = Section::query()
            ->whereKey((int) $payload['id'])
            ->where('is_active', true)
            ->first();

        if (! $section || strtoupper((string) $section->code) !== strtoupper((string) $payload['code'])) {
            $request->session()->forget(self::JOIN_SESSION_KEY);

            return null;
        }

        return $section;
    }

    protected function findActiveSectionByCode(string $sectionCode): ?Section
    {
        return Section::query()
            ->where('is_active', true)
            ->whereRaw('UPPER(code) = ?', [strtoupper(trim($sectionCode))])
            ->first();
    }
}
