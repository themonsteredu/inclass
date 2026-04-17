<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$uid = (int)($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
$stmt->execute([$uid]);
$u = $stmt->fetch();
if (!$u) { http_response_code(404); echo '학생을 찾을 수 없습니다.'; exit; }

$stmt = db()->prepare(<<<'SQL'
    SELECT wl.*, l.type, l.title AS lecture_title, l.duration,
           p.number AS problem_number, p.title AS problem_title,
           w.title AS workbook_title
    FROM watch_logs wl
    JOIN lectures l  ON l.id = wl.lecture_id
    JOIN problems p  ON p.id = l.problem_id
    JOIN workbooks w ON w.id = p.workbook_id
    WHERE wl.user_id = ?
    ORDER BY wl.updated_at DESC
SQL);
$stmt->execute([$u['id']]);
$logs = $stmt->fetchAll();

$total = array_sum(array_map(fn($l) => (int)$l['watched_seconds'], $logs));
$done  = array_sum(array_map(fn($l) => (int)$l['completed'], $logs));

render_header($u['name'] . ' 수강 현황');
?>
<div class="breadcrumb"><a href="<?= h(app_url('admin/analytics.php')) ?>">← 수강 현황</a></div>
<h1><?= h($u['name']) ?> <span class="muted" style="font-size:14px;font-weight:400;">(<?= h($u['username']) ?>)</span></h1>
<p class="muted">누적 시청 <?= h(format_seconds($total)) ?> · 완료 <?= $done ?> / <?= count($logs) ?></p>

<table class="table">
  <thead>
    <tr>
      <th>문제집</th><th>문제</th><th>유형</th><th>강의</th>
      <th>시청</th><th>길이</th><th>완료</th><th>마지막 수강</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($logs as $l): ?>
      <tr>
        <td><?= h($l['workbook_title']) ?></td>
        <td>#<?= (int)$l['problem_number'] ?> <?= h($l['problem_title']) ?></td>
        <td><?= h(lecture_type_label($l['type'])) ?></td>
        <td><?= h($l['lecture_title']) ?></td>
        <td><?= h(format_seconds((int)$l['watched_seconds'])) ?></td>
        <td><?= h(format_seconds((int)$l['duration'])) ?></td>
        <td><?= (int)$l['completed'] ? '<span class="pill ok">완료</span>' : '<span class="pill wait">진행중</span>' ?></td>
        <td class="muted"><?= h(substr($l['updated_at'], 0, 16)) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$logs): ?><tr><td colspan="8" style="text-align:center;color:var(--muted);">시청 기록이 없습니다.</td></tr><?php endif; ?>
  </tbody>
</table>
<?php render_footer(); ?>
