<?php
$file = __DIR__ . '/database.sqlite';
try {
  $pdo = new PDO('sqlite:' . $file);
  $pdo->exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, n TEXT)');
  echo "ok\n";
} catch (Throwable $e) {
  echo $e->getMessage() . "\n";
}
