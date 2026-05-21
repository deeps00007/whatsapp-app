<?php
header('Content-Type: application/json');
define('APP_SECRET', 'YOUR_META_APP_SECRET');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $verify_token = "YOUR_CUSTOM_VERIFY_TOKEN";
    if (isset($_GET['hub_mode']) && $_GET['hub_verify_token'] === $verify_token) {
        echo $_GET['hub_challenge'];
        exit;
    }
    http_response_code(403);
    exit;
}

$payload = file_get_contents('php://input');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
    $expected_signature = 'sha256=' . hash_hmac('sha256', $payload, APP_SECRET);
    
    if (!hash_equals($expected_signature, $signature)) {
        http_response_code(401);
        die(json_encode(['error' => 'Invalid signature']));
    }

    $data = json_decode($payload, true);

    if (isset($data['entry'][0]['changes'][0]['value']['statuses'])) {
        $statuses = $data['entry'][0]['changes'][0]['value']['statuses'];
        foreach ($statuses as $status) {
            $message_id = $status['id'];
            $status_type = $status['status']; 
            
            // WEBHOOK DUPLICATE PREVENTION:
            // Check Firestore if message_id == $message_id AND current_status == $status_type. 
            // If already matches, SKIP update to save Firebase write costs and analytics jumps.
            
            // TODO: Firestore status transaction update
            error_log("Verified Status Update: $message_id -> $status_type");
        }
    }

    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}
?>
