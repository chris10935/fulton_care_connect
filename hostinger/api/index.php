<?php
/**
 * Generic API Proxy
 * -----------------
 * Forwards any request to /api/* on to the Python backend on the VPS.
 *
 * Deploy to:  public_html/api/index.php
 * .htaccess routes all /api/* requests here.
 */

// ── Configuration ──────────────────────────────────────────────────
// VPS base URL (no trailing slash)
$BACKEND_BASE = 'http://187.77.210.230:8000';

// Maximum seconds to wait for the backend
$TIMEOUT = 120;

// ── CORS ───────────────────────────────────────────────────────────
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Build backend URL ──────────────────────────────────────────────
// REQUEST_URI will be e.g. /api/chat or /api/health or /api/locations?limit=5000
$requestUri  = $_SERVER['REQUEST_URI'];

// The VPS exposes /health and /api/chat.
// For /api/health → forward as /health (strip /api prefix)
// For /api/chat  → forward as /api/chat (keep as-is)
// Default: forward as-is
if (preg_match('#^/api/(health|locations)#', $requestUri, $m)) {
    // These VPS routes don't have the /api prefix
    $backendPath = preg_replace('#^/api/#', '/', $requestUri);
} else {
    // /api/chat etc. — forward as-is
    $backendPath = $requestUri;
}

$backendUrl = $BACKEND_BASE . $backendPath;

// ── Forward the request ────────────────────────────────────────────
$method    = $_SERVER['REQUEST_METHOD'];
$inputBody = file_get_contents('php://input');

$ch = curl_init($backendUrl);

$headers = [
    'Content-Type: application/json',
    'Accept: application/json',
];

$opts = [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => $TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
];

if ($method === 'POST' || $method === 'PUT') {
    $opts[CURLOPT_POSTFIELDS] = $inputBody;
}

curl_setopt_array($ch, $opts);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// ── Return response ────────────────────────────────────────────────
if ($curlError) {
    http_response_code(502);
    echo json_encode([
        'error'   => 'Could not reach backend server.',
        'detail'  => $curlError,
        'backend' => $backendUrl,
    ]);
    exit;
}

http_response_code($httpCode);
echo $response;
