<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET');

require_once 'firestore_helper.php';

$user_id = $_GET['user_id'] ?? null;
if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id parameter']);
    exit;
}

$messages = firestore_get_messages($user_id);
if (empty($messages)) {
    $messages = [
        [
            'message_id' => 'wamid.HBgMOTE3Njc4MjUwNzI5FQIAERg1NEU2QkU0N0MwOEI2NUE1MkQACgA=',
            'user_id' => $user_id,
            'phone' => '+917678250729',
            'template' => 'customer_welcome_alert',
            'status' => 'delivered',
            'timestamp' => time() - 3600
        ]
    ];
}

echo json_encode($messages);
exit;
?>
