<div class="space-y-5" data-no-reveal="true">
    @if ($result)
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 class="text-lg font-semibold text-emerald-800">Activity Completed</h3>
            <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <div class="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
                    <p class="text-xs text-slate-500">Score</p>
                    <p class="text-xl font-semibold text-emerald-700">{{ number_format($result['score'], 1) }}/{{ number_format($result['max_score'], 1) }}</p>
                </div>
                <div class="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
                    <p class="text-xs text-slate-500">Accuracy</p>
                    <p class="text-xl font-semibold text-emerald-700">{{ number_format($result['accuracy'], 1) }}%</p>
                </div>
                <div class="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
                    <p class="text-xs text-slate-500">Feedback</p>
                    <p class="text-sm text-slate-700">{{ $result['feedback'] }}</p>
                </div>
            </div>
            @if ($activity->allow_retry)
                <button wire:click="retry" class="btn-primary mt-4">Retry Activity</button>
            @endif
        </div>
    @endif

    @if (! $result || $activity->allow_retry)
        <div class="space-y-4">
            @if ($errors->any())
                <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Please answer all required questions before submitting.
                </div>
            @endif

            @foreach ($questions as $index => $question)
                <article class="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]" wire:key="question-{{ $question->id }}">
                    <p class="text-xs font-semibold uppercase tracking-wide text-brand-600">Question {{ $index + 1 }}</p>
                    <p class="mt-1 text-base font-medium text-slate-900">{{ $question->prompt }}</p>

                    @if ($question->question_type === 'multiple_choice' || $question->question_type === 'visual_challenge')
                        @php
                            $visualImage = trim((string) data_get($question->payload, 'image', $question->media_path ?? ''));
                            $hasVisualImage = $visualImage !== '' && ! str_contains(strtolower($visualImage), 'placehold.co');
                        @endphp
                        @if ($hasVisualImage)
                            <img src="{{ $visualImage }}" alt="Question visual"
                                class="mt-3 h-44 w-full rounded-xl object-cover ring-1 ring-slate-200">
                        @elseif ($question->question_type === 'visual_challenge')
                            <div class="mt-3 flex h-44 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-brand-50 text-slate-600 ring-1 ring-slate-200">
                                <p class="text-sm font-medium">Visual clue will appear here</p>
                            </div>
                        @endif
                        @php
                            $selectedChoice = data_get($responses, (string) $question->id);
                        @endphp
                        <div class="mt-3 grid gap-2">
                            @foreach ($question->choices as $choice)
                                <label class="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition {{ (string) $selectedChoice === (string) $choice->value ? 'border-brand-300 bg-brand-50 text-brand-900' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50' }}">
                                    <input type="radio"
                                        wire:model.defer="responses.{{ $question->id }}"
                                        value="{{ $choice->value }}"
                                        class="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-300">
                                    <span>{{ $choice->label }}</span>
                                </label>
                            @endforeach
                        </div>
                    @elseif ($question->question_type === 'matching')
                        @php
                            $pairs = $question->matchingPairs();
                        @endphp
                        <div class="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                            @foreach ($pairs as $pair)
                                <div class="grid gap-2 sm:grid-cols-2" wire:key="match-{{ $question->id }}-{{ $pair['key'] }}">
                                    <div class="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">{{ $pair['left'] }}</div>
                                    <input type="text"
                                        wire:model.defer="responses.{{ $question->id }}.{{ $pair['key'] }}"
                                        class="input-field text-sm"
                                        placeholder="Type the correct meaning">
                                </div>
                                @error("responses.{$question->id}.{$pair['key']}")
                                    <p class="text-xs text-red-600">{{ $message }}</p>
                                @enderror
                            @endforeach
                        </div>
                        <p class="mt-2 text-xs text-slate-500">Tip: Use complete science definitions for each term.</p>
                    @elseif ($question->question_type === 'pics_word')
                        @php
                            $images = $question->picsWordImages();
                            $clue = $question->wordPuzzleClue();
                        @endphp
                        <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                            @for ($clueIndex = 0; $clueIndex < 4; $clueIndex++)
                                @php
                                    $image = $images[$clueIndex] ?? null;
                                    $hasImage = is_string($image) && $image !== '';
                                @endphp
                                <figure
                                    x-data="{ failed: {{ $hasImage ? 'false' : 'true' }} }"
                                    class="group relative h-32 sm:h-36 md:h-40 lg:h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                                    @if ($hasImage)
                                        <img x-show="!failed"
                                            x-on:error="failed = true"
                                            src="{{ $image }}"
                                            alt="Clue {{ $clueIndex + 1 }}"
                                            loading="lazy"
                                            class="h-full w-full object-cover object-center transition duration-300 ease-out group-hover:scale-105">
                                    @endif

                                    <span class="absolute left-2 top-2 inline-flex items-center rounded-full bg-slate-900/65 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                                        Clue {{ $clueIndex + 1 }}
                                    </span>

                                    <div x-cloak x-show="failed"
                                        class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 via-white to-brand-50 text-slate-600">
                                        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-500">
                                            {{ $clueIndex + 1 }}
                                        </span>
                                        <p class="text-sm font-semibold">Image clue {{ $clueIndex + 1 }}</p>
                                    </div>
                                </figure>
                            @endfor
                        </div>
                        <p class="mt-2 text-xs text-slate-500">{{ $clue }}</p>
                        <div class="mt-2 flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                First letter: {{ $question->wordPuzzleFirstLetter() }}
                            </span>
                            <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                                {{ $question->wordPuzzleLength() }} letters
                            </span>
                        </div>
                        <input type="text"
                            wire:model.defer="responses.{{ $question->id }}"
                            class="input-field mt-3"
                            placeholder="Type the science word">
                    @elseif ($question->question_type === 'guess_word')
                        @php
                            $clueImage = $question->media_path ?: $question->guessWordImage();
                        @endphp
                        <div class="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            @if ($clueImage)
                                <img src="{{ $clueImage }}" alt="Guess the word clue"
                                    class="h-36 sm:h-44 md:h-52 w-full rounded-xl object-cover object-center ring-1 ring-slate-200">
                            @endif
                            <p class="mt-2 text-sm text-slate-700">{{ $question->wordPuzzleClue() }}</p>
                            <div class="mt-2 flex flex-wrap items-center gap-2">
                                <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    First letter: {{ $question->wordPuzzleFirstLetter() }}
                                </span>
                                <span class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                                    {{ $question->wordPuzzleLength() }} letters
                                </span>
                            </div>
                        </div>
                        <input type="text"
                            wire:model.defer="responses.{{ $question->id }}"
                            class="input-field mt-3"
                            placeholder="Type the science word">
                    @else
                        <input type="text"
                            wire:model.defer="responses.{{ $question->id }}"
                            class="input-field mt-3"
                            placeholder="Type your answer">
                    @endif

                    @error("responses.{$question->id}")
                        <p class="mt-2 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </article>
            @endforeach

            <div class="sticky bottom-3 z-[90] -mx-1 mt-2 flex items-center justify-end gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.7)] backdrop-blur">
                @if ($errors->any())
                    <p class="mr-auto text-xs font-semibold text-amber-700">Please complete all required answers.</p>
                @endif
                <button type="button"
                    onclick="
                        const root = this.closest('[wire\\:id]');
                        const id = root ? root.getAttribute('wire:id') : null;
                        const livewire = window.Livewire;
                        if (livewire && id) {
                            const component = livewire.find(id);
                            if (component) {
                                component.call('submitAnswers');
                                return;
                            }
                        }
                        window.dispatchEvent(new CustomEvent('glms-toast', { detail: { message: 'Submit is unavailable. Please refresh this page.' } }));
                    "
                    wire:loading.class="opacity-70"
                    wire:target="submitAnswers"
                    class="btn-primary relative z-10 cursor-pointer pointer-events-auto">
                    <span wire:loading.remove wire:target="submitAnswers">Submit Answers</span>
                    <span wire:loading wire:target="submitAnswers">Checking answers...</span>
                </button>
            </div>
        </div>
    @endif
</div>
