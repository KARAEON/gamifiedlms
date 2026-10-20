<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin {{ ucfirst($scope) }} Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 2px; }
        .meta { color: #475569; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
        th { background: #f3f5f0; }
        .footer { margin-top: 16px; font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <p class="meta">Catbalogan I SPED Center ? School Head</p>
    <h1>{{ ucfirst($scope) }} Report</h1>
    <div class="meta">
        Generated: {{ optional($generatedAt)->format('M d, Y h:i A') }}<br>
        Date range: {{ $filters['date_from'] ?? 'N/A' }} to {{ $filters['date_to'] ?? 'N/A' }}
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Prepared by: {{ auth()->user()?->name }} ({{ strtoupper(auth()->user()?->role?->value ?? 'ADMIN') }})
    </div>
</body>
</html>
