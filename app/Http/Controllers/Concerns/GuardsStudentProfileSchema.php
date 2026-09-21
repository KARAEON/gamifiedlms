<?php

namespace App\Http\Controllers\Concerns;

use App\Models\StudentProfile;
use Illuminate\Http\RedirectResponse;

trait GuardsStudentProfileSchema
{
    protected function ensureStudentProfileSplitNameSchema(?string $route = null, bool $withInput = false): ?RedirectResponse
    {
        if (StudentProfile::hasSplitNameSchema()) {
            return null;
        }

        $redirect = $route
            ? redirect()->route($route)
            : redirect()->back();

        if ($withInput) {
            $redirect->withInput();
        }

        return $redirect->with('status', StudentProfile::SPLIT_NAME_SCHEMA_MESSAGE);
    }
}
