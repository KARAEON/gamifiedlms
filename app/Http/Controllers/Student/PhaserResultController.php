<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StorePhaserGameResultRequest;
use App\Services\PhaserResultService;
use Illuminate\Http\JsonResponse;

class PhaserResultController extends Controller
{
    public function __construct(
        private readonly PhaserResultService $phaserResultService,
    ) {
    }

    public function store(StorePhaserGameResultRequest $request): JsonResponse
    {
        $submission = $this->phaserResultService->store(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'stored' => true,
            'created' => $submission['created'],
            'result_id' => $submission['result']->id,
            'result_status' => $submission['result']->result_status,
            'attempt_number' => $submission['result']->attempt_number,
        ], $submission['created'] ? 201 : 200);
    }
}
