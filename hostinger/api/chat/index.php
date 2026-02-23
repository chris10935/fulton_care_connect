<?php
/**
 * PHP Proxy – forwards /api/chat requests to the Python backend.
 *
 * Deploy this file to: public_html/api/chat/index.php
 * Then set BACKEND_URL below to wherever your FastAPI server is running.
 */

// ── Configuration ──────────────────────────────────────────────────
// Point this to your running ollama-proxy / FastAPI backend:
$BACKEND_URL = 'http://187.77.210.230:8000/api/chat';

// Allowed frontend origins (use '*' during testing, lock down for prod)
$ALLOWED_ORIGIN = '*';

// Maximum seconds to wait for the backend
$TIMEOUT = 120;

// ── CORS headers ───────────────────────────────────────────────────
header("Access-Control-Allow-Origin: $ALLOWED_ORIGIN");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// ── Read incoming request body ─────────────────────────────────────
$inputBody = file_get_contents('php://input');
if (empty($inputBody)) {
    http_response_code(400);
    echo json_encode(['error' => 'Empty request body.']);
    exit;
}

// Validate JSON
$decoded = json_decode($inputBody, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON: ' . json_last_error_msg()]);
    exit;
}

// ── Forward to backend ─────────────────────────────────────────────
$ch = curl_init($BACKEND_URL);

curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $inputBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT        => $TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// ── Return response ────────────────────────────────────────────────
if ($curlError) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Could not reach backend server.',
        'detail' => $curlError,
    ]);
    exit;
}

http_response_code($httpCode);
echo $response;
