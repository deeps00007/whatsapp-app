<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Webhook-Simulator, X-Hub-Signature-256');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'firestore_helper.php';

define('APP_SECRET', getenv('FACEBOOK_APP_SECRET') ?: 'YOUR_META_APP_SECRET');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $verify_token = "growbychat_waba_webhook_verify_token_5124efbb";
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
    
    // Check if the request is a local high-fidelity dashboard simulator trigger
    $is_simulation = (isset($_SERVER['HTTP_X_WEBHOOK_SIMULATOR']) && $_SERVER['HTTP_X_WEBHOOK_SIMULATOR'] === 'growbychat_sim_secret_5124efbb');
    
    // Strict signature check if APP_SECRET is configured and this isn't a mock simulation
    if (APP_SECRET !== 'YOUR_META_APP_SECRET' && !empty(APP_SECRET) && !$is_simulation) {
        $expected_signature = 'sha256=' . hash_hmac('sha256', $payload, APP_SECRET);
        if (!hash_equals($expected_signature, $signature)) {
            http_response_code(401);
            die(json_encode(['error' => 'Invalid signature']));
        }
    }

    $data = json_decode($payload, true);

    if (isset($data['entry'][0]['changes'][0]['value']['statuses'])) {
        $statuses = $data['entry'][0]['changes'][0]['value']['statuses'];
        foreach ($statuses as $status) {
            $message_id = $status['id'];
            $status_type = $status['status']; 
            
            // WEBHOOK DUPLICATE PREVENTION & WEIGHT FILTERING:
            $msg = firestore_get_message($message_id);
            if ($msg) {
                $current_status = $msg['status'] ?? 'sent';
                
                // Define weights to prevent downgrading statuses (e.g. read -> delivered)
                $status_weights = ['sent' => 1, 'delivered' => 2, 'read' => 3];
                $current_weight = $status_weights[$current_status] ?? 1;
                $new_weight = $status_weights[$status_type] ?? 1;
                
                if ($new_weight > $current_weight) {
                    $msg['status'] = $status_type;
                    $msg['updated_at'] = time();
                    
                    firestore_set_message($message_id, $msg);
                    error_log("Verified Status Update Success: $message_id -> $status_type");
                } else {
                    error_log("Verified Status Update Skipped (Already at higher/equal status): $message_id: current: $current_status, new: $status_type");
                }
            } else {
                error_log("Verified Status Update Ignored (Message not found in DB): $message_id -> $status_type");
            }
        }
    }

    http_response_code(200);
    echo json_encode(['status' => 'success']);
    exit;
}
?>
