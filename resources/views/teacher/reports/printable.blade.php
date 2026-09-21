<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1e293b;
            font-size: 11px;
            margin: 24px;
        }

        .header {
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }

        .brand-row {
            display: table;
            width: 100%;
            margin-bottom: 6px;
        }

        .brand-cell-left,
        .brand-cell-right {
            display: table-cell;
            vertical-align: top;
            width: 50%;
        }

        .brand-cell-right {
            text-align: right;
        }

        .brand-chip {
            display: inline-block;
            padding: 4px 8px;
            border: 1px solid #bfdbfe;
            background: #eff6ff;
            border-radius: 999px;
            font-size: 9px;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: .06em;
        }

        .title {
            font-size: 20px;
            font-weight: 700;
            color: #0f2f67;
            margin: 0;
        }

        .meta {
            font-size: 10px;
            color: #475569;
            margin-top: 4px;
        }

        .summary-grid {
            margin: 12px 0 14px;
        }

        .summary-box {
            display: inline-block;
            width: 31%;
            vertical-align: top;
            margin-right: 2%;
            border: 1px solid #dbeafe;
            border-radius: 8px;
            background: #eff6ff;
            padding: 8px 10px;
            box-sizing: border-box;
        }

        .summary-box:last-child {
            margin-right: 0;
        }

        .summary-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: #475569;
            margin-bottom: 4px;
        }

        .summary-value {
            font-size: 14px;
            font-weight: 700;
            color: #0f2f67;
        }

        h2 {
            font-size: 13px;
            margin: 14px 0 8px;
            color: #0f2f67;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }

        th, td {
            border: 1px solid #dbeafe;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }

        tbody tr:nth-child(even) {
            background: #f8fafc;
        }

        th {
            background: #f8fafc;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: .06em;
            color: #475569;
        }

        .tag {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 999px;
            border: 1px solid #dbeafe;
            background: #f8fafc;
            font-size: 9px;
            color: #334155;
            margin-right: 4px;
            margin-bottom: 4px;
        }

        .note {
            margin-top: 14px;
            padding: 8px 10px;
            border: 1px solid #dbeafe;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 10px;
            color: #334155;
        }

        .footer {
            margin-top: 18px;
            font-size: 9px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }

        .signature-grid {
            margin-top: 10px;
            display: table;
            width: 100%;
        }

        .signature-box {
            display: table-cell;
            width: 50%;
            vertical-align: bottom;
            padding-right: 10px;
        }

        .signature-line {
            margin-top: 18px;
            border-top: 1px solid #94a3b8;
            padding-top: 3px;
            font-size: 9px;
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand-row">
            <div class="brand-cell-left">
                <div class="brand-chip">Catbalogan I SPED Center · School ID 193540</div>
            </div>
            <div class="brand-cell-right">
                <div class="brand-chip">{{ ucfirst($reportType) }} report</div>
            </div>
        </div>
        <p class="title">{{ $title }}</p>
        <p class="meta">Teacher Portal · Generated at {{ $generatedAt->format('M d, Y h:i A') }}</p>
        @if (! empty($filters))
            <div style="margin-top: 6px;">
                @foreach ($filters as $key => $value)
                    <span class="tag">{{ str_replace('_', ' ', ucfirst($key)) }}: {{ $value }}</span>
                @endforeach
            </div>
        @endif
    </div>

    @if ($reportType === 'student')
        <h2>Student Overview: {{ $student->name }}</h2>
        <div class="summary-grid">
            <div class="summary-box">
                <div class="summary-label">Average Accuracy</div>
                <div class="summary-value">{{ number_format($payload['average'], 1) }}%</div>
            </div>
            <div class="summary-box">
                <div class="summary-label">Completion Rate</div>
                <div class="summary-value">{{ number_format($payload['completion_rate'], 1) }}%</div>
            </div>
            <div class="summary-box">
                <div class="summary-label">Consistency Score</div>
                <div class="summary-value">{{ number_format($payload['consistency_score'], 1) }}</div>
            </div>
        </div>

        <h2>Detailed Performance</h2>
        <table>
            <thead>
                <tr>
                    <th>Lesson</th>
                    <th>Topic</th>
                    <th>Activity</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($payload['records'] as $record)
                    <tr>
                        <td>{{ $record->lesson?->title }}</td>
                        <td>{{ $record->topic?->title }}</td>
                        <td>{{ $record->activity?->title }}</td>
                        <td>{{ number_format($record->score, 1) }}/{{ number_format($record->max_score, 1) }}</td>
                        <td>{{ number_format($record->accuracy, 1) }}%</td>
                        <td>{{ optional($record->attempted_at)->format('M d, Y') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @elseif ($reportType === 'section')
        <h2>Section Overview: {{ $section->name }}</h2>
        <div class="summary-grid">
            <div class="summary-box">
                <div class="summary-label">Average Accuracy</div>
                <div class="summary-value">{{ number_format($payload['average'], 1) }}%</div>
            </div>
            <div class="summary-box">
                <div class="summary-label">Completion Rate</div>
                <div class="summary-value">{{ number_format($payload['completion_rate'], 1) }}%</div>
            </div>
            <div class="summary-box">
                <div class="summary-label">Record Count</div>
                <div class="summary-value">{{ $payload['records']->count() }}</div>
            </div>
        </div>

        <h2>Intervention Targets</h2>
        <table>
            <thead>
                <tr>
                    <th>Student</th>
                    <th>Average</th>
                    <th>Attempts</th>
                    <th>Low Score Rate</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($payload['intervention_targets'] as $target)
                    <tr>
                        <td>{{ $target['student'] }}</td>
                        <td>{{ number_format($target['average'], 1) }}%</td>
                        <td>{{ $target['attempts'] }}</td>
                        <td>{{ number_format($target['low_score_rate'], 1) }}%</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4">No intervention targets identified.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @else
        <h2>Summary Analytics (Risk Prioritized)</h2>
        <table>
            <thead>
                <tr>
                    <th>Section</th>
                    <th>Lesson</th>
                    <th>Topic</th>
                    <th>Avg Accuracy</th>
                    <th>Completion</th>
                    <th>Risk Index</th>
                    <th>Attempts</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($payload['summary'] as $row)
                    <tr>
                        <td>{{ $row['section'] }}</td>
                        <td>{{ $row['lesson'] }}</td>
                        <td>{{ $row['topic'] }}</td>
                        <td>{{ number_format($row['average_accuracy'], 1) }}%</td>
                        <td>{{ number_format($row['completion_rate'], 1) }}%</td>
                        <td>{{ number_format($row['risk_index'], 1) }}</td>
                        <td>{{ $row['total_attempts'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="note">
        <strong>Teacher Remarks:</strong>
        {{ $payload['remarks'] ?? 'Use this report to guide remediation planning, enrichment, and next-cycle lesson design.' }}
    </div>

    <div class="signature-grid">
        <div class="signature-box">
            <div class="signature-line">Prepared by (Teacher)</div>
        </div>
        <div class="signature-box">
            <div class="signature-line">Reviewed by (Academic Head)</div>
        </div>
    </div>

    <div class="footer">
        Generated from the GLMS decision-support analytics module. Use together with classroom observations for intervention planning.
    </div>
</body>
</html>
