<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$students = db()->query(<<<'SQL'
    SELECT u.*, (SELECT COUNT(*) FROM enrollments WHERE user_id = u.id) AS granted
    FROM users u
    WHERE u.role = 'STUDENT'
    ORDER BY u.created_at ASC
SQL)->fetchAll();
$totalWorkbooks = (int)db()->query('SELECT COUNT(*) FROM workbooks')->fetchColumn();

render_header('강의 접근 권한');
?>
<h1>강의 접근 권한</h1>
<p class="muted">학생별로 접근 가능한 문제집을 지정하세요. 체크한 문제집에 속한 모든 문제/강의를 해당 학생이 볼 수 있습니다.</p>

<table class="table">
  <thead>
    <tr><th>학생</th><th>아이디</th><th>접근 가능 문제집</th><th style="width:80px;">편집</th></tr>
  </thead>
  <tbody>
    <?php foreach ($students as $s): ?>
      <tr>
        <td><?= h($s['name']) ?></td>
        <td style="font-family:monospace;"><?= h($s['username']) ?></td>
        <td><?= (int)$s['granted'] ?> / <?= $totalWorkbooks ?></td>
        <td><a href="<?= h(app_url('admin/enrollment.php?id=' . (int)$s['id'])) ?>">편집</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$students): ?>
      <tr><td colspan="4" style="text-align:center; color:var(--muted);">학생이 없습니다. 먼저 학생 계정을 등록하세요.</td></tr>
    <?php endif; ?>
  </tbody>
</table>
<?php render_footer(); ?>
