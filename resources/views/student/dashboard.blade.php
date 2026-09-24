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
                top: max(0.75rem, env(safe-area-inset-top));
                left: max(0.75rem, env(safe-area-inset-left));
                right: max(0.75rem, env(safe-area-inset-right));
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

            .student-game-orientation {
                display: none;
            }

            @media (max-width: 700px) {
                .student-game-badge {
                    max-width: calc(100vw - 8rem);
                    padding: 0.45rem 0.6rem;
                    font-size: 0.72rem;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .student-game-logout {
                    padding: 0.45rem 0.6rem;
                    font-size: 0.72rem;
                }
            }

            @media (max-width: 700px) and (orientation: portrait) {
                .student-game-orientation {
                    position: fixed;
                    inset: 0;
                    z-index: 40;
                    display: grid;
                    place-items: center;
                    padding: 5rem 2rem 2rem;
                    background: rgba(15, 23, 42, 0.68);
                    color: #f8fafc;
                    font-family: Pixelify Sans, monospace;
                    font-size: 1rem;
                    line-height: 1.4;
                    text-align: center;
                    pointer-events: none;
                }
            }
        </style>
        <script>
            window.GLMS_PHASER = @json($phaserContext);
        </script>
        <script type="module" src="{{ asset('assets/student-game.js') }}"></script>
    </head>
    <body>
        <div id="game-container"></div>
        <div class="student-game-orientation" role="status">Rotate your device to landscape for the best game experience.</div>

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
