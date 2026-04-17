<?php
require_once __DIR__ . '/../lib/bootstrap.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
verify_csrf();

$problemId = (int)($_POST['problem_id'] ?? 0);
$type      = (string)($_POST['type'] ?? '');
$title     = trim((string)($_POST['title'] ?? ''));

if (!$problemId || !array_key_exists($type, LECTURE_TYPES) || $title === '') {
    flash_set('입력값이 올바르지 않습니다.');
    header('Location: ' . app_url('admin/workbooks.php')); exit;
}
$stmt = db()->prepare('SELECT workbook_id FROM problems WHERE id = ?');
$stmt->execute([$problemId]);
$wbId = (int)($stmt->fetchColumn() ?: 0);
if (!$wbId) {
    flash_set('문제를 찾을 수 없습니다.');
    header('Location: ' . app_url('admin/workbooks.php')); exit;
}

if (empty($_FILES['video']) || $_FILES['video']['error'] !== UPLOAD_ERR_OK) {
    $code = $_FILES['video']['error'] ?? 'unknown';
    flash_set("업로드 실패 (코드 {$code}). 파일 크기를 확인하세요.");
    header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
}

$tmp  = $_FILES['video']['tmp_name'];
$size = (int)$_FILES['video']['size'];
if ($size > MAX_UPLOAD_BYTES) {
    flash_set('파일이 너무 큽니다.');
    header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
}

// MIME 확인 (php.ini 에 finfo 활성화 필요 — 시놀로지 기본 ON)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$detected = $finfo->file($tmp) ?: '';
if (!in_array($detected, ALLOWED_VIDEO_MIME, true)) {
    // 브라우저가 보낸 MIME 도 한 번 체크 (일부 포맷 방어)
    $claimed = $_FILES['video']['type'] ?? '';
    if (!in_array($claimed, ALLOWED_VIDEO_MIME, true)) {
        flash_set('지원하지 않는 영상 형식입니다. (mp4/webm/mov/m4v/mkv)');
        header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
    }
    $detected = $claimed;
}

$origName = $_FILES['video']['name'] ?? 'video';
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, ALLOWED_VIDEO_EXT, true)) $ext = 'mp4';

if (!is_dir(VIDEO_DIR) && !mkdir(VIDEO_DIR, 0770, true)) {
    flash_set('영상 저장 폴더를 만들 수 없습니다.');
    header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
}
$subDir = "problem_{$problemId}";
$absDir = VIDEO_DIR . '/' . $subDir;
if (!is_dir($absDir) && !mkdir($absDir, 0770, true)) {
    flash_set('영상 저장 폴더를 만들 수 없습니다.');
    header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
}
$fileId = bin2hex(random_bytes(8));
$relPath = "{$subDir}/{$type}-{$fileId}.{$ext}";
$absPath = VIDEO_DIR . '/' . $relPath;

if (!move_uploaded_file($tmp, $absPath)) {
    flash_set('파일을 저장하지 못했습니다.');
    header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
}

// 기존 강의가 있으면 파일 교체 + 이전 파일 삭제
$pdo = db();
$pdo->beginTransaction();
$stmt = $pdo->prepare('SELECT * FROM lectures WHERE problem_id = ? AND type = ?');
$stmt->execute([$problemId, $type]);
$existing = $stmt->fetch();

if ($existing) {
    $upd = $pdo->prepare(<<<'SQL'
        UPDATE lectures SET title = ?, file_path = ?, mime_type = ?, size_bytes = ?
        WHERE id = ?
    SQL);
    $upd->execute([$title, $relPath, $detected, $size, $existing['id']]);

    $oldFull = realpath(VIDEO_DIR . '/' . $existing['file_path']);
    $root = realpath(VIDEO_DIR);
    if ($oldFull && $root && strncmp($oldFull, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) === 0 && $oldFull !== $absPath) {
        @unlink($oldFull);
    }
} else {
    $ins = $pdo->prepare(<<<'SQL'
        INSERT INTO lectures (problem_id, type, title, file_path, mime_type, size_bytes, duration)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    SQL);
    $ins->execute([$problemId, $type, $title, $relPath, $detected, $size]);
}
$pdo->commit();

flash_set('강의를 업로드했습니다. 재생 시 자동으로 영상 길이가 기록됩니다.');
header('Location: ' . app_url('admin/workbook.php?id=' . $wbId)); exit;
