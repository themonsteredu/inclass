<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

// 관리자 없으면 최초 설정 페이지로
$adminCount = (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'ADMIN'")->fetchColumn();
if ($adminCount === 0) {
    redirect('setup.php');
}

$user = current_user();
if ($user) {
    redirect('workbooks.php');
}

render_header();
?>
<div class="hero">
  <h1><?= h(APP_NAME) ?></h1>
  <p>문제집 → 문제 → 팁·개념·유형 강의. 시청 진도가 자동으로 기록됩니다.</p>
  <a class="btn" href="<?= h(app_url('login.php')) ?>">로그인하기</a>
</div>
<?php
render_footer();
