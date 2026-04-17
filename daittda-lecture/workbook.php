<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

$user = require_login();
$id = (int)($_GET['id'] ?? 0);

$stmt = db()->prepare('SELECT * FROM workbooks WHERE id = ?');
$stmt->execute([$id]);
$wb = $stmt->fetch();
if (!$wb) { http_response_code(404); echo '문제집을 찾을 수 없습니다.'; exit; }
if (!can_access_workbook($user, (int)$wb['id'])) {
    redirect('workbooks.php');
}

$stmt = db()->prepare(<<<'SQL'
    SELECT p.id, p.number, p.title,
        (SELECT COUNT(*) FROM lectures WHERE problem_id = p.id) AS lecture_count,
        (SELECT COUNT(*) FROM watch_logs wl
           JOIN lectures l ON l.id = wl.lecture_id
           WHERE l.problem_id = p.id AND wl.user_id = ? AND wl.completed = 1
        ) AS completed_count
    FROM problems p
    WHERE p.workbook_id = ?
    ORDER BY p.number ASC
SQL);
$stmt->execute([$user['id'], $wb['id']]);
$problems = $stmt->fetchAll();

render_header($wb['title']);
?>
<div class="breadcrumb">
  <a href="<?= h(app_url('workbooks.php')) ?>">← 문제집 목록</a>
</div>
<h1><?= h($wb['title']) ?></h1>
<?php if ($wb['description']): ?><p class="muted"><?= h($wb['description']) ?></p><?php endif; ?>

<ul class="list" style="margin-top:14px;">
  <?php foreach ($problems as $p): ?>
    <li>
      <a href="<?= h(app_url('problem.php?id=' . (int)$p['id'])) ?>">
        <span>
          <span class="muted">#<?= (int)$p['number'] ?></span>
          &nbsp;<strong><?= h($p['title']) ?></strong>
        </span>
        <span class="muted">
          강의 <?= (int)$p['lecture_count'] ?>개 · 완료 <?= (int)$p['completed_count'] ?>개
        </span>
      </a>
    </li>
  <?php endforeach; ?>
  <?php if (!$problems): ?>
    <li><div style="padding:22px; text-align:center; color: var(--muted);">등록된 문제가 없습니다.</div></li>
  <?php endif; ?>
</ul>
<?php render_footer(); ?>
