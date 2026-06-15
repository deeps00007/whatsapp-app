<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://growbychat.app');
header('Access-Control-Allow-Methods: GET');

echo json_encode([
    'service' => 'Growbychat API Gateway',
    'status' => 'online',
    'version' => '1.0.0',
    'documentation' => 'https://growbychat.app'
]);
?>
