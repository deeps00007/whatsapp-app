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

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id']);
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
$waba_id = $profile['waba_id'] ?? '';

if (empty($encrypted_token) || empty($phone_number_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing access token or phone number ID.']);
    exit;
}

$access_token = decrypt_token($encrypted_token);
if (!$access_token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token decryption failed.']);
    exit;
}

// Query Meta for current verification status
$check_url = "https://graph.facebook.com/v21.0/" . urlencode($phone_number_id) . "?fields=code_verification_status&access_token=" . urlencode($access_token);
$ch = curl_init($check_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200) {
    $data = json_decode($response, true);
    $status = $data['code_verification_status'] ?? 'UNKNOWN';

    if ($status === 'VERIFIED') {
        $profile['phone_verified'] = 'true';
        firestore_set_user($user_id, $profile);
        echo json_encode(['success' => true, 'verified' => true, 'message' => 'Phone number is already verified!']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'verified' => false,
        'code_verification_status' => $status,
        'verification_url' => "https://business.facebook.com/wa/manage/phone-numbers/?waba_id={$waba_id}",
        'message' => 'Phone number is not yet verified. Open the verification URL in Meta Business Manager to verify via SMS or voice call.'
    ]);
} else {
    echo json_encode([
        'success' => true,
        'verified' => false,
        'verification_url' => "https://business.facebook.com/wa/manage/phone-numbers/?waba_id={$waba_id}",
        'message' => 'Could not check status. Open the verification URL to verify your phone number.'
    ]);
}
exit;
