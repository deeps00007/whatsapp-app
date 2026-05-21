<?php
// Flutter directs user here. We redirect to Meta's OAuth screen.
$user_id = $_GET['user_id'] ?? '';
$client_id = '2023182691569993';
$redirect_uri = 'https://loose-doors-agree.loca.lt/whatsapp-api/backend/api/oauth_callback.php';
$config_id = '1304929174886880'; // Needed for Embedded Signup

// Pass user_id in the state parameter to map it later securely against CSRF
$state = base64_encode(json_encode(['user_id' => $user_id, 'nonce' => uniqid()]));

$oauth_url = "https://www.facebook.com/v18.0/dialog/oauth?client_id={$client_id}&redirect_uri={$redirect_uri}&state={$state}&config_id={$config_id}&response_type=code";

header("Location: $oauth_url");
exit;
?>
