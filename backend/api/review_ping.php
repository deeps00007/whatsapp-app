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
if (!$decrypted_token || strpos($decrypted_token, 'MOCK_') === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Token is missing or is a mock token. Complete live OAuth first.']);
    exit;
}

$test_waba_id = '26533673862921106';
$waba_id = !empty($user_profile['waba_id']) ? $user_profile['waba_id'] : $test_waba_id;

$results = [];

// Call 1: /me/whatsapp_business_accounts
$me_url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($decrypted_token);
$ch1 = curl_init($me_url);
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
$r1 = curl_exec($ch1);
$code1 = curl_getinfo($ch1, CURLINFO_HTTP_CODE);
curl_close($ch1);
$results['me_whatsapp_business_accounts'] = ['http_code' => $code1, 'response_preview' => substr($r1, 0, 200)];

// Call 2: /{waba_id}/phone_numbers
$phone_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/phone_numbers?access_token=" . urlencode($decrypted_token);
$ch2 = curl_init($phone_url);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
$r2 = curl_exec($ch2);
$code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
$results['waba_phone_numbers'] = ['http_code' => $code2, 'response_preview' => substr($r2, 0, 200)];

// Call 3: /{waba_id}/message_templates
$tmpl_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/message_templates?access_token=" . urlencode($decrypted_token);
$ch3 = curl_init($tmpl_url);
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
$r3 = curl_exec($ch3);
$code3 = curl_getinfo($ch3, CURLINFO_HTTP_CODE);
curl_close($ch3);
$results['waba_message_templates'] = ['http_code' => $code3, 'response_preview' => substr($r3, 0, 200)];

// All three are core whatsapp_business_management calls
echo json_encode([
    'status' => 'ping_complete',
    'waba_id_used' => $waba_id,
    'token_prefix' => substr($decrypted_token, 0, 10) . '...',
    'calls' => $results,
    'message' => 'If all http_code values are 200, Meta should detect these calls within 24 hours. If 401, your token expired — get a fresh one from Meta Dashboard.'
]);
?>