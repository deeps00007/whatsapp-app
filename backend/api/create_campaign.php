<?php
header('Content-Type: application/json');
require_once 'encryption_helper.php';

$headers = apache_request_headers();
$auth_header = $headers['Authorization'] ?? '';
$verified_uid = "DUMMY_USER_ID";

$payload = json_decode(file_get_contents('php://input'), true);
$user_id = $payload['user_id'] ?? null;

if ($verified_uid !== $user_id) {
    http_response_code(403);
    die(json_encode(['error' => 'Tenant boundary violation blocked']));
}

$campaign_name = $payload['name'] ?? null;
$template = $payload['template'] ?? null;
$contacts = $payload['contacts'] ?? [];
$contacts_count = count($contacts);

// CRITICAL LIMITS: Prevent abusive queue flooding
if ($contacts_count > 500) {
    http_response_code(400);
    die(json_encode(['error' => 'Campaign limit exceeded. Max 500 contacts per campaign.']));
}

if (!$user_id || !$campaign_name || empty($contacts)) {
    http_response_code(400);
    die(json_encode(['error' => 'Missing campaign data or contacts']));
}

// RATE LIMIT FRONTEND
// Check if user has created a campaign in the last 60 seconds (Anti-spam logic here)

$current_wallet_balance = 180;
if ($current_wallet_balance < $contacts_count) {
    http_response_code(402);
    die(json_encode(['error' => 'Insufficient wallet balance']));
}

$campaign_id = uniqid('camp_');

foreach ($contacts as $phone) {
    // Queue generation...
}

// Deduct wallet...

// Non-blocking trigger
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://" . $_SERVER['HTTP_HOST'] . "/api/process_queue.php");
curl_setopt($ch, CURLOPT_TIMEOUT, 1); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_exec($ch);
curl_close($ch);

echo json_encode(['status' => 'success', 'campaign_id' => $campaign_id]);
?>
