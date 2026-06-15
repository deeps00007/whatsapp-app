<?php
/**
 * Meta OAuth Initiator
 *
 * IMPORTANT — Review Mode vs Production Mode:
 * - META_REVIEW_MODE=true  : Standard Embedded Signup (no featureType). Use this for App Review.
 * - META_REVIEW_MODE=false : Coexistence onboarding (featureType=whatsapp_business_app_onboarding).
 *                            Restore this after Advanced Access is approved so users can keep
 *                            their mobile WhatsApp Business app running alongside the SaaS.
 */

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

$review_mode = (getenv('META_REVIEW_MODE') === 'true');

if ($review_mode) {
    // STANDARD EMBEDDED SIGNUP — Used during Meta App Review.
    // Omits featureType so testers can complete OAuth in Development Mode.
    $extras = [
        'version' => 'v3',
        'sessionInfoVersion' => '3',
        'setup' => new stdClass()
    ];
} else {
    // COEXISTENCE ONBOARDING — Restore after Advanced Access approval.
    // Enables "Connect a WhatsApp Business app" in the Embedded Signup dialog.
    $extras = [
        'version' => 'v3',
        'sessionInfoVersion' => '3',
        'featureType' => 'whatsapp_business_app_onboarding',
        'setup' => new stdClass()
    ];
}

$extras_json = json_encode($extras);

// BUILD EMBEDDED SIGNUP URL (v23.0)
$oauth_url = "https://www.facebook.com/v23.0/dialog/oauth?"
           . "client_id=" . urlencode($client_id)
           . "&redirect_uri=" . urlencode($redirect_uri)
           . "&state=" . urlencode($state)
           . "&config_id=" . urlencode($config_id)
           . "&response_type=code"
           . "&override_default_response_type=true"
            . "&scope=whatsapp_business_management,whatsapp_business_messaging"
            . "&auth_type=rerequest"
            . "&extras=" . urlencode($extras_json);

header("Location: $oauth_url");
exit;
?>
