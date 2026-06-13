<?php
header('Content-Type: application/json');
require_once 'firestore_helper.php';

$result = [
    'firestore' => 'unknown',
    'env' => [
        'project_id' => getenv('FIREBASE_PROJECT_ID') ?: 'MISSING',
        'service_account_set' => false,
        'service_account_mode' => 'unknown'
    ],
    'local_db' => [
        'path' => LOCAL_DB_FILE,
        'exists' => file_exists(LOCAL_DB_FILE)
    ],
    'token_test' => 'not_attempted'
];

$raw = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
$result['env']['service_account_set'] = !empty($raw);
if ($raw) {
    $decoded = json_decode($raw, true);
    if ($decoded && isset($decoded['client_email'])) {
        $result['env']['service_account_mode'] = 'inline JSON — email: ' . $decoded['client_email'];
    } elseif (file_exists($raw)) {
        $result['env']['service_account_mode'] = 'file path — ' . (file_exists($raw) ? 'exists' : 'NOT FOUND');
    } else {
        $result['env']['service_account_mode'] = 'set but invalid (not valid JSON or valid file path)';
    }
} else {
    $result['env']['service_account_mode'] = 'NOT SET — check Railway env vars';
    $default_path = __DIR__ . '/firebase-service-account.json';
    $result['env']['default_file'] = $default_path . ' — ' . (file_exists($default_path) ? 'exists' : 'NOT FOUND');
}

// Try to get an access token
$token = get_firestore_access_token();
if ($token) {
    $result['token_test'] = 'OK — prefix: ' . substr($token, 0, 10) . '...';

    // Test actual Firestore read
    $ch = curl_init("https://firestore.googleapis.com/v1/projects/" . (getenv('FIREBASE_PROJECT_ID') ?: 'whatsapp-betasaas') . "/databases/(default)/documents/users/growbychat_user");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
    $response = curl_exec($ch);
    $firestore_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result['firestore'] = $firestore_code === 200 ? 'OK — user found' : ($firestore_code === 404 ? 'OK connected but user not found (need to OAuth first)' : 'FAILED — HTTP ' . $firestore_code);
    $result['firestore_response'] = substr($response, 0, 300);
} else {
    $result['token_test'] = 'FAILED — could not obtain access token';
    $result['firestore'] = 'SKIPPED — no access token';
}

echo json_encode($result, JSON_PRETTY_PRINT);
