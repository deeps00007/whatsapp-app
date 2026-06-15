<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'firestore_helper.php';

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);
$user_id = $input['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user_id parameter']);
    exit;
}

$deleted = firestore_delete_user($user_id);
if ($deleted) {
    echo json_encode(['status' => 'success', 'message' => 'Integration disconnected and credentials wiped.']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to revoke token profile.']);
}
exit;
?>
