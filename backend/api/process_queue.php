<?php
header('Content-Type: application/json');
require_once 'encryption_helper.php';

$limit = 20; 
$now = time(); // Ensure server is set to UTC natively

// 1. Fetch pending messages safely
$messages = []; // Mock fetching messages where status='pending' and next_attempt_at <= $now

$decrypted_tokens = [];

foreach ($messages as $msg) {
    $doc_id = $msg['id'];
    $user_id = $msg['user_id'];
    $phone = $msg['phone'];
    $template = $msg['template'];
    $retry_count = $msg['retry_count'];

    // CRITICAL LOCK: Use transactional update to mark processing first
    // If update fails (someone else locked it), skip this message!

    if (!isset($decrypted_tokens[$user_id])) {
        $decrypted_tokens[$user_id] = "MOCK_TOKEN";
    }
    $waba_token = $decrypted_tokens[$user_id];

    // SEND MESSAGE
    $result = ['success' => true, 'message_id' => 'wamid.' . uniqid()]; 

    if ($result['success']) {
        // SUCCESS update
    } else {
        $new_retry_count = $retry_count + 1;
        if ($new_retry_count < 2) {
            // Re-queue with 30-second delay (UTC based)
        } else {
            // Final Failure - Record reason string (e.g. "Template not approved") for user visibility
        }
    }
}

echo json_encode(["status" => "Queue batch processed", "count" => count($messages)]);
?>
