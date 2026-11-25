<section class="panel p-5">
    <h2 class="section-title">Student game questions</h2>
    <p class="section-copy mb-4">Existing Science formative and summative questions. Saved changes apply when students reload the game.</p>
    @foreach ($gameAssessments as $lessonKey => $assessment)
        <details class="mt-3 rounded-xl border border-slate-200 p-4" open>
            <summary class="cursor-pointer font-semibold">{{ $assessment['subtitle'] }} · {{ ucfirst($assessment['type']) }} · {{ count($assessment['items']) }} questions</summary>
            @foreach ($assessment['items'] as $item)
                <details class="mt-3 rounded-lg border border-slate-200 p-3">
                    <summary class="cursor-pointer text-sm">{{ $loop->iteration }}. {{ $item['prompt'] }}</summary>
                    <form method="POST" action="{{ route('teacher.question-bank.game.update', [$lessonKey, $item['id']]) }}" class="mt-3 space-y-3">
                        @csrf @method('PATCH')
                        <label class="block">Question<textarea name="prompt" class="input-field mt-1" required>{{ $item['prompt'] }}</textarea></label>
                        @foreach ($item['choices'] as $choice)
                            <label class="block">Choice {{ $loop->iteration }}<input name="choices[]" class="input-field mt-1" value="{{ $choice }}" required></label>
                        @endforeach
                        <label class="block">Correct answer<input name="answer" class="input-field mt-1" value="{{ $item['answer'] }}" required></label>
                        <p class="text-xs text-slate-500">The correct answer must exactly match one of the choices above.</p>
                        <label class="block">Feedback<textarea name="feedback" class="input-field mt-1" required>{{ $item['feedback'] }}</textarea></label>
                        <button class="btn-primary">Save game question</button>
                    </form>
                </details>
            @endforeach
        </details>
    @endforeach
</section>
