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
$method = $input['method'] ?? 'SMS';
$languages = $input['languages'] ?? ['en'];

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
    exit;
}

if (!in_array($method, ['SMS', 'VOICE'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid method. Use SMS or VOICE.']);
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

$api_versions = ['v21.0', 'v20.0', 'v19.0', 'v18.0'];
$success = false;
$last_error = '';

foreach ($api_versions as $ver) {
    $url = "https://graph.facebook.com/{$ver}/" . urlencode($phone_number_id) . "/request_verification_code";

    $payload = [
        'code_method' => $method,
        'language' => $languages
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

    error_log("[request_verification] ver=$ver user=$user_id method=$method HTTP=$http_code body=" . substr($response, 0, 300));

    if ($http_code === 200) {
        echo json_encode(['success' => true, 'message' => "Verification code sent via $method to your phone number.", 'api_version' => $ver]);
        $success = true;
        break;
    }

    $err_data = json_decode($response, true);
    $err_msg = $err_data['error']['message'] ?? '';
    $err_code = $err_data['error']['code'] ?? 0;
    $last_error = $err_msg;

    // If the error is NOT about unknown path, stop trying other versions
    if (strpos($err_msg, 'Unknown path') === false && strpos($err_msg, 'does not exist') === false) {
        break;
    }
}

if (!$success) {
    $err = json_decode($response, true);
    $msg = $err['error']['message'] ?? 'Unknown error';
    $meta_code = $err['error']['code'] ?? 0;
    http_response_code(400);
    echo json_encode([
        'error' => "Failed to send verification code: $msg",
        'meta_code' => $meta_code,
        'hint' => [
            130401 => 'Too many attempts. Wait a few minutes before trying again.',
            130402 => 'Phone number is already verified.',
            130403 => 'This phone number is not eligible for verification via this method. Try VOICE instead.',
            130404 => 'Verification code sending failed. Try again later.'
        ][$meta_code] ?? 'If this persists, verify manually in Meta Business Manager → WhatsApp → Phone Numbers.'
    ]);
}
exit;
