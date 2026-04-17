<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

$user = require_login();
$id = (int)($_GET['id'] ?? 0);

$stmt = db()->prepare(<<<'SQL'
    SELECT p.*, w.title AS workbook_title, w.id AS workbook_id
    FROM problems p JOIN workbooks w ON w.id = p.workbook_id
    WHERE p.id = ?
SQL);
$stmt->execute([$id]);
$problem = $stmt->fetch();
if (!$problem) { http_response_code(404); echo '문제를 찾을 수 없습니다.'; exit; }
if (!can_access_workbook($user, (int)$problem['workbook_id'])) {
    redirect('workbooks.php');
}

$stmt = db()->prepare('SELECT * FROM lectures WHERE problem_id = ?');
$stmt->execute([$problem['id']]);
$lectureRows = $stmt->fetchAll();
$byType = [];
foreach ($lectureRows as $lec) $byType[$lec['type']] = $lec;

// 해당 학생의 시청 로그
$stmt = db()->prepare('SELECT lecture_id, watched_seconds, completed FROM watch_logs WHERE user_id = ? AND lecture_id IN (SELECT id FROM lectures WHERE problem_id = ?)');
$stmt->execute([$user['id'], $problem['id']]);
$logByLecture = [];
foreach ($stmt->fetchAll() as $l) $logByLecture[(int)$l['lecture_id']] = $l;

render_header("{$problem['title']}");
?>
<div class="breadcrumb">
  <a href="<?= h(app_url('workbook.php?id=' . (int)$problem['workbook_id'])) ?>">← <?= h($problem['workbook_title']) ?></a>
</div>
<h1><span class="muted">#<?= (int)$problem['number'] ?></span> <?= h($problem['title']) ?></h1>

<div class="grid grid-3" style="margin-top:16px;">
  <?php foreach (['TIP','CONCEPT','PATTERN'] as $t):
      $lec = $byType[$t] ?? null;
      $log = $lec ? ($logByLecture[(int)$lec['id']] ?? null) : null;
  ?>
    <?php if ($lec): ?>
      <a class="card" href="<?= h(app_url('lecture.php?id=' . (int)$lec['id'])) ?>" style="text-decoration:none;color:inherit;">
        <div class="muted" style="font-size:12px;"><?= h(lecture_type_label($t)) ?></div>
        <div style="margin-top:4px; font-weight:600;"><?= h($lec['title']) ?></div>
        <div class="muted" style="margin-top:8px; font-size:12px;">
          길이 <?= h(format_seconds((int)$lec['duration'])) ?> ·
          시청 <?= h(format_seconds((int)($log['watched_seconds'] ?? 0))) ?>
          <?php if (!empty($log['completed'])): ?><span class="pill ok" style="margin-left:4px;">완료</span><?php endif; ?>
        </div>
      </a>
    <?php else: ?>
      <div class="card" style="opacity:.6;">
        <div class="muted" style="font-size:12px;"><?= h(lecture_type_label($t)) ?></div>
        <div style="margin-top:4px;">준비 중</div>
      </div>
    <?php endif; ?>
  <?php endforeach; ?>
</div>
<?php render_footer(); ?>
