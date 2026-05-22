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

echo json_encode($messages);
exit;
?>
