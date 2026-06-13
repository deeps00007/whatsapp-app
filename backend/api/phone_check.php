<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET');

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id parameter']);
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

if (empty($encrypted_token)) {
    http_response_code(400);
    echo json_encode(['error' => 'No access token stored. Re-OAuth required.']);
    exit;
}

$access_token = decrypt_token($encrypted_token);
if (!$access_token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token decryption failed.']);
    exit;
}

$result = [
    'waba_id' => $waba_id,
    'phone_number_id' => $phone_number_id,
    'phone_number' => $profile['phone_number'] ?? '',
    'phone_verification' => null,
    'all_phones' => [],
    'waba_details' => null
];

if (!empty($phone_number_id)) {
    $phone_url = "https://graph.facebook.com/v23.0/" . urlencode($phone_number_id) . "?access_token=" . urlencode($access_token);
    $ch = curl_init($phone_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $phone_response = curl_exec($ch);
    $phone_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($phone_code === 200) {
        $result['phone_verification'] = json_decode($phone_response, true);
    } else {
        $result['phone_verification'] = ['error' => 'HTTP ' . $phone_code, 'body' => substr($phone_response, 0, 300)];
    }
}

if (!empty($waba_id)) {
    $all_phones_url = "https://graph.facebook.com/v23.0/" . urlencode($waba_id) . "/phone_numbers?access_token=" . urlencode($access_token);
    $ch = curl_init($all_phones_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $all_response = curl_exec($ch);
    $all_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($all_code === 200) {
        $all_data = json_decode($all_response, true);
        $result['all_phones'] = $all_data['data'] ?? [];
    } else {
        $result['all_phones'] = ['error' => 'HTTP ' . $all_code, 'body' => substr($all_response, 0, 300)];
    }

    $waba_url = "https://graph.facebook.com/v23.0/" . urlencode($waba_id) . "?fields=name,currency_id,message_template_category,primary_phone_number,account_review_status,business_id&access_token=" . urlencode($access_token);
    $ch = curl_init($waba_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $waba_response = curl_exec($ch);
    $waba_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($waba_code === 200) {
        $result['waba_details'] = json_decode($waba_response, true);
    } else {
        $result['waba_details'] = ['error' => 'HTTP ' . $waba_code, 'body' => substr($waba_response, 0, 300)];
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);
exit;
