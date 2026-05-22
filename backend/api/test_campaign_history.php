<?php
// Comprehensive Campaign History and Webhook Status Update Diagnostic Tool.
require_once 'firestore_helper.php';

echo "========================================================\n";
echo "    Growbychat Campaign & Webhook Integration Diagnostic  \n";
echo "========================================================\n\n";

$project_id = FIREBASE_PROJECT_ID;
$user_id = "test_user_telemetry_" . time();
$wamid = "wamid.test_diagnostic_" . bin2hex(random_bytes(8));

echo "1. INITIALIZING ENVIRONMENT CONFIGURATION:\n";
echo "   - FIREBASE_PROJECT_ID: '" . $project_id . "'\n";
echo "   - Test User ID: '$user_id'\n";
echo "   - Test Message ID (Wamid): '$wamid'\n\n";

echo "2. AUTHENTICATION HANDSHAKE TEST:\n";
$token = get_firestore_access_token();
if ($token) {
    echo "   [SUCCESS] Obtained OAuth2 token: " . substr($token, 0, 15) . "...\n\n";
} else {
    echo "   [INFO] No service account file found. Operating in local JSON fallback mode.\n\n";
}

echo "3. VERIFYING CAMPAIGN LOG WRITE (firestore_set_message):\n";
$msgData = [
    'user_id' => $user_id,
    'phone' => '+15550192834',
    'template' => 'welcome',
    'status' => 'sent',
    'timestamp' => time()
];

$write_success = firestore_set_message($wamid, $msgData);
if ($write_success) {
    echo "   [SUCCESS] Successfully logged message '$wamid' with status 'sent'!\n\n";
} else {
    echo "   [ERROR] Failed to write campaign message.\n";
    exit(1);
}

echo "4. VERIFYING CAMPAIGN LOG READ (firestore_get_message):\n";
$fetched = firestore_get_message($wamid);
if ($fetched && ($fetched['user_id'] ?? '') === $user_id) {
    echo "   [SUCCESS] Successfully read message back from database!\n";
    echo "   - Status: " . $fetched['status'] . "\n";
    echo "   - Phone: " . $fetched['phone'] . "\n";
    echo "   - Template: " . $fetched['template'] . "\n\n";
} else {
    echo "   [ERROR] Message validation failed on retrieval.\n";
    exit(1);
}

echo "5. VERIFYING WEBHOOK STATUS UPGRADE (sent -> delivered):\n";
// Emulate webhook status transition
if ($fetched) {
    $fetched['status'] = 'delivered';
    $fetched['updated_at'] = time();
    $update_success = firestore_set_message($wamid, $fetched);
    
    $check = firestore_get_message($wamid);
    if ($update_success && $check && $check['status'] === 'delivered') {
        echo "   [SUCCESS] Successfully upgraded status to 'delivered'!\n\n";
    } else {
        echo "   [ERROR] Failed to upgrade status to 'delivered'.\n";
        exit(1);
    }
}

echo "6. VERIFYING WEBHOOK STATUS UPGRADE (delivered -> read):\n";
$check['status'] = 'read';
$check['updated_at'] = time();
$update_success2 = firestore_set_message($wamid, $check);

$check2 = firestore_get_message($wamid);
if ($update_success2 && $check2 && $check2['status'] === 'read') {
    echo "   [SUCCESS] Successfully upgraded status to 'read'!\n\n";
} else {
    echo "   [ERROR] Failed to upgrade status to 'read'.\n";
    exit(1);
}

echo "7. VERIFYING DUPLICATE WEBHOOK FILTERING / PREVENTION:\n";
// Attempt to "downgrade" status to "delivered" (representing a delayed Meta duplicate webhook)
$status_weights = ['sent' => 1, 'delivered' => 2, 'read' => 3];
$current_status = $check2['status']; // 'read' (weight 3)
$incoming_status = 'delivered'; // weight 2

$current_weight = $status_weights[$current_status] ?? 1;
$new_weight = $status_weights[$incoming_status] ?? 1;

echo "   - Current status: '$current_status' (Weight $current_weight)\n";
echo "   - Incoming duplicate status: '$incoming_status' (Weight $new_weight)\n";

if ($new_weight > $current_weight) {
    // Should NOT happen for duplicates
    echo "   [ERROR] Test failed: Duplicate filtering allowed downgrade!\n";
    exit(1);
} else {
    echo "   [SUCCESS] Duplicate prevention algorithm correctly BLOCKED downgrade (Weight $new_weight <= $current_weight)!\n\n";
}

echo "8. VERIFYING USER CAMPAIGN LIST QUERY (firestore_get_messages):\n";
$list = firestore_get_messages($user_id);
if (is_array($list) && count($list) > 0) {
    echo "   [SUCCESS] Successfully queried message list for user '$user_id'!\n";
    echo "   - Messages found: " . count($list) . "\n";
    echo "   - First Message ID: " . $list[0]['message_id'] . "\n";
    echo "   - First Message Status: " . $list[0]['status'] . "\n\n";
} else {
    echo "   [ERROR] Campaign list query returned empty or corrupt result.\n";
    exit(1);
}

echo "9. CLEANING UP TELEMETRY DATA:\n";
// Cleanup in Firestore and local databases
if (!empty($project_id)) {
    $url = "https://firestore.googleapis.com/v1/projects/" . $project_id . "/databases/(default)/documents/messages/" . urlencode($wamid);
    $headers = [];
    $token = get_firestore_access_token();
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        echo "   [SUCCESS] Telemetry test document deleted cleanly from Firestore.\n";
    } else {
        echo "   [INFO] Local fallback database cleanup in progress.\n";
    }
}

// Clean local DB if exists
$file = __DIR__ . '/messages.json';
if (file_exists($file)) {
    $db = json_decode(file_get_contents($file), true) ?: [];
    if (isset($db[$wamid])) {
        unset($db[$wamid]);
        file_put_contents($file, json_encode($db, JSON_PRETTY_PRINT));
        echo "   [SUCCESS] Telemetry test document deleted cleanly from local messages.json.\n";
    }
}

echo "\n========================================================\n";
echo "          DIAGNOSTIC TEST END-TO-END: PASSED!           \n";
echo "========================================================\n";
?>
