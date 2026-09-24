<?php

// Route every Vercel Function request through Laravel's normal front
// controller while keeping the application's public directory as the web root.
require __DIR__.'/../public/index.php';
