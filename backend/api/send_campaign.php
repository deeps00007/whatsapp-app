<?php
header('Content-Type: application/json');

// POST /send-campaign
// Receives:
// {
//   "user_id": "123",
//   "campaign_id": "abc",
//   "numbers": ["9178...", "9189..."],
//   "template": "hello_world"
// }

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if(!isset($input['user_id']) || !isset($input['numbers'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

// 1. Fetch user access token & waba_id from DB
// ... [Database Logic] ...

$results = [
    'sent' => 0,
    'failed' => 0,
];

// 2. Loop numbers & call WhatsApp API
foreach($input['numbers'] as $number) {
    // Add rate limiting logic: sleep(1-2 seconds)
    sleep(1);
    
    // Call WhatsApp Cloud API here...
    // Log result to Firestore
    $results['sent']++;
}

echo json_encode([
    'status' => 'completed',
    'campaign_id' => $input['campaign_id'],
    'details' => $results
]);
?>