<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

$input = json_decode(file_get_contents('php://input'), true);

$user_id = $input['user_id'] ?? null;
$code = $input['code'] ?? null;

if (!$user_id || !$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id or code']);
    exit;
}

if (!preg_match('/^\d{6}$/', $code)) {
    http_response_code(400);
    echo json_encode(['error' => 'Code must be exactly 6 digits.']);
    exit;
}

$profile = firestore_get_user($user_id);
if (!$profile) {
    http_response_code(404);
    echo json_encode(['error' => 'Profile not found']);
    exit;
}

$encrypted_token = $profile['fb_access_token'] ?? '';
$phone_number_id = $profile['phone_number_id'] ?? '';

if (empty($encrypted_token) || empty($phone_number_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing access token or phone number ID. Re-OAuth required.']);
    exit;
}

$access_token = decrypt_token($encrypted_token);
if (!$access_token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token decryption failed.']);
    exit;
}

$url = "https://graph.facebook.com/v23.0/" . urlencode($phone_number_id) . "/verify_code";

$payload = [
    'code' => $code
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token,
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

error_log("[verify_code] user=$user_id phone_id=$phone_number_id code=$code HTTP=$http_code body=" . substr($response, 0, 300));

if ($http_code === 200) {
    $profile['phone_verified'] = 'true';
    firestore_set_user($user_id, $profile);

    echo json_encode(['success' => true, 'message' => 'Phone number verified successfully! You can now send messages.']);
} else {
    $err = json_decode($response, true);
    $msg = $err['error']['message'] ?? 'Unknown error';
    $meta_code = $err['error']['code'] ?? 0;
    http_response_code($http_code);
    echo json_encode([
        'error' => "Verification failed: $msg",
        'meta_code' => $meta_code,
        'hints' => [
            130421 => 'Incorrect code. Please check and try again.',
            130422 => 'Code has expired. Request a new verification code.',
            130423 => 'Too many failed attempts. Wait a few minutes before trying again.',
        ][$meta_code] ?? null
    ]);
}
exit;
