<?php
// Firestore REST API Integration Helper
// Supports local file fallback if FIREBASE_PROJECT_ID is not configured in env.

define('FIREBASE_PROJECT_ID', getenv('FIREBASE_PROJECT_ID') ?: '');
define('LOCAL_DB_FILE', __DIR__ . '/database.json');

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
        // Fallback: Local file database
        $db = [];
        if (file_exists(LOCAL_DB_FILE)) {
            $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
        }
        $db[$user_id] = $data;
        file_put_contents(LOCAL_DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        return true;
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    $payload = to_firestore_fields($data);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($http_code >= 200 && $http_code < 300);
}

// Read user from database
function firestore_get_user($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        // Fallback: Local file database
        if (!file_exists(LOCAL_DB_FILE)) {
            return null;
        }
        $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
        return $db[$user_id] ?? null;
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        $doc = json_decode($response, true);
        return from_firestore_fields($doc);
    }

    return null;
}

// Delete user from database
function firestore_delete_user($user_id) {
    if (empty(FIREBASE_PROJECT_ID)) {
        // Fallback: Local file database
        if (!file_exists(LOCAL_DB_FILE)) {
            return true;
        }
        $db = json_decode(file_get_contents(LOCAL_DB_FILE), true) ?: [];
        if (isset($db[$user_id])) {
            unset($db[$user_id]);
            file_put_contents(LOCAL_DB_FILE, json_encode($db, JSON_PRETTY_PRINT));
        }
        return true;
    }

    $url = "https://firestore.googleapis.com/v1/projects/" . FIREBASE_PROJECT_ID . "/databases/(default)/documents/users/" . urlencode($user_id);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($http_code >= 200 && $http_code < 300);
}
?>
