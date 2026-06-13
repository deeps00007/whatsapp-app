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

if (empty($client_secret) && !$is_local) {
    http_response_code(400);
    die(json_encode([
        'error' => 'Server configuration error: FACEBOOK_CLIENT_SECRET is empty. Ensure this environment variable is set in Railway and matches the current App Secret from Meta App Dashboard → Settings → Basic.'
    ]));
}

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

    error_log("[oauth_callback] Token exchange — HTTP=$http_code, redirect_uri=$redirect_uri, body=" . substr($response, 0, 300));

    if ($http_code !== 200) {
        http_response_code(400);
        $error_detail = json_decode($response, true) ?: ['message' => 'Unknown error from Meta token exchange'];
        die(json_encode([
            'error' => 'Meta OAuth token exchange failed.',
            'diagnostics' => [
                'redirect_uri_used' => $redirect_uri,
                'client_id_used' => $client_id,
                'client_secret_length' => strlen($client_secret),
                'tip' => 'Most common causes: (1) FACEBOOK_CLIENT_SECRET does not match Meta App Dashboard → Settings → Basic → App Secret. (2) Redirect URI mismatch between authorize request and token exchange. (3) App is in Development Mode and the user is not a Test User/Admin.'
            ],
            'meta_response' => $error_detail
        ]));
    }

    $res_data = json_decode($response, true);
    $short_lived_token = $res_data['access_token'] ?? '';

    if (empty($short_lived_token)) {
        http_response_code(400);
        die(json_encode([
            'error' => 'Meta returned an empty access token. Ensure the user authorized the requested scopes (whatsapp_business_management, whatsapp_business_messaging).'
        ]));
    }

    // EXCHANGE SHORT-LIVED TOKEN FOR LONG-LIVED TOKEN (60 days)
    $exchange_url = "https://graph.facebook.com/v23.0/oauth/access_token"
                  . "?grant_type=fb_exchange_token"
                  . "&client_id=" . urlencode($client_id)
                  . "&client_secret=" . urlencode($client_secret)
                  . "&fb_exchange_token=" . urlencode($short_lived_token);

    $ch_exchange = curl_init($exchange_url);
    curl_setopt($ch_exchange, CURLOPT_RETURNTRANSFER, true);
    $exchange_response = curl_exec($ch_exchange);
    $exchange_http_code = curl_getinfo($ch_exchange, CURLINFO_HTTP_CODE);
    curl_close($ch_exchange);

    $long_lived_token = $short_lived_token;
    if ($exchange_http_code === 200) {
        $exchange_data = json_decode($exchange_response, true);
        if (!empty($exchange_data['access_token'])) {
            $long_lived_token = $exchange_data['access_token'];
        }
    }
    error_log("[oauth_callback] Long-lived exchange — HTTP=$exchange_http_code, expires=" . ($exchange_data['expires_in'] ?? 'N/A'));

    error_log("[oauth_callback] Token acquired, prefix=" . substr($long_lived_token, 0, 20) . "... starting WABA discovery.");

    // STEP 2a: Debug token to find WABA from granular scopes (works for coexistence onboarding)
    $app_token = $client_id . '|' . $client_secret;
    $debug_url = "https://graph.facebook.com/v23.0/debug_token"
               . "?input_token=" . urlencode($long_lived_token)
               . "&access_token=" . urlencode($app_token);
    $ch_dbg = curl_init($debug_url);
    curl_setopt($ch_dbg, CURLOPT_RETURNTRANSFER, true);
    $debug_response = curl_exec($ch_dbg);
    $debug_code = curl_getinfo($ch_dbg, CURLINFO_HTTP_CODE);
    curl_close($ch_dbg);
    error_log("[oauth_callback] /debug_token — HTTP=$debug_code, body=" . substr($debug_response, 0, 800));

    // Extract WABA IDs from granular scopes
    if ($debug_code === 200) {
        $debug_data = json_decode($debug_response, true);
        $granules = $debug_data['data']['granular_scopes'] ?? [];
        foreach ($granules as $g) {
            if (($g['scope'] ?? '') === 'whatsapp_business_management') {
                $targets = $g['target_ids'] ?? [];
                if (!empty($targets[0])) {
                    $waba_id = $targets[0];
                    error_log("[oauth_callback] Found WABA via /debug_token granular_scopes: $waba_id");
                    break;
                }
            }
        }
    }

    // STEP 2b: Fallback — direct WABA query
    $waba_url = "https://graph.facebook.com/v23.0/me/whatsapp_business_accounts?access_token=" . urlencode($long_lived_token);
    $ch_waba = curl_init($waba_url);
    curl_setopt($ch_waba, CURLOPT_RETURNTRANSFER, true);
    $waba_response = curl_exec($ch_waba);
    $waba_code = curl_getinfo($ch_waba, CURLINFO_HTTP_CODE);
    curl_close($ch_waba);
    error_log("[oauth_callback] /me/whatsapp_business_accounts — HTTP=$waba_code, body=" . substr($waba_response, 0, 500));

    if (empty($waba_id) && $waba_code === 200) {
        $waba_data = json_decode($waba_response, true);
        if (isset($waba_data['data'][0]['id'])) {
            $waba_id = $waba_data['data'][0]['id'];
            $business_name = $waba_data['data'][0]['name'] ?? 'WhatsApp Business';
            error_log("[oauth_callback] Found WABA via /me/whatsapp_business_accounts: $waba_id name=$business_name");
        }
    }

    // STEP 3: FETCH PHONE NUMBERS
    if (!empty($waba_id)) {
        $phone_url = "https://graph.facebook.com/v23.0/" . $waba_id . "/phone_numbers?access_token=" . urlencode($long_lived_token);
        $ch_phone = curl_init($phone_url);
        curl_setopt($ch_phone, CURLOPT_RETURNTRANSFER, true);
        $phone_response = curl_exec($ch_phone);
        $phone_code = curl_getinfo($ch_phone, CURLINFO_HTTP_CODE);
        curl_close($ch_phone);

        if ($phone_code === 200) {
            $phone_data = json_decode($phone_response, true);
            $phone_list = $phone_data['data'] ?? [];

            $best_phone = null;
            $best_score = -1;
            foreach ($phone_list as $entry) {
                $score = 0;
                $num = $entry['display_phone_number'] ?? '';
                $status = $entry['code_verification_status'] ?? '';
                $quality = $entry['quality_rating'] ?? '';
                $cert = $entry['certificate'] ?? '';
                $cert_status = $entry['cert_status'] ?? '';

                // Skip obvious test numbers
                if (strpos($num, '555') !== false) {
                    error_log("[oauth_callback] Skipping test number: $num");
                    continue;
                }
                // Prefer VERIFIED
                if ($status === 'VERIFIED') $score += 3;
                // Prefer numbers with quality rating
                if (!empty($quality)) $score += 2;
                // Prefer certified numbers
                if ($cert_status === 'verified' || !empty($cert)) $score += 1;
                // Must have ID and number
                if (!empty($entry['id']) && !empty($num)) $score += 1;

                if ($score > $best_score && !empty($entry['id']) && !empty($num)) {
                    $best_score = $score;
                    $best_phone = $entry;
                }
            }

            // If all numbers were test numbers (all got score 0), grab the first
            if (!$best_phone) {
                foreach ($phone_list as $entry) {
                    if (!empty($entry['id'])) {
                        $best_phone = $entry;
                        break;
                    }
                }
            }

            if ($best_phone) {
                $phone_number_id = $best_phone['id'];
                $phone_number = $best_phone['display_phone_number']
                    ?? $best_phone['verified_name']
                    ?? '';
                // Use the best phone's certificate if available
                if (!empty($best_phone['certificate'])) {
                    error_log("[oauth_callback] Phone has certificate: $phone_number cert=" . $best_phone['certificate']);
                }
            }
            error_log("[oauth_callback] Phone discovery — waba=$waba_id candidates=" . count($phone_list) . " picked=$phone_number_id ($phone_number) score=$best_score");
        } else {
            error_log("[oauth_callback] Phone lookup failed — HTTP=$phone_code body=" . substr($phone_response, 0, 300));
        }
    } else {
        error_log("[oauth_callback] WARNING: waba_id still empty after both discovery methods. OAuth may have failed to create WABA.");
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

error_log("[oauth_callback] Saving to Firestore — waba=$waba_id phone=$phone_number_id number=$phone_number business=$business_name");
$save_success = firestore_set_user($user_id, $user_data);
if (!$save_success) {
    error_log("[oauth_callback] Firestore write FAILED");
    http_response_code(500);
    die("Database write failed. Verify Firestore configuration.");
}
error_log("[oauth_callback] Success — redirecting to $frontend_host");

// 5. Redirect back to React Web App
header("Location: " . $frontend_host . "/#oauth=success&user_id=" . urlencode($user_id));
exit;
?>
