<?php
declare(strict_types=1);

date_default_timezone_set('Europe/Berlin');

$repoRoot = dirname(__DIR__, 2);
if (is_dir($repoRoot)) {
    chdir($repoRoot);
}

$sourceUrl = 'https://teiba.de/gebetszeiten.php';
$outputFile = $repoRoot . DIRECTORY_SEPARATOR . 'teiba-prayer-times.json';

$context = stream_context_create([
    'http' => [
        'timeout' => 20,
        'ignore_errors' => true,
        'header' => "User-Agent: teiba-prayer-sync/1.0\r\n",
    ],
]);

$body = @file_get_contents($sourceUrl, false, $context);
if ($body === false || $body === '') {
    fwrite(STDERR, "ERROR: Failed to fetch {$sourceUrl}\n");
    exit(1);
}

$labels = [
    'Morgengebet',
    'Sonnenaufgang',
    'Mittagsgebet',
    'Nachmittagsgebet',
    'Sonnenuntergang',
    'Nachtgebet',
    'Mitternacht',
];

$prayers = [];
foreach ($labels as $label) {
    if (!preg_match('/' . preg_quote($label, '/') . '.*?([0-2]?\d:[0-5]\d)/s', $body, $match)) {
        fwrite(STDERR, "ERROR: Could not parse time for {$label}\n");
        exit(1);
    }
    $prayers[] = [
        'label' => $label,
        'time' => $match[1],
    ];
}

$payload = [
    'sourceUrl' => $sourceUrl,
    'timezone' => 'Europe/Berlin',
    'fetchedAt' => gmdate('c'),
    'prayers' => $prayers,
];

$json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    fwrite(STDERR, "ERROR: Failed to encode prayer times JSON\n");
    exit(1);
}

$json .= "\n";

if (file_exists($outputFile) && file_get_contents($outputFile) === $json) {
    fwrite(STDOUT, "No prayer time changes.\n");
    exit(0);
}

if (file_put_contents($outputFile, $json) === false) {
    fwrite(STDERR, "ERROR: Failed to write {$outputFile}\n");
    exit(1);
}

fwrite(STDOUT, "Updated {$outputFile}\n");
exit(0);
