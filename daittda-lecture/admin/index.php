<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$stats = [
    'students'  => (int)db()->query("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'")->fetchColumn(),
    'workbooks' => (int)db()->query('SELECT COUNT(*) FROM workbooks')->fetchColumn(),
    'problems'  => (int)db()->query('SELECT COUNT(*) FROM problems')->fetchColumn(),
    'lectures'  => (int)db()->query('SELECT COUNT(*) FROM lectures')->fetchColumn(),
    'seconds'   => (int)db()->query('SELECT COALESCE(SUM(watched_seconds),0) FROM watch_logs')->fetchColumn(),
];

render_header('관리자');
?>
<h1>관리자 대시보드</h1>
<?php flash_render(); ?>

<div class="grid grid-4">
  <div class="card"><div class="muted">학생</div><div style="font-size:22px;font-weight:600;"><?= $stats['students'] ?>명</div></div>
  <div class="card"><div class="muted">문제집</div><div style="font-size:22px;font-weight:600;"><?= $stats['workbooks'] ?>개</div></div>
  <div class="card"><div class="muted">문제</div><div style="font-size:22px;font-weight:600;"><?= $stats['problems'] ?>개</div></div>
  <div class="card"><div class="muted">강의</div><div style="font-size:22px;font-weight:600;"><?= $stats['lectures'] ?>개</div></div>
</div>
<div style="margin-top:8px;" class="card">
  <div class="muted">누적 시청 시간</div>
  <div style="font-size:22px;font-weight:600;"><?= h(format_seconds($stats['seconds'])) ?></div>
</div>

<div class="grid grid-2" style="margin-top:20px;">
  <a class="card" href="<?= h(app_url('admin/workbooks.php')) ?>" style="text-decoration:none;color:inherit;">
    <div style="font-weight:600;">문제집 / 문제 / 강의 관리</div>
    <div class="muted">문제집과 문제를 만들고 강의 영상을 업로드합니다.</div>
  </a>
  <a class="card" href="<?= h(app_url('admin/users.php')) ?>" style="text-decoration:none;color:inherit;">
    <div style="font-weight:600;">학생 계정 관리</div>
    <div class="muted">학생을 등록하고 비밀번호를 발급합니다.</div>
  </a>
  <a class="card" href="<?= h(app_url('admin/enrollments.php')) ?>" style="text-decoration:none;color:inherit;">
    <div style="font-weight:600;">강의 접근 권한</div>
    <div class="muted">학생별로 볼 수 있는 문제집을 지정합니다.</div>
  </a>
  <a class="card" href="<?= h(app_url('admin/analytics.php')) ?>" style="text-decoration:none;color:inherit;">
    <div style="font-weight:600;">수강 현황 조회</div>
    <div class="muted">학생별/강의별 시청 시간 및 완료 여부를 확인합니다.</div>
  </a>
</div>
<?php render_footer(); ?>
