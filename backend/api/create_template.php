<?php
// create_template.php
// Creates a new WhatsApp message template. Submits to Meta Graph API if live credentials exist,
// otherwise stores it in Firestore or the local DB sandbox so it renders in the UI immediately.

require_once 'firestore_helper.php';
require_once 'encryption_helper.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

$user_id = $input['user_id'] ?? 'growbychat_user';
$name = $input['name'] ?? '';
$category = $input['category'] ?? 'MARKETING';
$language = $input['language'] ?? 'en_US';
$body_text = $input['body_text'] ?? '';

if (empty($name) || empty($body_text)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing template name or body text.']);
    exit;
}

// Format template name to fit Meta constraints: lowercase only, no spaces, letters and underscores only
$name = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', str_replace(' ', '_', $name)));

$user_profile = firestore_get_user($user_id);
$live_success = false;
$meta_response = "";

if ($user_profile && !empty($user_profile['fb_access_token']) && !empty($user_profile['waba_id'])) {
    $decrypted_token = decrypt_token($user_profile['fb_access_token']);
    if ($decrypted_token) {
        $waba_id = $user_profile['waba_id'];
        $url = "https://graph.facebook.com/v23.0/" . $waba_id . "/message_templates";
        
        $meta_payload = [
            'name' => $name,
            'category' => $category,
            'language' => $language,
            'components' => [
                [
                    'type' => 'BODY',
                    'text' => $body_text
                ]
            ]
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($meta_payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $decrypted_token
        ]);
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code >= 200 && $http_code < 300) {
            $live_success = true;
        } else {
            $meta_response = $response;
        }
    }
}

// Generate secure ID and store template record locally/in Firestore
$template_id = "tmpl_" . uniqid();
$template_data = [
    'template_id' => $template_id,
    'user_id' => $user_id,
    'name' => $name,
    'category' => $category,
    'language' => $language,
    'status' => $live_success ? 'pending' : 'approved', // Live Meta sub needs review, Sandbox is instantly approved!
    'body_text' => $body_text,
    'timestamp' => time()
];

$save_success = firestore_set_template($template_id, $template_data);

if (!$save_success) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save template to the database workspace.']);
    exit;
}

$response_data = [
    'success' => true,
    'template' => $template_data,
    'mode' => $live_success ? 'live_meta' : 'sandbox_mock'
];

if (!empty($meta_response)) {
    $response_data['meta_debug'] = json_decode($meta_response, true) ?: $meta_response;
}

echo json_encode($response_data);
?>
