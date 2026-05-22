<?php
// Comprehensive Firestore REST API Diagnostic & Verification Tool.
require_once 'firestore_helper.php';

echo "========================================================\n";
echo "       Growbychat Firestore REST API Diagnostic Tool    \n";
echo "========================================================\n\n";

$project_id = FIREBASE_PROJECT_ID;
echo "1. ENVIRONMENT CONFIGURATION:\n";
echo "   - FIREBASE_PROJECT_ID: '" . $project_id . "'\n";

$sa_env = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
$sa_file = __DIR__ . '/firebase-service-account.json';
$has_sa = false;

if ($sa_env) {
    echo "   - FIREBASE_SERVICE_ACCOUNT_JSON Env: '$sa_env'\n";
    if (file_exists($sa_env)) {
        echo "     [OK] Service account file exists at env path.\n";
        $has_sa = true;
    } else {
        echo "     [WARNING] Service account file defined in env does NOT exist!\n";
    }
} else {
    echo "   - FIREBASE_SERVICE_ACCOUNT_JSON Env: Not configured.\n";
}

if (file_exists($sa_file)) {
    echo "   - Local Service Account File: '$sa_file' [OK] File exists.\n";
    $has_sa = true;
} else {
    echo "   - Local Service Account File: '$sa_file' [Not Found] (Optional for secure admin access).\n";
}

if ($has_sa) {
    echo "   - Auth Strategy: SECURE ADMIN SERVICE ACCOUNT (No open database rules needed)\n";
} else {
    echo "   - Auth Strategy: ANONYMOUS REST API (Requires Firestore Security Rules set to public for '/users/{userId}')\n";
}

echo "\n2. SERVICE ACCOUNT AUTH Handshake (if applicable):\n";
if ($has_sa) {
    $token = get_firestore_access_token();
    if ($token) {
        echo "   [SUCCESS] Successfully exchanged Service Account JWT for Google OAuth2 access token!\n";
        echo "   Access Token: " . substr($token, 0, 15) . "..." . substr($token, -15) . "\n";
    } else {
        echo "   [ERROR] Failed to obtain access token from Service Account. Check private_key configuration.\n";
    }
} else {
    echo "   [SKIP] No Service Account configured. Using anonymous client mode.\n";
}

echo "\n3. ATTEMPTING DATABASE WRITE TO FIRESTORE:\n";
$test_user_id = "diagnostic_user_" . time();
$test_data = [
    'user_id' => $test_user_id,
    'waba_id' => 'waba_999999999999',
    'phone_number_id' => 'phone_888888888888',
    'phone_number' => '+15555551234',
    'business_name' => 'Diagnostic SaaS Test',
    'fb_access_token' => 'MOCK_TOKEN_' . bin2hex(random_bytes(8)),
    'connected_at' => time()
];

// Perform direct cURL request to show raw HTTP response for diagnosis
$url = "https://firestore.googleapis.com/v1/projects/" . $project_id . "/databases/(default)/documents/users/" . urlencode($test_user_id);
$payload = to_firestore_fields($test_data);
$headers = ['Content-Type: application/json'];
$token = get_firestore_access_token();
if ($token) {
    $headers[] = 'Authorization: Bearer ' . $token;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

echo "   - URL: $url\n";
echo "   - HTTP Code: $http_code\n";

if ($http_code >= 200 && $http_code < 300) {
    echo "   - Write Status: [SUCCESS] Document created successfully in Google Firestore Database!\n";
    
    // Now verify reading it back
    echo "\n4. VERIFYING DATABASE READ FROM FIRESTORE:\n";
    $read_data = firestore_get_user($test_user_id);
    if ($read_data && $read_data['user_id'] === $test_user_id) {
        echo "   - Read Status: [SUCCESS] Retrieved correctly from Firestore:\n";
        echo "     Name: " . $read_data['business_name'] . "\n";
        echo "     Phone: " . $read_data['phone_number'] . "\n";
    } else {
        echo "   - Read Status: [FAILED] Could not read document back from Firestore.\n";
    }

    // Clean up
    echo "\n5. CLEANING UP TEST DOCUMENT:\n";
    if (firestore_delete_user($test_user_id)) {
        echo "   - Cleanup Status: [SUCCESS] Test document deleted successfully.\n";
    } else {
        echo "   - Cleanup Status: [WARNING] Failed to delete test document.\n";
    }
} else {
    echo "   - Write Status: [FAILED] Firestore rejected the write operation.\n";
    echo "   - Error Message: \n";
    $decoded_err = json_decode($response, true);
    if (isset($decoded_err['error'])) {
        echo "     Code: " . $decoded_err['error']['code'] . "\n";
        echo "     Status: " . $decoded_err['error']['status'] . "\n";
        echo "     Message: " . $decoded_err['error']['message'] . "\n";
    } else {
        echo "     Raw Response: " . $response . "\n";
    }
    
    echo "\n4. RESILIENT FALLBACK ACTION:\n";
    echo "   - Executing helper 'firestore_set_user' fallback test...\n";
    $success = firestore_set_user($test_user_id, $test_data);
    if ($success) {
        echo "   - Status: [SUCCESS] Successfully fell back to local file 'database.json'!\n";
        if (file_exists(LOCAL_DB_FILE)) {
            echo "     Local DB file confirmed at: " . LOCAL_DB_FILE . "\n";
        }
    } else {
        echo "   - Status: [CRITICAL ERROR] Even local fallback write failed!\n";
    }
}
echo "\n========================================================\n";
?>
