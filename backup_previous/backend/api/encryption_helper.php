<?php
// Store this securely in Environment Variables in production!
$env_key = getenv('ENCRYPTION_KEY');
if (empty($env_key)) {
    $env_key = 'your-secure-32-byte-env-secret-key-here!';
}
define('ENCRYPTION_KEY', $env_key);

function encrypt_token($data) {
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', ENCRYPTION_KEY, 0, $iv);
    return base64_encode($encrypted . '::' . $iv);
}

function decrypt_token($data) {
    list($encrypted_data, $iv) = explode('::', base64_decode($data), 2);
    return openssl_decrypt($encrypted_data, 'aes-256-cbc', ENCRYPTION_KEY, 0, $iv);
}
?>
