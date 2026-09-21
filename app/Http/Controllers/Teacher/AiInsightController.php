<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\AiInsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AiInsightController extends Controller
{
    public function __invoke(Request $request, AiInsightService $aiInsightService): JsonResponse
    {
        try {
            $payload = $aiInsightService->generateForTeacher($request->user(), [
                'date_from' => $request->query('date_from'),
                'date_to' => $request->query('date_to'),
            ]);

            return response()->json([
                'status' => 'success',
                'data' => $payload['analysis'],
                'roster' => $payload['roster'],
                'source' => $payload['source'],
                'warning' => $payload['warning'],
                'window' => $payload['window'],
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'status' => 'error',
                'message' => 'Unable to generate AI insights right now. Please try again shortly.',
            ], 500);
        }
    }
}

