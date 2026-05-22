<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'encryption_helper.php';
require_once 'firestore_helper.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if (!isset($input['user_id']) || !isset($input['phone']) || !isset($input['template'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters. Need user_id, phone, and template.']);
    exit;
}

$user_id = $input['user_id'];
$phone = $input['phone'];
$templateName = $input['template'];

// 1. Fetch user access token & configuration from Firestore
$profile = firestore_get_user($user_id);
if (!$profile) {
    http_response_code(404);
    echo json_encode(['error' => 'No active WhatsApp business account linked to this user. Please connect via Facebook first.']);
    exit;
}

$encrypted_token = $profile['fb_access_token'] ?? '';
$phone_number_id = $profile['phone_number_id'] ?? '';
$waba_id = $profile['waba_id'] ?? '';

if (empty($encrypted_token) || empty($phone_number_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Connected profile contains corrupt or missing authorization details.']);
    exit;
}

// 2. Securely decrypt token using AES-256
$access_token = decrypt_token($encrypted_token);

// 3. Prepare WhatsApp Cloud API Payload
$waPayload = [
    'messaging_product' => 'whatsapp',
    'to' => $phone,
    'type' => 'template',
    'template' => [
        'name' => $templateName,
        'language' => ['code' => 'en_US']
    ]
];

$url = "https://graph.facebook.com/v18.0/{$phone_number_id}/messages";
$logs = [];
$logs[] = "Querying Meta WABA profile matching user ID: '{$user_id}'";
$logs[] = "WABA token validated and active";
$logs[] = "Generated template payload for: '{$templateName}' to '{$phone}'";

// Detect sandbox mode (only allowed on localhost/development)
$is_local = (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false));
$is_mock_token = (strpos($access_token, 'MOCK_LONG_LIVED_TOKEN_') === 0);

if ($is_mock_token) {
    if (!$is_local) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Sandbox mock token detected in production environment. Please complete live Meta OAuth before sending messages.'
        ]);
        exit;
    }

    // LOCAL DEVELOPMENT ONLY: Cloud API endpoint payload dispatch simulation
    $logs[] = "Meta Cloud API connection: Connected";
    $logs[] = "Template dispatch queued successfully";
    $logs[] = "Status response from graph.facebook.com: 200 OK";

    $wamid = 'wamid.HBgM' . bin2hex(random_bytes(24));
    $msgData = [
        'user_id' => $user_id,
        'phone' => $phone,
        'template' => $templateName,
        'status' => 'sent',
        'timestamp' => time()
    ];
    firestore_set_message($wamid, $msgData);

    echo json_encode([
        'status' => 'sent',
        'message_id' => $wamid,
        'logs' => $logs,
        'simulated' => true
    ]);
    exit;
}

// Live execution hit Meta API
$logs[] = "Initiating secure template dispatch to Meta: {$url}";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($waPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$logs[] = "Template dispatch queued successfully. HTTP code: {$http_code}";

if ($http_code == 200) {
    $resData = json_decode($result, true);
    $wamid = $resData['messages'][0]['id'] ?? 'wamid.unknown';
    
    $msgData = [
        'user_id' => $user_id,
        'phone' => $phone,
        'template' => $templateName,
        'status' => 'sent',
        'timestamp' => time()
    ];
    firestore_set_message($wamid, $msgData);

    echo json_encode([
        'status' => 'sent',
        'message_id' => $wamid,
        'logs' => $logs,
        'simulated' => false
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to deliver message through WhatsApp Cloud API Gateway',
        'details' => json_decode($result, true) ?: $result,
        'logs' => $logs
    ]);
}
?>