<?php
$date = $_GET['date']; // e.g. 07.11.2025
$url = "https://cbar.az/currencies/$date.xml";

$xml = @file_get_contents($url);

if ($xml === FALSE) {
    http_response_code(500);
    echo "Error fetching XML for $date";
} else {
    header('Content-Disposition: attachment; filename="'.$date.'.xml"');
    header('Content-Type: application/xml');
    echo $xml;
}
?>
