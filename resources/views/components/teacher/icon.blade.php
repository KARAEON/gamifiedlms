@props(['name' => 'compass'])

<svg {{ $attributes->class(['teacher-pixel-icon']) }} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" shape-rendering="crispEdges">
    @switch($name)
        @case('book')
            <path fill="#172F42" d="M2 6h11v2h6V6h11v21H19v2h-6v-2H2z"/>
            <path fill="#48B8C6" d="M4 8h9v2h2v15h-2v-2H4zm15 2V8h9v15h-9v2h-2V10z"/>
            <path fill="#FFF0C4" d="M6 10h5v2H6zm0 5h7v2H6zm0 5h7v2H6zm15-10h5v2h-5zm-2 5h7v2h-7zm0 5h7v2h-7z"/>
            <path fill="#EAB65C" d="M15 10h2v17h-2zM4 25h9v2H4zm15 0h9v2h-9z"/>
            @break
        @case('learners')
            <path fill="#172F42" d="M11 2h10v2h2v10h-2v2h-2v2h6v2h3v9H4v-9h3v-2h6v-2h-2v-2H9V4h2zM2 8h5v9H2zm23 0h5v9h-5z"/>
            <path fill="#F2BC75" d="M13 4h6v2h2v6h-2v2h-6v-2h-2V6h2zM2 10h3v5H2zm25 0h3v5h-3z"/>
            <path fill="#E5A44F" d="M11 4h10v4h-4V6h-6z"/>
            <path fill="#49B7C5" d="M9 20h4v2h6v-2h4v2h3v5H6v-5h3z"/>
            <path fill="#FFF0C4" d="M13 18h6v2h-2v4h-2v-4h-2z"/>
            <path fill="#D67B5B" d="M0 19h5v2H2v6H0zm27 0h5v8h-2v-6h-3z"/>
            @break
        @case('sections')
            <path fill="#172F42" d="M3 3h11v11H3zm15 0h11v11H18zM3 18h11v11H3zm15 0h11v11H18z"/>
            <path fill="#EAB65C" d="M5 5h7v7H5z"/>
            <path fill="#4DBAC8" d="M20 5h7v7h-7z"/>
            <path fill="#D67B5B" d="M5 20h7v7H5z"/>
            <path fill="#8CA877" d="M20 20h7v7h-7z"/>
            <path fill="#FFF0C4" d="M5 5h7v2H5zm15 0h7v2h-7zM5 20h7v2H5zm15 0h7v2h-7z"/>
            @break
        @case('trophy')
            <path fill="#172F42" d="M8 2h16v3h6v12h-4v3h-6v3h-2v3h6v4H8v-4h6v-3h-2v-3H6v-3H2V5h6z"/>
            <path fill="#EAB65C" d="M10 4h12v11h-2v4h-8v-4h-2zM4 7h4v8H6v-2H4zm20 0h4v6h-2v2h-2zM16 21h2v5h-2zm-6 7h12v2H10z"/>
            <path fill="#FFF0C4" d="M12 6h3v8h-3zm6 0h2v3h-2z"/>
            <path fill="#D67B5B" d="M14 8h4v2h2v4h-2v2h-4v-2h-2v-4h2z"/>
            @break
        @case('spark')
            <path fill="#172F42" d="M13 1h6v8h4v4h8v6h-8v4h-4v8h-6v-8H9v-4H1v-6h8V9h4z"/>
            <path fill="#EAB65C" d="M15 3h2v8h4v4h8v2h-8v4h-4v8h-2v-8h-4v-4H3v-2h8v-4h4z"/>
            <path fill="#FFF0C4" d="M15 9h2v6h6v2h-8z"/>
            <path fill="#49B7C5" d="M2 2h4v4H2zm24 24h4v4h-4z"/>
            @break
        @case('scroll')
            <path fill="#172F42" d="M6 2h19v2h3v7h-5v12h-3v7H4v-2H1v-7h5z"/>
            <path fill="#F2D398" d="M8 4h15v2h-2v17h-3v5H6v-2H3v-3h5z"/>
            <path fill="#EAB65C" d="M23 4h2v2h1v3h-3zM6 25h10v3H6z"/>
            <path fill="#FFF0C4" d="M10 5h9v3h-9zm0 5h3v9h-3z"/>
            <path fill="#9E6845" d="M11 11h7v2h-7zm0 5h7v2h-7z"/>
            <path fill="#D67B5B" d="M19 20h6v2h2v6h-2v2h-6v-2h-2v-6h2z"/>
            <path fill="#FFF0C4" d="M21 23h2v4h-2z"/>
            @break
        @case('map')
            <path fill="#172F42" d="M1 7h4V5h5V3h3v2h6V3h5V1h7v24h-5v2h-5v2h-3v-2h-6v2H7v2H1z"/>
            <path fill="#F2D398" d="M3 9h4V7h4v20H9v2H3zM13 7h6v18h-6zm8-2h5V3h3v20h-5v2h-3z"/>
            <path fill="#8CA877" d="M3 11h4v2h2v5H5v-2H3zm10 7h4v2h2v5h-6zm12-9h4v6h-4v-2h-2v-2h2z"/>
            <path fill="#49B7C5" d="M9 7h2v20H9zM19 5h2v20h-2z"/>
            <path fill="#D67B5B" d="M23 17h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/>
            @break
        @case('crystal')
            <path fill="#172F42" d="M12 1h8v3h4v5h4v14h-4v4h-4v4h-8v-4H8v-4H4V9h4V4h4z"/>
            <path fill="#49B7C5" d="M12 6h4V3h2v3h4v5h4v10h-4v4h-4v4h-4v-4h-4v-4H6V11h6z"/>
            <path fill="#A8E5DB" d="M12 6h4v5h-4zm-4 5h4v10H8zm6 0h4v14h-4z"/>
            <path fill="#277C9B" d="M20 11h4v10h-4zm-2 14h2v2h-2z"/>
            <path fill="#FFF0C4" d="M25 2h3v3h3v2h-3v3h-3V7h-3V5h3zM1 23h3v3H1z"/>
            @break
        @case('shield')
            <path fill="#172F42" d="M13 1h6v2h6v2h5v14h-3v4h-4v4h-4v3h-6v-3H9v-4H5v-4H2V5h5V3h6z"/>
            <path fill="#EAB65C" d="M13 3h6v2h6v2h3v10h-3v4h-4v4h-4v3h-2v-3h-4v-4H7v-4H4V7h3V5h6z"/>
            <path fill="#49B7C5" d="M13 7h6v2h5v8h-3v4h-4v3h-2v-3h-4v-4H8V9h5z"/>
            <path fill="#FFF0C4" d="M17 10h3v6h-3v3h-3v-3h-3v-3h3v2h3z"/>
            @break
        @case('chart')
            <path fill="#172F42" d="M2 3h3v24h25v3H2zM8 17h6v8H8zm8-7h6v15h-6zm8-7h6v22h-6z"/>
            <path fill="#D67B5B" d="M10 19h2v6h-2z"/>
            <path fill="#49B7C5" d="M18 12h2v13h-2z"/>
            <path fill="#EAB65C" d="M26 5h2v20h-2z"/>
            <path fill="#FFF0C4" d="M8 5h3v3H8zm5-3h3v3h-3z"/>
            @break
        @case('quill')
            <path fill="#172F42" d="M23 1h8v8h-3v6h-3v4h-4v3h-4v3h-4v3h-3v3H7v-5h3v-5h3v-6h3V9h3V5h4zM1 27h4v4H1z"/>
            <path fill="#49B7C5" d="M25 3h4v4h-3v6h-3v4h-4v3h-4v3h-3v-2h3v-6h3V9h3V5h4z"/>
            <path fill="#A8E5DB" d="M25 3h2v4h-2v4h-4v4h-4v4h-2v-4h3V9h3V5h4z"/>
            <path fill="#EAB65C" d="M21 11h2v4h-4v4h-4v4h-3v3h-2v3H8v-3h3v-5h4v-4h4v-4h2zM1 29h4v2H1z"/>
            @break
        @case('flag')
            <path fill="#172F42" d="M5 1h4v3h10v2h10v15H17v-2H9v10h4v2H1v-2h4z"/>
            <path fill="#EAB65C" d="M7 3h2v26H7z"/>
            <path fill="#D67B5B" d="M9 6h8v2h10v11h-8v-2H9z"/>
            <path fill="#F2BC75" d="M11 6h6v2h8v3H15V9h-4z"/>
            <path fill="#FFF0C4" d="M17 10h2v2h2v2h-2v2h-2v-2h-2v-2h2z"/>
            @break
        @default
            <path fill="#172F42" d="M11 1h10v3h5v5h4v14h-4v5h-5v3H11v-3H6v-5H2V9h4V4h5z"/>
            <path fill="#EAB65C" d="M11 4h10v3h5v4h2v10h-2v4h-5v3H11v-3H6v-4H4V11h2V7h5z"/>
            <path fill="#FFF0C4" d="M12 6h8v2h4v4h2v8h-2v4h-4v2h-8v-2H8v-4H6v-8h2V8h4z"/>
            <path fill="#172F42" d="M15 5h2v3h-2zm0 19h2v3h-2zM5 15h3v2H5zm19 0h3v2h-3z"/>
            <path fill="#D67B5B" d="M16 9h3v4h3v3h-6v6h-3v-4h-3v-3h6z"/>
            <path fill="#49B7C5" d="M16 16h6v3h-3v4h-3z"/>
            <path fill="#172F42" d="M14 14h4v4h-4z"/>
    @endswitch
</svg>
