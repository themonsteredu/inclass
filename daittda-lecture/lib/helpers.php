<?php
declare(strict_types=1);

function h(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// 현재 앱이 서빙되는 베이스 경로 (예: "/daittda-lecture/")
function app_base(): string
{
    static $base = null;
    if ($base !== null) return $base;
    $script = $_SERVER['SCRIPT_NAME'] ?? '/';
    // lib 또는 admin 하위도 고려해서 프로젝트 루트까지 올라감
    $script = preg_replace('#/(admin|lib)/.*$#', '/', $script);
    $base = rtrim(dirname($script), '/') . '/';
    if ($base === '//') $base = '/';
    return $base;
}

function app_url(string $path = ''): string
{
    return app_base() . ltrim($path, '/');
}

function format_seconds(int $total): string
{
    if ($total < 0) $total = 0;
    $h = intdiv($total, 3600);
    $m = intdiv($total % 3600, 60);
    $s = $total % 60;
    return $h > 0
        ? sprintf('%d:%02d:%02d', $h, $m, $s)
        : sprintf('%d:%02d', $m, $s);
}

function redirect(string $path): void
{
    header('Location: ' . (str_starts_with($path, 'http') ? $path : app_url($path)));
    exit;
}

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// 업로드 파일 이름을 안전한 문자만 남겨서 반환
function safe_basename(string $name): string
{
    $name = basename($name);
    $name = preg_replace('/[^A-Za-z0-9._-]/', '_', $name) ?? '';
    return substr($name, 0, 100) ?: 'video';
}

function lecture_type_label(string $type): string
{
    return LECTURE_TYPES[$type] ?? $type;
}

function flash_set(string $msg): void
{
    $_SESSION['flash'][] = $msg;
}

function flash_render(): void
{
    if (empty($_SESSION['flash'])) return;
    foreach ($_SESSION['flash'] as $msg) {
        echo '<div class="flash">' . h($msg) . '</div>';
    }
    unset($_SESSION['flash']);
}
