<?php
declare(strict_types=1);

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) return null;
    static $cached = null;
    if ($cached !== null && $cached['id'] === $_SESSION['user_id']) return $cached;
    $stmt = db()->prepare('SELECT id, username, name, role FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    $cached = $user ?: null;
    return $cached;
}

function require_login(): array
{
    $u = current_user();
    if (!$u) {
        $target = urlencode($_SERVER['REQUEST_URI'] ?? '/');
        header("Location: " . app_url("login.php?next={$target}"));
        exit;
    }
    return $u;
}

function require_admin(): array
{
    $u = require_login();
    if ($u['role'] !== 'ADMIN') {
        http_response_code(403);
        echo '관리자 권한이 필요합니다.';
        exit;
    }
    return $u;
}

function try_login(string $username, string $password): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if (!$user) return null;
    if (!password_verify($password, $user['password_hash'])) return null;
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$user['id'];
    return $user;
}

function logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], (bool)$p['secure'], (bool)$p['httponly']);
    }
    session_destroy();
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function verify_csrf(): void
{
    $token = $_POST['csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
        http_response_code(403);
        echo 'CSRF 토큰이 올바르지 않습니다.';
        exit;
    }
}

// 학생이 해당 문제집에 접근 가능한지
function can_access_workbook(array $user, int $workbookId): bool
{
    if ($user['role'] === 'ADMIN') return true;
    $stmt = db()->prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND workbook_id = ?');
    $stmt->execute([$user['id'], $workbookId]);
    return (bool)$stmt->fetchColumn();
}

function can_access_lecture(array $user, int $lectureId): bool
{
    if ($user['role'] === 'ADMIN') return true;
    $stmt = db()->prepare(<<<'SQL'
        SELECT p.workbook_id
        FROM lectures l
        JOIN problems p ON p.id = l.problem_id
        WHERE l.id = ?
    SQL);
    $stmt->execute([$lectureId]);
    $wbId = $stmt->fetchColumn();
    if ($wbId === false) return false;
    return can_access_workbook($user, (int)$wbId);
}
