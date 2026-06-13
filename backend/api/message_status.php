<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET');

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

$user_id = $_GET['user_id'] ?? null;
$message_id = $_GET['message_id'] ?? null;

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

if (empty($encrypted_token)) {
    http_response_code(400);
    echo json_encode(['error' => 'No access token. Re-OAuth required.']);
    exit;
}

$access_token = decrypt_token($encrypted_token);
if (!$access_token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token decryption failed.']);
    exit;
}

if ($message_id) {
    $status_url = "https://graph.facebook.com/v23.0/" . urlencode($message_id) . "?fields=id,status,timestamp,to,from&access_token=" . urlencode($access_token);
    $ch = curl_init($status_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        echo $response;
    } else {
        http_response_code($http_code);
        echo json_encode(['error' => 'Meta API returned HTTP ' . $http_code, 'details' => json_decode($response, true)]);
    }
    exit;
}

$all_messages = firestore_get_messages($user_id);
$enriched = [];
foreach ($all_messages as $msg) {
    $mid = $msg['message_id'] ?? '';
    if (!empty($mid) && strpos($mid, 'wamid.') === 0) {
        $status_url = "https://graph.facebook.com/v23.0/" . urlencode($mid) . "?fields=id,status,to&access_token=" . urlencode($access_token);
        $ch = curl_init($status_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200) {
            $meta = json_decode($resp, true);
            $msg['meta_status'] = $meta['status'] ?? null;
        }
    }
    $enriched[] = $msg;
}

echo json_encode(['messages' => $enriched], JSON_PRETTY_PRINT);
exit;
