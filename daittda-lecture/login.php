<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

$error = null;
$next  = $_GET['next'] ?? $_POST['next'] ?? app_url('workbooks.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim((string)($_POST['username'] ?? ''));
    $password = (string)($_POST['password'] ?? '');
    $user = try_login($username, $password);
    if ($user) {
        header('Location: ' . $next);
        exit;
    }
    $error = '아이디 또는 비밀번호가 올바르지 않습니다.';
}

if (current_user()) {
    redirect('workbooks.php');
}

render_header('로그인');
?>
<div class="card" style="max-width: 360px; margin: 40px auto;">
  <h1 style="margin-bottom:16px;">로그인</h1>
  <form method="post" action="<?= h(app_url('login.php')) ?>">
    <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
    <input type="hidden" name="next" value="<?= h($next) ?>">
    <label>아이디</label>
    <input type="text" name="username" autocomplete="username" required>
    <div class="spacer"></div>
    <label>비밀번호</label>
    <input type="password" name="password" autocomplete="current-password" required>
    <?php if ($error): ?>
      <p style="color:#dc2626; margin-top:10px; font-size:13px;"><?= h($error) ?></p>
    <?php endif; ?>
    <div class="spacer"></div>
    <button class="btn" style="width:100%;">로그인</button>
  </form>
  <p class="muted" style="margin-top:14px; font-size:12px;">
    계정은 관리자가 발급합니다.
  </p>
</div>
<?php
render_footer();
