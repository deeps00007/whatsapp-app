<?php
// We redirect to Meta's OAuth screen.
$user_id = $_GET['user_id'] ?? 'growbychat_user';
$client_id = getenv('FACEBOOK_CLIENT_ID') ?: '3371677636326324';
$client_id = trim(str_replace(['"', "'"], '', $client_id));

$config_id = getenv('FACEBOOK_CONFIG_ID') ?: '1489785399464192';
$config_id = trim(str_replace(['"', "'"], '', $config_id));

// Dynamically construct redirect URI based on the request host
$protocol = 'http';
if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
    (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
    (!empty($_SERVER['HTTP_FRONTEND_HTTPS']) && $_SERVER['HTTP_FRONTEND_HTTPS'] === 'on') ||
    (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'growbychat.app') !== false)) {
    $protocol = 'https';
}
$host = $_SERVER['HTTP_HOST'];
$redirect_uri = "{$protocol}://{$host}/api/oauth_callback.php";

// Pass user_id and frontend_host in the state parameter to map it later securely against CSRF
$frontend_host = $_GET['frontend_host'] ?? 'https://growbychat.app';
$state = base64_encode(json_encode([
    'user_id' => $user_id,
    'nonce' => uniqid(),
    'frontend_host' => $frontend_host
]));

// Hidden metadata configurations to switch Meta's onboarding view into Coexistence Mode
$extras = [
    'version' => 'v3',
    'sessionInfoVersion' => '3',
    'featureType' => 'whatsapp_business_app_onboarding',
    'setup' => new stdClass()
];
$extras_json = json_encode($extras);

// BUILD COEXISTENCE EMBEDDED SIGNUP URL (v23.0)
$oauth_url = "https://www.facebook.com/v23.0/dialog/oauth?"
           . "client_id=" . urlencode($client_id)
           . "&redirect_uri=" . urlencode($redirect_uri)
           . "&state=" . urlencode($state)
           . "&config_id=" . urlencode($config_id)
           . "&response_type=code"
           . "&override_default_response_type=true"
           . "&scope=whatsapp_business_management,whatsapp_business_messaging"
           . "&extras=" . urlencode($extras_json);

header("Location: $oauth_url");
exit;
?>
