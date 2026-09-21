<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Student Game</title>
        <link rel="stylesheet" href="{{ asset('assets/student-game.css') }}">
        <style>
            .student-game-hud {
                position: fixed;
                top: 1rem;
                left: 1rem;
                right: 1rem;
                z-index: 50;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.75rem;
                pointer-events: none;
            }

            .student-game-badge {
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(15, 23, 42, 0.7);
                color: #f8fafc;
                border-radius: 0.9rem;
                padding: 0.6rem 0.8rem;
                font-family: Pixelify Sans, monospace;
                font-size: 0.9rem;
                line-height: 1.2;
                pointer-events: auto;
            }

            .student-game-logout {
                border: 1px solid rgba(255, 255, 255, 0.22);
                background: rgba(15, 23, 42, 0.78);
                color: #f8fafc;
                border-radius: 0.75rem;
                padding: 0.55rem 0.8rem;
                font-family: Pixelify Sans, monospace;
                font-size: 0.82rem;
                cursor: pointer;
                pointer-events: auto;
            }

            .student-game-logout:hover {
                background: rgba(15, 23, 42, 0.92);
            }
        </style>
        <script>
            window.GLMS_PHASER = @json($phaserContext);
        </script>
        <script type="module" src="{{ asset('assets/student-game.js') }}"></script>
    </head>
    <body>
        <div id="game-container"></div>

        <header class="student-game-hud">
            <div class="student-game-badge">
                <div>{{ $student->name }}</div>
                <div>{{ $student->studentProfile?->section?->name ?? 'No section' }}</div>
            </div>

            <form action="{{ route('logout') }}" method="POST">
                @csrf
                <button type="submit" class="student-game-logout">Sign out</button>
            </form>
        </header>
    </body>
</html>
