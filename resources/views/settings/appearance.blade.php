<x-app-layout title="Appearance">
    <div class="mx-auto max-w-4xl space-y-6">
        <x-staff.page-heading title="Choose your workspace theme" description="Set the look of your teacher or school head workspace. This preference is saved to your account." eyebrow="Settings · Appearance" />

        <form method="POST" action="{{ route('settings.appearance.update') }}" class="space-y-5">
            @csrf
            @method('PATCH')

            <fieldset class="grid gap-4 md:grid-cols-2">
                <legend class="sr-only">Workspace theme</legend>

                <label class="theme-choice {{ $theme === 'game' ? 'is-selected' : '' }}">
                    <input type="radio" name="theme_preference" value="game" @checked($theme === 'game')>
                    <span class="theme-choice__preview theme-choice__preview--game" aria-hidden="true">
                        <span class="theme-preview-sidebar"></span><span class="theme-preview-content"><i></i><i></i><i></i></span>
                        <span class="theme-choice__badge">GAME</span>
                    </span>
                    <span class="theme-choice__copy">
                        <strong>Game theme</strong>
                        <span>Keep the Lumi Adventures look with illustrated accents and game inspired navigation.</span>
                    </span>
                </label>

                <label class="theme-choice {{ $theme === 'classic' ? 'is-selected' : '' }}">
                    <input type="radio" name="theme_preference" value="classic" @checked($theme === 'classic')>
                    <span class="theme-choice__preview theme-choice__preview--classic" aria-hidden="true">
                        <span class="theme-preview-sidebar"></span><span class="theme-preview-content"><i></i><i></i><i></i></span>
                        <span class="theme-choice__badge">CATB 1 SPED</span>
                    </span>
                    <span class="theme-choice__copy">
                        <strong>Classic school theme</strong>
                        <span>Use a clean school workspace with the pink CATB 1 SPED color palette.</span>
                    </span>
                </label>
            </fieldset>

            <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="text-xs text-slate-500">Your choice only changes your staff workspace. Student activity screens are unchanged.</p>
                <button type="submit" class="btn-primary">Save appearance</button>
            </div>
        </form>
    </div>
</x-app-layout>
