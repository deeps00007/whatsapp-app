<?php
require_once 'encryption_helper.php';

// Meta redirects back to this endpoint after user grants permission
$code = $_GET['code'] ?? null;
$state_raw = $_GET['state'] ?? null;

if (!$code || !$state_raw) {
    die("Missing auth code or state");
}

// 1. Strict State/CSRF Validation
$state = json_decode(base64_decode($state_raw), true);
$user_id = $state['user_id'] ?? null;
$nonce = $state['nonce'] ?? null;

if (!$user_id) {
    http_response_code(400);
    die("Invalid state payload - potential CSRF attack blocked.");
}
// Note: In a real system, you would check if $nonce matches a saved nonce in the DB for $user_id.

// 2. Exchange code for token securely (backend to Meta direct communication)
// $tokenUrl = "...";
// $response = file_get_contents($tokenUrl);
// $long_lived_token = json_decode($response)->access_token;
$long_lived_token = "MOCK_LONG_LIVED_TOKEN_FROM_META"; 

// 3. Encrypt token securely using AES-256
$encrypted_token = encrypt_token($long_lived_token);

// 4. Save strictly mapping to $user_id in DB (Firestore REST API or local DB)
// update_user_token($user_id, $encrypted_token);

// 5. Redirect back to app via Deep Link
header("Location: whatsappsaas://connected");
exit;
?>
