<?php
// Set a default timezone to avoid potential issues with date functions
date_default_timezone_set('Asia/Baku');

// Start with today's date
$date = new DateTime();

// Loop backwards for up to 7 days to find the latest valid currency data
for ($i = 0; $i < 7; $i++) {
    $formattedDate = $date->format('d.m.Y');
    $url = "https://cbar.az/currencies/{$formattedDate}.xml";
    
    // Using a stream context is often more reliable and requires no extensions
    $context = stream_context_create(['http' => [
        'timeout' => 10,
        'ignore_errors' => true // Allows us to read the response body on errors
    ]]);
    
    $response = @file_get_contents($url, false, $context);
    
    // $http_response_header is automatically populated by file_get_contents
    $http_code = 0;
    if (isset($http_response_header[0])) {
        preg_match('/HTTP\/1\.[01] (\d{3})/', $http_response_header[0], $matches);
        if (isset($matches[1])) {
            $http_code = (int)$matches[1];
        }
    }

    // Now, check for a successful response AND valid XML content
    if ($http_code === 200 && $response) {
        // Suppress errors for invalid XML and check the result
        libxml_use_internal_errors(true);
        $xmlObject = simplexml_load_string($response);
        libxml_clear_errors();
        
        // If simplexml_load_string returns an object, the XML is well-formed
        if ($xmlObject !== false) {
            // Success! Send the valid XML to the client and stop.
            header('Content-Type: application/xml');
            echo $response;
            exit;
        }
    }
    
    // If we're here, it failed. Go to the previous day and try again.
    $date->modify('-1 day');
}

// If the loop completes without finding any valid XML, return an error.
http_response_code(404);
echo "Failed to retrieve valid currency XML from cbar.az for the last 7 days.";
?>
