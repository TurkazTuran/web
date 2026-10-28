<?php
// Purpose: Fetch the latest 3 available currency XMLs from cbar.az,
// save them to currency-data/YYYY-MM-DD.xml, and delete older
// date-named XMLs in that folder.
// Exit code 0 = success (or source unreachable; existing files are kept).

declare(strict_types=1);

date_default_timezone_set('Asia/Baku');

// Ensure we operate from the repository root even if invoked from elsewhere.
// This script lives in .github/scripts/, so repo root is two levels up.
$repoRoot = dirname(__DIR__, 2);
if (is_dir($repoRoot)) {
    chdir($repoRoot);
}

// Ensure currency-data directory exists
$xmlDir = $repoRoot . DIRECTORY_SEPARATOR . 'currency-data';
if (!is_dir($xmlDir)) {
    if (!mkdir($xmlDir, 0777, true) && !is_dir($xmlDir)) {
        fwrite(STDERR, "ERROR: Failed to create directory: {$xmlDir}\n");
        exit(1);
    }
}

/**
 * Fetch a URL with retries. Returns [httpCode, body]; httpCode 0 means a connection failure.
 */
function fetchUrl(string $url, int $attempts = 3): array
{
    $code = 0;
    $body = false;
    for ($i = 1; $i <= $attempts; $i++) {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT        => 20,
                CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
                CURLOPT_ENCODING       => '',
                CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; currency-fetch-script/1.0)',
                CURLOPT_HTTPHEADER     => ['Accept: application/xml,text/xml,*/*'],
            ]);
            $body = curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($body === false) {
                fwrite(STDERR, "[curl error " . curl_errno($ch) . "] " . curl_error($ch) . " ");
            }
            curl_close($ch);
        } else {
            $context = stream_context_create([
                'http' => [
                    'timeout'       => 15,
                    'ignore_errors' => true,
                    'header'        => "User-Agent: currency-fetch-script/1.0\r\n",
                ],
            ]);
            $body = @file_get_contents($url, false, $context);
            $code = 0;
            if (isset($http_response_header[0]) && preg_match('/HTTP\/[^ ]+ (\d{3})/', $http_response_header[0], $m)) {
                $code = (int)$m[1];
            }
        }
        // Retry only on connection failures or server errors
        if ($code !== 0 && $code < 500) {
            break;
        }
        if ($i < $attempts) {
            sleep(2);
        }
    }
    return [$code, is_string($body) ? $body : ''];
}

$daysToKeep   = 3;   // Keep this many most recent valid days
$searchWindow = 21;  // Look back up to this many days to find valid data
$retained     = [];  // Filenames we will keep (YYYY-MM-DD.xml)
$today        = new DateTime('today');

fwrite(STDOUT, "Starting currency management in {$xmlDir}. Need {$daysToKeep} valid day(s). Searching up to {$searchWindow} days back.\n");

for ($offset = 0; $offset < $searchWindow && count($retained) < $daysToKeep; $offset++) {
    $d = (clone $today)->modify("-{$offset} day");
    $dateForUrl  = $d->format('d.m.Y');   // cbar.az format
    $dateForFile = $d->format('Y-m-d');   // local filename
    $targetFile  = $xmlDir . DIRECTORY_SEPARATOR . $dateForFile . '.xml';
    $targetName  = $dateForFile . '.xml'; // name only for logs
    $url         = "https://cbar.az/currencies/{$dateForUrl}.xml";

    fwrite(STDOUT, "Attempting: {$url} ... ");

    [$code, $body] = fetchUrl($url);

    if ($code !== 200 || !$body) {
        fwrite(STDOUT, "not available (HTTP {$code}).\n");
        continue;
    }

    // Validate XML quickly
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($body);
    $errors = libxml_get_errors();
    libxml_clear_errors();

    if ($xml === false || !$xml->getName() || strtolower($xml->getName()) !== 'valcurs') {
        fwrite(STDOUT, "invalid XML structure.\n");
        if (!empty($errors)) {
            fwrite(STDOUT, "XML errors:\n");
            foreach ($errors as $error) {
                fwrite(STDOUT, trim($error->message) . "\n");
            }
        }
        continue;
    }

    // Save only if content differs to avoid unnecessary commits
    $needsWrite = true;
    if (file_exists($targetFile)) {
        $existing = file_get_contents($targetFile);
        if ($existing === $body) {
            $needsWrite = false;
            fwrite(STDOUT, "unchanged, already present at {$targetName}.\n");
        }
    }

    if ($needsWrite) {
        file_put_contents($targetFile, $body);
        fwrite(STDOUT, "saved to currency-data/{$targetName}.\n");
    }

    // Track by basename to match cleanup pattern later
    $retained[] = $targetName;
}

if (empty($retained)) {
    // Source may be unreachable; keep existing data and do not fail the workflow
    fwrite(STDOUT, "WARNING: No valid currency XML found in the last {$searchWindow} days. Keeping existing files.\n");
    exit(0);
}

fwrite(STDOUT, "\nRetained files: " . implode(', ', $retained) . "\n");

// Cleanup: delete date-named XMLs (YYYY-MM-DD.xml) in currency-data not in retained list
$pattern = '/^\d{4}-\d{2}-\d{2}\.xml$/';
$allXml = glob($xmlDir . DIRECTORY_SEPARATOR . '*.xml') ?: [];
$deleted = 0;

foreach ($allXml as $filePath) {
    $file = basename($filePath);
    if (!preg_match($pattern, $file)) {
        // Skip non date-pattern XML files
        continue;
    }
    if (!in_array($file, $retained, true)) {
        @unlink($filePath);
        fwrite(STDOUT, "Deleted old file: currency-data/{$file}\n");
        $deleted++;
    }
}

fwrite(STDOUT, $deleted ? "Deleted {$deleted} old file(s).\n" : "No old files to delete.\n");
fwrite(STDOUT, "Done.\n");
exit(0);
