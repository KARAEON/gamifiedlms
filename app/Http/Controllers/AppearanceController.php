<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class AppearanceController extends Controller
{
    public function edit(Request $request): View
    {
        return view('settings.appearance', [
            'theme' => $request->user()->theme_preference ?? 'game',
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'theme_preference' => ['required', 'string', Rule::in(['game', 'classic'])],
        ]);

        $request->user()->update($validated);

        return redirect()->route('settings.appearance')->with('status', 'Appearance preference saved.');
    }
}
