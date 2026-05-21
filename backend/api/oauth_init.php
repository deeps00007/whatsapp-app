<?php
// We redirect to Meta's OAuth screen.
$user_id = $_GET['user_id'] ?? 'growbychat_user';
$client_id = getenv('FACEBOOK_CLIENT_ID') ?: '2023182691569993';
$config_id = getenv('FACEBOOK_CONFIG_ID') ?: '1304929174886880';

// Dynamically construct redirect URI based on the request host
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
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
