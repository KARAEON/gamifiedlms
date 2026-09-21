<?php
$a = 'tools/php83/runtime/test.tmp';
file_put_contents($a, 'x');
var_dump(rename($a, 'tools/php83/runtime/test.php'));
