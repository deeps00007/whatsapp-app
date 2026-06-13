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
$waba_id = $profile['waba_id'] ?? '';

// Auto-re-discover phone number if missing from profile
// (e.g. user added a phone number after initial OAuth)
if (empty($profile['phone_number_id']) && !empty($encrypted_token) && !empty($waba_id)) {
    $decrypted_token = decrypt_token($encrypted_token);
    if ($decrypted_token && strpos($decrypted_token, 'MOCK_') !== 0) {
        $phone_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/phone_numbers?access_token=" . urlencode($decrypted_token);
        $ch = curl_init($phone_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $phone_response = curl_exec($ch);
        $phone_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($phone_code === 200) {
            $phone_data = json_decode($phone_response, true);
            $phone_list = $phone_data['data'] ?? [];
            foreach ($phone_list as $entry) {
                if (!empty($entry['id']) && !empty($entry['display_phone_number'])) {
                    $profile['phone_number_id'] = $entry['id'];
                    $profile['phone_number'] = $entry['display_phone_number'];
                    break;
                }
            }
            if (empty($profile['phone_number_id']) && isset($phone_data['data'][0]['id'])) {
                $profile['phone_number_id'] = $phone_data['data'][0]['id'];
                $profile['phone_number'] = $phone_data['data'][0]['display_phone_number']
                    ?? $phone_data['data'][0]['verified_name']
                    ?? '';
            }

            // Persist the re-discovered phone to Firestore
            if (!empty($profile['phone_number_id'])) {
                firestore_set_user($user_id, [
                    'user_id' => $user_id,
                    'waba_id' => $profile['waba_id'],
                    'phone_number_id' => $profile['phone_number_id'],
                    'phone_number' => $profile['phone_number'],
                    'business_name' => $profile['business_name'] ?? '',
                    'fb_access_token' => $encrypted_token,
                    'connected_at' => $profile['connected_at'] ?? time()
                ]);
            }
        }
    }
}

// Security Boundary: Remove confidential access token before serving profile data
unset($profile['fb_access_token']);

$debug_fields = [];
foreach ($profile as $k => $v) {
    if ($k === '_debug') continue;
    $debug_fields[$k] = empty($v) ? 'EMPTY' : (is_string($v) ? substr($v, 0, 60) : $v);
}
$profile['_debug'] = $debug_fields;

echo json_encode($profile);
exit;
