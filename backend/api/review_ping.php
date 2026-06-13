<?php
// review_ping.php
// Comprehensive diagnostic for Meta App Review API detection.
// Tests multiple tokens and endpoints to find what actually works.
// *** PRODUCTION LOCK: Only accessible from localhost. ***

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET');

$is_local = (isset($_SERVER['HTTP_HOST']) && in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1']));
if (!$is_local) {
    http_response_code(403);
    die(json_encode(['error' => 'Diagnostic endpoint not available in production.']));
}

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

function meta_api_get($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $decoded = json_decode($response, true);
    return [
        'http_code' => $http_code,
        'response' => $decoded ?: $response
    ];
}

$user_id = $_GET['user_id'] ?? 'growbychat_user';
$user_profile = firestore_get_user($user_id);

$results = [
    'diagnostic_time' => date('c'),
    'user_id' => $user_id,
    'tests' => []
];

// Token 1: OAuth user token from Firestore
$oauth_token = null;
if ($user_profile && !empty($user_profile['fb_access_token'])) {
    $oauth_token = decrypt_token($user_profile['fb_access_token']);
}

// Token 2: Test token from environment
$test_token = getenv('META_TEST_ACCESS_TOKEN') ?: '';

$test_waba_id = '26533673862921106';
$test_phone_number_id = '1146682351850264';

// ============================================================
// TEST 1: Debug OAuth token scopes
// ============================================================
if ($oauth_token && strpos($oauth_token, 'MOCK_') !== 0) {
    $debug_url = "https://graph.facebook.com/debug_token?input_token=" . urlencode($oauth_token) . "&access_token=" . urlencode($oauth_token);
    $results['tests']['oauth_token_debug'] = meta_api_get($debug_url);
} else {
    $results['tests']['oauth_token_debug'] = ['error' => 'No valid OAuth token found (mock or missing)'];
}

// ============================================================
// TEST 2: OAuth token → /me/whatsapp_business_accounts
// ============================================================
if ($oauth_token && strpos($oauth_token, 'MOCK_') !== 0) {
    $url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($oauth_token);
    $results['tests']['oauth_me_waba'] = meta_api_get($url);
} else {
    $results['tests']['oauth_me_waba'] = ['error' => 'Skipped — no valid OAuth token'];
}

// ============================================================
// TEST 3: Test token → /me/whatsapp_business_accounts
// ============================================================
if (!empty($test_token)) {
    $url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($test_token);
    $results['tests']['test_me_waba'] = meta_api_get($url);
} else {
    $results['tests']['test_me_waba'] = ['error' => 'Skipped — META_TEST_ACCESS_TOKEN not set'];
}

// ============================================================
// TEST 4: OAuth token → /{test_waba_id}/message_templates
// ============================================================
if ($oauth_token && strpos($oauth_token, 'MOCK_') !== 0) {
    $url = "https://graph.facebook.com/v23.0/" . $test_waba_id . "/message_templates?access_token=" . urlencode($oauth_token);
    $results['tests']['oauth_waba_templates'] = meta_api_get($url);
} else {
    $results['tests']['oauth_waba_templates'] = ['error' => 'Skipped — no valid OAuth token'];
}

// ============================================================
// TEST 5: Test token → /{test_waba_id}/message_templates
// ============================================================
if (!empty($test_token)) {
    $url = "https://graph.facebook.com/v23.0/" . $test_waba_id . "/message_templates?access_token=" . urlencode($test_token);
    $results['tests']['test_waba_templates'] = meta_api_get($url);
} else {
    $results['tests']['test_waba_templates'] = ['error' => 'Skipped — META_TEST_ACCESS_TOKEN not set'];
}

// ============================================================
// TEST 6: OAuth token → /{test_waba_id}/phone_numbers
// ============================================================
if ($oauth_token && strpos($oauth_token, 'MOCK_') !== 0) {
    $url = "https://graph.facebook.com/v23.0/" . $test_waba_id . "/phone_numbers?access_token=" . urlencode($oauth_token);
    $results['tests']['oauth_waba_phones'] = meta_api_get($url);
} else {
    $results['tests']['oauth_waba_phones'] = ['error' => 'Skipped — no valid OAuth token'];
}

// ============================================================
// TEST 7: Test token → /{test_waba_id}/phone_numbers
// ============================================================
if (!empty($test_token)) {
    $url = "https://graph.facebook.com/v23.0/" . $test_waba_id . "/phone_numbers?access_token=" . urlencode($test_token);
    $results['tests']['test_waba_phones'] = meta_api_get($url);
} else {
    $results['tests']['test_waba_phones'] = ['error' => 'Skipped — META_TEST_ACCESS_TOKEN not set'];
}

// ============================================================
// TEST 8: OAuth token → /{test_phone_number_id}
// ============================================================
if ($oauth_token && strpos($oauth_token, 'MOCK_') !== 0) {
    $url = "https://graph.facebook.com/v23.0/" . $test_phone_number_id . "?access_token=" . urlencode($oauth_token);
    $results['tests']['oauth_phone_detail'] = meta_api_get($url);
} else {
    $results['tests']['oauth_phone_detail'] = ['error' => 'Skipped — no valid OAuth token'];
}

// ============================================================
// TEST 9: Test token → /{test_phone_number_id}
// ============================================================
if (!empty($test_token)) {
    $url = "https://graph.facebook.com/v23.0/" . $test_phone_number_id . "?access_token=" . urlencode($test_token);
    $results['tests']['test_phone_detail'] = meta_api_get($url);
} else {
    $results['tests']['test_phone_detail'] = ['error' => 'Skipped — META_TEST_ACCESS_TOKEN not set'];
}

// ============================================================
// SUMMARY & RECOMMENDATIONS
// ============================================================
$working_calls = [];
foreach ($results['tests'] as $name => $test) {
    if (isset($test['http_code']) && $test['http_code'] === 200) {
        $working_calls[] = $name;
    }
}

$results['summary'] = [
    'working_calls' => $working_calls,
    'working_count' => count($working_calls),
    'recommendation' => count($working_calls) > 0
        ? 'Use the working endpoint(s) in your backend to trigger Meta detection.'
        : 'NO calls succeeded. Your OAuth token likely lacks whatsapp_business_management scope. Disconnect and reconnect with auth_type=rerequest to force re-consent.'
];

// If OAuth token debug worked, extract scopes for visibility
if (isset($results['tests']['oauth_token_debug']['response']['data']['scopes'])) {
    $results['summary']['oauth_scopes'] = $results['tests']['oauth_token_debug']['response']['data']['scopes'];
}
if (isset($results['tests']['oauth_token_debug']['response']['data']['error'])) {
    $results['summary']['oauth_token_error'] = $results['tests']['oauth_token_debug']['response']['data']['error'];
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>