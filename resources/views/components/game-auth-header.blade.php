<header class="adventure-auth-header">
    <a href="{{ route('landing') }}" class="game-brand" aria-label="Lumi Adventures home">
        <span class="game-brand__logo"><img src="{{ asset('images/branding/catbalogan-city-division-logo.png') }}" alt=""></span>
        <span class="game-brand__copy">
            <strong>Lumi Adventures</strong>
            <small>Catbalogan I SPED Center</small>
        </span>
    </a>
    <nav class="adventure-auth-nav" aria-label="Account navigation">
        <a href="{{ route('student.join.create') }}" class="pixel-button pixel-button--light">Join Class</a>
        <a href="{{ route('student.access.create') }}" class="pixel-button pixel-button--light">Student Sign In</a>
        <a href="{{ route('login') }}" class="pixel-button pixel-button--gold">Teacher Portal</a>
    </nav>
</header>
