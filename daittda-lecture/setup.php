<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

// 관리자가 이미 있으면 접근 불가 (봉인)
$adminCount = (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'")->fetchColumn();
if ($adminCount > 0) {
    redirect('login.php');
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim((string)($_POST['username'] ?? ''));
    $name     = trim((string)($_POST['name'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    if (strlen($username) < 3 || !preg_match('/^[A-Za-z0-9._-]+$/', $username)) {
        $error = '아이디는 영문/숫자/._- 만, 3자 이상이어야 합니다.';
    } elseif ($name === '') {
        $error = '이름을 입력하세요.';
    } elseif (strlen($password) < 6) {
        $error = '비밀번호는 6자 이상이어야 합니다.';
    } else {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        try {
            $stmt = db()->prepare(
                "INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, 'ADMIN')"
            );
            $stmt->execute([$username, $hash, $name]);
            // 자동 로그인
            try_login($username, $password);
            redirect('admin/');
        } catch (PDOException $e) {
            $error = '계정을 생성할 수 없습니다: ' . $e->getMessage();
        }
    }
}

render_header('최초 설정');
?>
<div class="card" style="max-width: 420px; margin: 40px auto;">
  <h1>최초 관리자 계정 생성</h1>
  <p class="muted">시스템에 관리자가 없습니다. 첫 관리자 한 명을 만드세요. (한 번 생성 후에는 이 페이지가 더 이상 열리지 않습니다.)</p>
  <form method="post" action="<?= h(app_url('setup.php')) ?>">
    <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
    <label>아이디</label>
    <input type="text" name="username" required minlength="3" pattern="[A-Za-z0-9._\-]+">
    <div class="spacer"></div>
    <label>이름</label>
    <input type="text" name="name" required>
    <div class="spacer"></div>
    <label>비밀번호 (6자 이상)</label>
    <input type="password" name="password" required minlength="6">
    <?php if ($error): ?>
      <p style="color:#dc2626; margin-top:10px; font-size:13px;"><?= h($error) ?></p>
    <?php endif; ?>
    <div class="spacer"></div>
    <button class="btn" style="width:100%;">관리자 계정 생성</button>
  </form>
</div>
<?php
render_footer();
