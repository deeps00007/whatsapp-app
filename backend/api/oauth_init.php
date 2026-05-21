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

$oauth_url = "https://www.facebook.com/v18.0/dialog/oauth?client_id={$client_id}&redirect_uri={$redirect_uri}&state={$state}&config_id={$config_id}&response_type=code";

header("Location: $oauth_url");
exit;
?>
