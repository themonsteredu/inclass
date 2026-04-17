<?php
require_once __DIR__ . '/lib/bootstrap.php';

$user = current_user();
if (!$user) { http_response_code(401); echo 'Unauthorized'; exit; }

$id = (int)($_GET['id'] ?? 0);
if (!$id) { http_response_code(400); exit; }

if (!can_access_lecture($user, $id)) {
    http_response_code(403); echo 'Forbidden'; exit;
}

$stmt = db()->prepare('SELECT file_path, mime_type FROM lectures WHERE id = ?');
$stmt->execute([$id]);
$lec = $stmt->fetch();
if (!$lec) { http_response_code(404); exit; }

// 안전: VIDEO_DIR 하위로만 제한
$full = realpath(VIDEO_DIR . '/' . $lec['file_path']);
$root = realpath(VIDEO_DIR);
if (!$full || !$root || strncmp($full, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) !== 0) {
    http_response_code(404); echo 'Not Found'; exit;
}
if (!is_readable($full)) { http_response_code(404); echo 'File missing'; exit; }

$size = filesize($full);
$mime = $lec['mime_type'] ?: 'video/mp4';

// 출력 버퍼 정리 (스트리밍 간섭 방지)
while (ob_get_level() > 0) { ob_end_clean(); }
ignore_user_abort(true);
set_time_limit(0);

header('Content-Type: ' . $mime);
header('Accept-Ranges: bytes');
header('Cache-Control: private, max-age=0, no-cache');

$start = 0;
$end   = $size - 1;

if (!empty($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
    if ($m[1] !== '') $start = (int)$m[1];
    if ($m[2] !== '') $end   = (int)$m[2];
    if ($start > $end || $start >= $size || $end >= $size) {
        header("Content-Range: bytes */{$size}");
        http_response_code(416);
        exit;
    }
    http_response_code(206);
    header("Content-Range: bytes {$start}-{$end}/{$size}");
} else {
    http_response_code(200);
}

$length = $end - $start + 1;
header('Content-Length: ' . $length);

$fp = fopen($full, 'rb');
if (!$fp) { http_response_code(500); exit; }
fseek($fp, $start);

$remaining = $length;
$buf = 8192;
while ($remaining > 0 && !feof($fp) && !connection_aborted()) {
    $read = min($buf, $remaining);
    $data = fread($fp, $read);
    if ($data === false) break;
    echo $data;
    flush();
    $remaining -= strlen($data);
}
fclose($fp);
