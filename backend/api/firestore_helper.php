<?php
// Firestore REST API Integration Helper
// Supports local file fallback and authenticated Google Service Account credentials.

define('FIREBASE_PROJECT_ID', getenv('FIREBASE_PROJECT_ID') ?: 'whatsapp-betasaas');
define('LOCAL_DB_FILE', __DIR__ . '/database.json');

/**
 * Retrieve or generate a Google OAuth2 Access Token using a Service Account JSON file.
 * Returns null if no service account credentials are provided, enabling unauthenticated REST calls.
 */
function get_firestore_access_token() {
    $service_account_path = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!$service_account_path) {
        $possible_path = __DIR__ . '/firebase-service-account.json';
        if (file_exists($possible_path)) {
            $service_account_path = $possible_path;
        }
    }

    if (!$service_account_path || !file_exists($service_account_path)) {
        return null; // Fall back to unauthenticated REST calls
    }

    $sa_data = json_decode(file_get_contents($service_account_path), true);
    if (!$sa_data || !isset($sa_data['private_key']) || !isset($sa_data['client_email'])) {
        return null;
    }

    // Cache the access token locally to prevent overhead of OAuth handshake on every request
    $cache_file = sys_get_temp_dir() . '/firestore_access_token_' . md5($sa_data['client_email']) . '.json';
    if (file_exists($cache_file)) {
        $cached = json_decode(@file_get_contents($cache_file), true);
        if ($cached && isset($cached['access_token']) && isset($cached['expires_at']) && $cached['expires_at'] > time() + 60) {
            return $cached['access_token'];
        }
    }

    // Generate JWT (JSON Web Token) for Google Service Account Auth
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $now = time();
    $payload = json_encode([
        'iss' => $sa_data['client_email'],
        'scope' => 'https://www.googleapis.com/auth/datastore',
        'aud' => 'https://oauth2.googleapis.com/token',
        'exp' => $now + 3600,
        'iat' => $now
    ]);

    // Base64Url encoding helper
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature_input = $base64UrlHeader . "." . $base64UrlPayload;
    $signature = '';
    
    // Sign JWT using standard OpenSSL RSA-SHA256
    if (!openssl_sign($signature_input, $signature, $sa_data['private_key'], OPENSSL_ALGO_SHA256)) {
        error_log("[firestore] JWT signing failed. openssl_error=" . openssl_error_string());
        return null;
    }

    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    $jwt = $signature_input . "." . $base64UrlSignature;

    // Exchange JWT for OAuth2 Access Token
    $token_url = 'https://oauth2.googleapis.com/token';
    $post_fields = http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $jwt
    ]);

    $ch = curl_init($token_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $res = json_decode($response, true);
        if (isset($res['access_token'])) {
            $expires_in = $res['expires_in'] ?? 3600;
            $cache_data = [
                'access_token' => $res['access_token'],
                'expires_at' => time() + $expires_in
            ];
            @file_put_contents($cache_file, json_encode($cache_data));
            return $res['access_token'];
        }
    }

    // Retry once on failure (Google OAuth endpoint can be flaky)
    usleep(300000); // 300ms delay
    $ch = curl_init($token_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $res = json_decode($response, true);
        if (isset($res['access_token'])) {
            $expires_in = $res['expires_in'] ?? 3600;
            $cache_data = [
                'access_token' => $res['access_token'],
                'expires_at' => time() + $expires_in
            ];
            @file_put_contents($cache_file, json_encode($cache_data));
            return $res['access_token'];
        }
    }

    error_log("[firestore] OAuth2 token exchange failed after retry. HTTP=$http_code Response=" . substr($response, 0, 300));
    return null;
}

// Convert a flat associative array into Firestore's specific nested JSON schema
function to_firestore_fields($data) {
    $fields = [];
    foreach ($data as $key => $val) {
        if (is_int($val) || is_float($val)) {
            $fields[$key] = ['integerValue' => (string)$val];
        } else {
            $fields[$key] = ['stringValue' => (string)$val];
        }
    }
    return ['fields' => $fields];
}

// Convert Firestore's specific nested JSON schema back to a flat associative array
function from_firestore_fields($doc) {
    if (!isset($doc['fields'])) {
        return null;
    }
    $data = [];
    foreach ($doc['fields'] as $key => $val) {
        if (isset($val['integerValue'])) {
            $data[$key] = (int)$val['integerValue'];
        } elseif (isset($val['stringValue'])) {
            $data[$key] = $val['stringValue'];
        } else {
            $data[$key] = current($val); // Generic fallback
        }
    }
    return $data;
}

// Write/Update user in database
function firestore_set_user($user_id, $data) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return save_to_local_db($user_id, $data);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    $payload = to_firestore_fields($data);

    $headers = ['Content-Type: application/json'];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 200 && $http_code < 300) {
        return true;
    }

    // Smart Resilient Fallback: If Firestore API returns error, log it and fallback to local file
    error_log("Firestore set failed. Status Code: " . $http_code . ". Error: " . $response);
    return save_to_local_db($user_id, $data);
}

// Read user from database
function firestore_get_user($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return read_from_local_db($user_id);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    
    $headers = [];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $doc = json_decode($response, true);
        return from_firestore_fields($doc);
    }

    // Smart Resilient Fallback: If Firestore read fails, check local database
    return read_from_local_db($user_id);
}

// Delete user from database
function firestore_delete_user($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return delete_from_local_db($user_id);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    
    $headers = [];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 200 && $http_code < 300) {
        return true;
    }

    return delete_from_local_db($user_id);
}

// Write/Update message in database
function firestore_set_message($message_id, $data) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return save_message_to_local_db($message_id, $data);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/messages/" . urlencode($message_id);
    $payload = to_firestore_fields($data);

    $headers = ['Content-Type: application/json'];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 200 && $http_code < 300) {
        return true;
    }

    error_log("Firestore message set failed. Status Code: " . $http_code . ". Error: " . $response);
    return save_message_to_local_db($message_id, $data);
}

// Get single message
function firestore_get_message($message_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return read_single_message_from_local_db($message_id);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/messages/" . urlencode($message_id);
    
    $headers = [];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $doc = json_decode($response, true);
        return from_firestore_fields($doc);
    }

    return read_single_message_from_local_db($message_id);
}

// Retrieve last 50 messages for a user
function firestore_get_messages($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return read_messages_from_local_db($user_id);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents:runQuery";
    
    $query = [
        'structuredQuery' => [
            'from' => [['collectionId' => 'messages']],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'user_id'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $user_id]
                ]
            ],
            'limit' => 50
        ]
    ];

    $headers = ['Content-Type: application/json'];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($query));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $res = json_decode($response, true);
        if (is_array($res)) {
            $results = [];
            foreach ($res as $item) {
                if (isset($item['document'])) {
                    $data = from_firestore_fields($item['document']);
                    if ($data) {
                        if (!isset($data['message_id'])) {
                            $parts = explode('/', $item['document']['name']);
                            $data['message_id'] = end($parts);
                        }
                        $results[] = $data;
                    }
                }
            }
            // Sort in memory DESC by timestamp
            usort($results, function($a, $b) {
                return ($b['timestamp'] ?? 0) - ($a['timestamp'] ?? 0);
            });
            return $results;
        }
    }

    return read_messages_from_local_db($user_id);
}

// Helpers for Local Message DB
function save_message_to_local_db($message_id, $data) {
    $db = [];
    $file = __DIR__ . '/messages.json';
    if (file_exists($file)) {
        $db = json_decode(file_get_contents($file), true) ?: [];
    }
    $data['message_id'] = $message_id;
    $db[$message_id] = $data;
    return (file_put_contents($file, json_encode($db, JSON_PRETTY_PRINT)) !== false);
}

function read_single_message_from_local_db($message_id) {
    $file = __DIR__ . '/messages.json';
    if (!file_exists($file)) {
        return null;
    }
    $db = json_decode(file_get_contents($file), true) ?: [];
    return $db[$message_id] ?? null;
}

function read_messages_from_local_db($user_id) {
    $file = __DIR__ . '/messages.json';
    if (!file_exists($file)) {
        return [];
    }
    $db = json_decode(file_get_contents($file), true) ?: [];
    $filtered = [];
    foreach ($db as $mid => $msg) {
        if (($msg['user_id'] ?? '') === $user_id) {
            $msg['message_id'] = $msg['message_id'] ?? $mid;
            $filtered[] = $msg;
        }
    }
    usort($filtered, function($a, $b) {
        return ($b['timestamp'] ?? 0) - ($a['timestamp'] ?? 0);
    });
    return $filtered;
}

// Helpers for Local Database Fallbacks
function save_to_local_db($user_id, $data) {
    $db = [];
    if (file_exists(LOCAL_DB_FILE)) {
        $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
    }
    $db[$user_id] = $data;
    return (file_put_contents(LOCAL_DB_FILE, json_encode($db, JSON_PRETTY_PRINT)) !== false);
}

function read_from_local_db($user_id) {
    if (!file_exists(LOCAL_DB_FILE)) {
        return null;
    }
    $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
    return $db[$user_id] ?? null;
}

function delete_from_local_db($user_id) {
    if (!file_exists(LOCAL_DB_FILE)) {
        return true;
    }
    $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
    if (isset($db[$user_id])) {
        unset($db[$user_id]);
        return (file_put_contents(LOCAL_DB_FILE, json_encode($db, JSON_PRETTY_PRINT)) !== false);
    }
    return true;
}

// Write/Update template in database
function firestore_set_template($template_id, $data) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return save_template_to_local_db($template_id, $data);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/templates/" . urlencode($template_id);
    $payload = to_firestore_fields($data);

    $headers = ['Content-Type: application/json'];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code >= 200 && $http_code < 300) {
        return true;
    }

    error_log("Firestore template set failed. Status Code: " . $http_code . ". Error: " . $response);
    return save_template_to_local_db($template_id, $data);
}

// Retrieve templates for a user
function firestore_get_templates($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        return read_templates_from_local_db($user_id);
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents:runQuery";
    
    $query = [
        'structuredQuery' => [
            'from' => [['collectionId' => 'templates']],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'user_id'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $user_id]
                ]
            ],
            'limit' => 100
        ]
    ];

    $headers = ['Content-Type: application/json'];
    $access_token = get_firestore_access_token();
    if ($access_token) {
        $headers[] = 'Authorization: Bearer ' . $access_token;
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($query));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $res = json_decode($response, true);
        if (is_array($res)) {
            $results = [];
            foreach ($res as $item) {
                if (isset($item['document'])) {
                    $data = from_firestore_fields($item['document']);
                    if ($data) {
                        if (!isset($data['template_id'])) {
                            $parts = explode('/', $item['document']['name']);
                            $data['template_id'] = end($parts);
                        }
                        $results[] = $data;
                    }
                }
            }
            // Sort in memory DESC by timestamp
            usort($results, function($a, $b) {
                return ($b['timestamp'] ?? 0) - ($a['timestamp'] ?? 0);
            });
            return $results;
        }
    }

    return read_templates_from_local_db($user_id);
}

// Helpers for Local Template DB fallback
function save_template_to_local_db($template_id, $data) {
    $db = [];
    $file = __DIR__ . '/templates.json';
    if (file_exists($file)) {
        $db = json_decode(file_get_contents($file), true) ?: [];
    }
    $data['template_id'] = $template_id;
    $db[$template_id] = $data;
    return (file_put_contents($file, json_encode($db, JSON_PRETTY_PRINT)) !== false);
}

function read_templates_from_local_db($user_id) {
    $file = __DIR__ . '/templates.json';
    if (!file_exists($file)) {
        return [];
    }
    $db = json_decode(file_get_contents($file), true) ?: [];
    $filtered = [];
    foreach ($db as $tid => $tmpl) {
        if (($tmpl['user_id'] ?? '') === $user_id) {
            $tmpl['template_id'] = $tmpl['template_id'] ?? $tid;
            $filtered[] = $tmpl;
        }
    }
    usort($filtered, function($a, $b) {
        return ($b['timestamp'] ?? 0) - ($a['timestamp'] ?? 0);
    });
    return $filtered;
}
?>
