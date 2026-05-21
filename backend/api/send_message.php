<?php
header('Content-Type: application/json');

// POST /send-message
// {
//   "user_id": "123",
//   "phone": "9178XXXXXXX",
//   "template": "hello_world"
// }

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

if(!isset($input['user_id']) || !isset($input['phone']) || !isset($input['template'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$user_id = $input['user_id'];
$phone = $input['phone'];
$templateName = $input['template'];

// Connect to secure database layer to get the WA token for $user_id
// e.g. waba_id, phone_number_id, access_token
// Simulated dummy values:
$waba_id = "DUMMY_WABA_ID";
$phone_number_id = "DUMMY_PHONE_ID";
$access_token = "DUMMY_ACCESS_TOKEN";

// WhatsApp Cloud API v18.0 specific template
$waPayload = [
    'messaging_product' => 'whatsapp',
    'to' => $phone,
    'type' => 'template',
    'template' => [
        'name' => $templateName,
        'language' => ['code' => 'en_US']
    ]
];

$url = "https://graph.facebook.com/v18.0/{$phone_number_id}/messages";

// Uncomment logic below in production to hit WhatsApp API
/*
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($waPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
*/

// Simulate successful execution
$http_code = 200;
$result = '{"messages":[{"id":"wamid.DUMMYID"}]}';

if ($http_code == 200) {
    echo json_encode(['status' => 'sent', 'message_id' => 'wamid.DUMMY']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send WA message', 'details' => $result]);
}
?>