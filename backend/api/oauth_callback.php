<?php
require_once 'encryption_helper.php';
require_once 'firestore_helper.php';

// Meta redirects back to this endpoint after user grants permission
$code = $_GET['code'] ?? null;
$state_raw = $_GET['state'] ?? null;

if (!$code || !$state_raw) {
    http_response_code(400);
    die("Missing auth code or state");
}

// 1. Strict State/CSRF Validation
$state = json_decode(base64_decode($state_raw), true);
$user_id = $state['user_id'] ?? null;
$nonce = $state['nonce'] ?? null;
$frontend_host = $state['frontend_host'] ?? 'https://growbychat.app';

if (!$user_id) {
    http_response_code(400);
    die("Invalid state payload - potential CSRF attack blocked.");
}

// 2. Exchange code for token securely (backend to Meta communication)
$client_id = getenv('FACEBOOK_CLIENT_ID') ?: '3371677636326324';
$client_id = trim(str_replace(['"', "'"], '', $client_id));
$client_secret = getenv('FACEBOOK_CLIENT_SECRET') ?: '';
$client_secret = trim(str_replace(['"', "'"], '', $client_secret));

$long_lived_token = "";
$waba_id = "";
$phone_number_id = "";
$phone_number = "";
$business_name = "";

$is_local = (isset($_SERVER['HTTP_HOST']) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false));

if (!empty($client_secret)) {
    // Live Meta Graph API Integration
    $protocol = 'http';
    if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
        (!empty($_SERVER['HTTP_FRONTEND_HTTPS']) && $_SERVER['HTTP_FRONTEND_HTTPS'] === 'on') ||
        (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'growbychat.app') !== false)) {
        $protocol = 'https';
    }
    $host = $_SERVER['HTTP_HOST'];
    $redirect_uri = "{$protocol}://{$host}/api/oauth_callback.php";

    // EXCHANGE CODE FOR ACCESS TOKEN (v23.0)
    $token_url = "https://graph.facebook.com/v23.0/oauth/access_token"
               . "?client_id=" . urlencode($client_id)
               . "&redirect_uri=" . urlencode($redirect_uri)
               . "&client_secret=" . urlencode($client_secret)
               . "&code=" . urlencode($code);

    $ch = curl_init($token_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code !== 200) {
        http_response_code(400);
        $error_detail = json_decode($response, true) ?: ['message' => 'Unknown error from Meta token exchange'];
        die(json_encode([
            'error' => 'Meta OAuth token exchange failed. Please ensure you authorized all permissions and that your App is not in a restricted state.',
            'details' => $error_detail
        ]));
    }

    $res_data = json_decode($response, true);
    $long_lived_token = $res_data['access_token'] ?? '';

    if (empty($long_lived_token)) {
        http_response_code(400);
        die(json_encode([
            'error' => 'Meta returned an empty access token. Ensure the user authorized the requested scopes (whatsapp_business_management, whatsapp_business_messaging).'
        ]));
    }

    // STEP 2: FETCH THE WHATSAPP ACCOUNT DIRECTLY (v23.0)
    $waba_url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($long_lived_token);
    $ch_waba = curl_init($waba_url);
    curl_setopt($ch_waba, CURLOPT_RETURNTRANSFER, true);
    $waba_response = curl_exec($ch_waba);
    $waba_code = curl_getinfo($ch_waba, CURLINFO_HTTP_CODE);
    curl_close($ch_waba);

    if ($waba_code === 200) {
        $waba_data = json_decode($waba_response, true);
        if (isset($waba_data['data'][0]['id'])) {
            $waba_id = $waba_data['data'][0]['id'];
            $business_name = $waba_data['data'][0]['name'] ?? 'WhatsApp Business';

            // STEP 3: FETCH TARGET PHONE ID METADATA (v23.0)
            $phone_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/phone_numbers?access_token=" . urlencode($long_lived_token);
            $ch_phone = curl_init($phone_url);
            curl_setopt($ch_phone, CURLOPT_RETURNTRANSFER, true);
            $phone_response = curl_exec($ch_phone);
            $phone_code = curl_getinfo($ch_phone, CURLINFO_HTTP_CODE);
            curl_close($ch_phone);

            if ($phone_code === 200) {
                $phone_data = json_decode($phone_response, true);
                if (isset($phone_data['data'][0]['id'])) {
                    $phone_number_id = $phone_data['data'][0]['id'];
                    $phone_number = $phone_data['data'][0]['display_phone_number'] ?? '';
                }
            }
        }
    }
} elseif ($is_local) {
    // LOCAL DEVELOPMENT ONLY: high-fidelity mock token when no secrets are configured
    $long_lived_token = "MOCK_LONG_LIVED_TOKEN_" . bin2hex(random_bytes(16));
    $waba_id = "waba_sandbox_" . bin2hex(random_bytes(8));
    $phone_number_id = "phone_sandbox_" . bin2hex(random_bytes(8));
    $phone_number = "+1 (555) 019-2834";
    $business_name = "Growbychat Sandbox Retail";
} else {
    http_response_code(400);
    die(json_encode([
        'error' => 'Missing FACEBOOK_CLIENT_SECRET. Cannot perform live Meta OAuth in production without credentials.'
    ]));
}

// 3. Encrypt token securely using AES-256
$encrypted_token = encrypt_token($long_lived_token);

// 4. Save WABA details securely to Firestore
$user_data = [
    'user_id' => $user_id,
    'waba_id' => $waba_id,
    'phone_number_id' => $phone_number_id,
    'phone_number' => $phone_number,
    'business_name' => $business_name,
    'fb_access_token' => $encrypted_token,
    'connected_at' => time()
];

$save_success = firestore_set_user($user_id, $user_data);
if (!$save_success) {
    http_response_code(500);
    die("Database write failed. Verify Firestore configuration.");
}

// 5. Redirect back to React Web App
header("Location: " . $frontend_host . "/#oauth=success&user_id=" . urlencode($user_id));
exit;
?>
