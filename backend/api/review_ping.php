<?php
// review_ping.php
// Manual endpoint to trigger whatsapp_business_management API calls
// for Meta App Review detection. Call this directly in browser after OAuth.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET');

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

$user_id = $_GET['user_id'] ?? 'growbychat_user';
$user_profile = firestore_get_user($user_id);

if (!$user_profile || empty($user_profile['fb_access_token'])) {
    http_response_code(404);
    echo json_encode(['error' => 'No profile found. Complete OAuth first.']);
    exit;
}

$decrypted_token = decrypt_token($user_profile['fb_access_token']);
if (!$decrypted_token) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to decrypt stored token.']);
    exit;
}
if (strpos($decrypted_token, 'MOCK_') === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Stored token is a mock token. Complete live OAuth first.']);
    exit;
}

$results = [];
$waba_id = $user_profile['waba_id'] ?? '';

// Call 1: /me/whatsapp_business_accounts (discover WABA)
$me_url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($decrypted_token);
$ch1 = curl_init($me_url);
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
$r1 = curl_exec($ch1);
$code1 = curl_getinfo($ch1, CURLINFO_HTTP_CODE);
curl_close($ch1);

$results['me_whatsapp_business_accounts'] = [
    'http_code' => $code1,
    'response_preview' => substr($r1, 0, 300)
];

if ($code1 === 200) {
    $me_data = json_decode($r1, true);
    if (isset($me_data['data'][0]['id'])) {
        $waba_id = $me_data['data'][0]['id'];
    }
}

if (empty($waba_id)) {
    echo json_encode([
        'status' => 'waba_discovery_failed',
        'token_prefix' => substr($decrypted_token, 0, 10) . '...',
        'calls' => $results,
        'message' => 'Could not discover WABA ID. The token may be expired or lack whatsapp_business_management permission. Please disconnect and reconnect via Facebook OAuth to get a fresh token.'
    ]);
    exit;
}

// Call 2: /{waba_id}/phone_numbers (management API)
$phone_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/phone_numbers?access_token=" . urlencode($decrypted_token);
$ch2 = curl_init($phone_url);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
$r2 = curl_exec($ch2);
$code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
$results['waba_phone_numbers'] = ['http_code' => $code2, 'response_preview' => substr($r2, 0, 300)];

// Call 3: /{waba_id}/message_templates (management API)
$tmpl_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/message_templates?access_token=" . urlencode($decrypted_token);
$ch3 = curl_init($tmpl_url);
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
$r3 = curl_exec($ch3);
$code3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);
$results['waba_message_templates'] = ['http_code' => $code3, 'response_preview' => substr($r3, 0, 300)];

$all_ok = ($code1 === 200 && $code2 === 200 && $code3 === 200);

echo json_encode([
    'status' => $all_ok ? 'ping_complete' : 'partial_failure',
    'waba_id_discovered' => $waba_id,
    'token_prefix' => substr($decrypted_token, 0, 10) . '...',
    'calls' => $results,
    'message' => $all_ok
        ? 'All management API calls returned 200. Meta should detect these within 24 hours. If not, use Graph API Explorer to manually trigger the calls.'
        : 'Some calls failed. Check response_previews for exact Meta errors. Common causes: expired token (reconnect OAuth), missing permission, or API version mismatch.'
]);
?>