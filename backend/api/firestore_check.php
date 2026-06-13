<?php
header('Content-Type: application/json');
require_once 'firestore_helper.php';

$result = [
    'firestore' => 'unknown',
    'env' => [
        'project_id' => getenv('FIREBASE_PROJECT_ID') ?: 'MISSING',
        'service_account_path' => 'MISSING',
        'service_account_exists' => false
    ],
    'local_db' => [
        'path' => __DIR__ . '/database.json',
        'exists' => file_exists(__DIR__ . '/database.json')
    ],
    'token_test' => 'not_attempted'
];

$sa_path = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
if (!$sa_path) {
    $sa_path = __DIR__ . '/firebase-service-account.json';
}

$result['env']['service_account_path'] = $sa_path;
$result['env']['service_account_exists'] = file_exists($sa_path);

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
