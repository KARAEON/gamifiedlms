<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreTopicRequest;
use App\Models\Topic;
use Illuminate\Http\RedirectResponse;

class TopicController extends Controller
{
    public function store(StoreTopicRequest $request): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');

        Topic::query()->create($payload);

        return redirect()->route('teacher.lessons.index')->with('status', 'Topic added successfully.');
    }

    public function update(StoreTopicRequest $request, Topic $topic): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');

        $topic->update($payload);

        return redirect()->route('teacher.lessons.index')->with('status', 'Topic updated successfully.');
    }
}
