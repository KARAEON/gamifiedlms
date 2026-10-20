<x-guest-layout title="Lumi Adventures | Gamified Learning" variant="game" :show-school-brand="false">
    <style>
        @font-face {
            font-family: "Lumi Lower Pixel";
            src: url("{{ asset('assets/fonts/lower-pixel/LowresPixel-Regular.otf') }}") format("opentype");
            font-display: swap;
        }

        @font-face {
            font-family: "Lumi Arcade";
            src: url("{{ asset('assets/fonts/arcadeclassic/ARCADECLASSIC.TTF') }}") format("truetype");
            font-display: swap;
        }
    </style>
    <main class="game-landing" style="--game-bg-image: url('{{ asset('assets/backgrounds/horizon-bg.png') }}')">
        <div class="game-landing__inner">
            <header class="game-landing__header">
                <a href="{{ route('landing') }}" class="game-brand" aria-label="Catbalogan I SPED Center home">
                    <span class="game-brand__logo"><img src="{{ asset('images/branding/catbalogan-city-division-logo.png') }}" alt=""></span>
                    <span class="game-brand__copy">
                        <strong>Catbalogan I SPED Center</strong>
                        <small>Gamified Learning Management System</small>
                    </span>
                </a>
                <nav class="game-landing__nav" aria-label="Main navigation">
                    <a href="{{ route('student.access.create') }}" class="pixel-button pixel-button--light">Student Access</a>
                    <a href="{{ route('login') }}" class="pixel-button pixel-button--gold">Teacher Sign In</a>
                </nav>
            </header>

            <section class="game-landing__hero" aria-labelledby="landing-title">
                <div class="game-landing__intro">
                    <p class="game-kicker"><span class="game-kicker__star">✦</span> Lumi Adventures <span class="game-kicker__star">✦</span></p>
                    <h1 id="landing-title">Learn it.<br>Play it.<br><span>Master it.</span></h1>
                    <p class="game-landing__lead">A science adventure where every lesson brings a new discovery. Explore, solve, and watch your skills grow as you play.</p>

                    <div class="game-landing__actions">
                        <a href="{{ route('student.join.create') }}" class="pixel-button pixel-button--gold pixel-button--large"><span aria-hidden="true">▶</span> Start your adventure</a>
                        <a href="{{ route('register') }}" class="pixel-button pixel-button--light pixel-button--large">Teacher Register</a>
                    </div>
                    <p class="game-landing__hint"><span aria-hidden="true">✦</span> Your next discovery is just one class away.</p>
                </div>

                <section class="quest-panel" aria-label="Adventure features">
                    <div class="quest-panel__topline">
                        <span class="quest-panel__world"><span class="quest-panel__dot"></span> WORLD 01 · SCIENCE ISLANDS</span>
                        <span class="quest-panel__level">READY!</span>
                    </div>
                    <div class="quest-panel__heading">
                        <p class="quest-panel__eyebrow">YOUR LEARNING QUEST</p>
                        <h2>Every lesson<br>unlocks a new skill.</h2>
                        <p>Explore at your own pace, collect knowledge, and level up.</p>
                    </div>

                    <div class="quest-panel__features">
                        <article class="quest-feature">
                            <span class="quest-feature__icon" aria-hidden="true">✦</span>
                            <div><h3>Explore</h3><p>Discover lessons and new worlds.</p></div>
                        </article>
                        <article class="quest-feature">
                            <span class="quest-feature__icon quest-feature__icon--cyan" aria-hidden="true">★</span>
                            <div><h3>Play</h3><p>Take on hands-on science challenges.</p></div>
                        </article>
                        <article class="quest-feature">
                            <span class="quest-feature__icon quest-feature__icon--pink" aria-hidden="true">◆</span>
                            <div><h3>Level up</h3><p>Track your scores and mastery.</p></div>
                        </article>
                    </div>

                    <div class="quest-panel__mascot-glow" aria-hidden="true"></div>
                    <img class="quest-panel__mascot" src="{{ asset('assets/characters/quill/quill-default.png') }}" alt="Quill, your guide through Lumi Adventures">
                    <div class="quest-panel__footer"><span>YOUR GUIDE</span><strong>Quill is ready to explore!</strong></div>
                </section>
            </section>

            <footer class="game-landing__footer">
                <span>CATBALOGAN I SPED CENTER</span>
                <span class="game-landing__footer-star" aria-hidden="true">✦</span>
                <span>LEARN · PLAY · DISCOVER</span>
            </footer>
        </div>
    </main>
</x-guest-layout>
