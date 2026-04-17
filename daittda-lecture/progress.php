<?php
require_once __DIR__ . '/lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); exit;
}

$user = current_user();
if (!$user) { http_response_code(401); exit; }

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { http_response_code(400); exit; }

// CSRF: sendBeacon 은 커스텀 헤더 못 붙이므로 body 에 담긴 토큰도 허용
$token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($data['csrf'] ?? '');
if (!is_string($token) || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
    http_response_code(403); exit;
}

$lectureId = (int)($data['lectureId'] ?? 0);
$delta     = max(0, min(120, (int)($data['deltaSeconds'] ?? 0)));
$position  = max(0, (int)($data['position'] ?? 0));
$forceDone = !empty($data['completed']);
$reportedDuration = (int)($data['duration'] ?? 0);

if (!$lectureId) { http_response_code(400); exit; }

if (!can_access_lecture($user, $lectureId)) {
    http_response_code(403); exit;
}

$stmt = db()->prepare('SELECT duration FROM lectures WHERE id = ?');
$stmt->execute([$lectureId]);
$lec = $stmt->fetch();
if (!$lec) { http_response_code(404); exit; }

// 강의 길이가 아직 0이고 클라이언트가 측정한 값이 있으면 저장 (최초 1회)
if ((int)$lec['duration'] <= 0 && $reportedDuration > 0 && $reportedDuration < 36000) {
    $upd = db()->prepare('UPDATE lectures SET duration = ? WHERE id = ? AND duration <= 0');
    $upd->execute([$reportedDuration, $lectureId]);
    $lec['duration'] = $reportedDuration;
}

$pdo = db();
$pdo->beginTransaction();
$stmt = $pdo->prepare('SELECT * FROM watch_logs WHERE user_id = ? AND lecture_id = ?');
$stmt->execute([$user['id'], $lectureId]);
$row = $stmt->fetch();

$watched = ($row ? (int)$row['watched_seconds'] : 0) + $delta;
$completed = $forceDone || (!empty($row['completed']) ? 1 : 0);
if (!$completed && (int)$lec['duration'] > 0 && $watched >= (int)($lec['duration'] * 0.9)) {
    $completed = 1;
}

if ($row) {
    $upd = $pdo->prepare(<<<'SQL'
        UPDATE watch_logs
        SET watched_seconds = ?, last_position = ?, completed = ?, updated_at = datetime('now')
        WHERE id = ?
    SQL);
    $upd->execute([$watched, $position, $completed ? 1 : 0, $row['id']]);
} else {
    $ins = $pdo->prepare(<<<'SQL'
        INSERT INTO watch_logs (user_id, lecture_id, watched_seconds, last_position, completed)
        VALUES (?, ?, ?, ?, ?)
    SQL);
    $ins->execute([$user['id'], $lectureId, $watched, $position, $completed ? 1 : 0]);
}
$pdo->commit();

json_response(['ok' => true, 'watchedSeconds' => $watched, 'completed' => (bool)$completed]);
