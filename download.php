<?php
// Get the start date from the query string, or default to today
$dateStr = $_GET['date'] ?? date('d.m.Y');
$date = DateTime::createFromFormat('d.m.Y', $dateStr);

// Try to find the latest XML for up to 7 days
for ($i = 0; $i < 7; $i++) {
    $formattedDate = $date->format('d.m.Y');
    $url = "https://cbar.az/currencies/{$formattedDate}.xml";
    
    // Use a context to set a timeout and check headers
    $context = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true]]);
    $xml = @file_get_contents($url, false, $context);
    
    // Check if the request was successful and returned content
    if ($xml !== FALSE && strpos($http_response_header[0], "200 OK") !== false) {
        // Successfully fetched the XML, send it to the client
        header('Content-Type: application/xml');
        echo $xml;
        exit; // Stop the script
    }
    
    // If not found, go to the previous day
    $date->modify('-1 day');
}

// If no XML was found in the last 7 days, return an error
http_response_code(404);
echo "Error: Could not find currency data for the last 7 days.";
?>
