<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$lid = (int)($_GET['id'] ?? 0);
$stmt = db()->prepare(<<<'SQL'
    SELECT l.*, p.number AS problem_number, p.title AS problem_title, w.title AS workbook_title
    FROM lectures l
    JOIN problems p ON p.id = l.problem_id
    JOIN workbooks w ON w.id = p.workbook_id
    WHERE l.id = ?
SQL);
$stmt->execute([$lid]);
$lec = $stmt->fetch();
if (!$lec) { http_response_code(404); echo '강의를 찾을 수 없습니다.'; exit; }

$stmt = db()->prepare(<<<'SQL'
    SELECT wl.*, u.name, u.username
    FROM watch_logs wl
    JOIN users u ON u.id = wl.user_id
    WHERE wl.lecture_id = ?
    ORDER BY wl.watched_seconds DESC
SQL);
$stmt->execute([$lec['id']]);
$logs = $stmt->fetchAll();

render_header($lec['title'] . ' 시청');
?>
<div class="breadcrumb"><a href="<?= h(app_url('admin/analytics.php')) ?>">← 수강 현황</a></div>
<h1>[<?= h(lecture_type_label($lec['type'])) ?>] <?= h($lec['title']) ?></h1>
<p class="muted"><?= h($lec['workbook_title']) ?> / #<?= (int)$lec['problem_number'] ?> <?= h($lec['problem_title']) ?> · 길이 <?= h(format_seconds((int)$lec['duration'])) ?></p>

<table class="table">
  <thead>
    <tr>
      <th>학생</th><th>아이디</th><th>시청</th><th>진행률</th>
      <th>마지막 위치</th><th>완료</th><th>최근 수강</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($logs as $l):
      $pct = (int)$lec['duration'] > 0
        ? min(100, (int)round(((int)$l['watched_seconds'] / (int)$lec['duration']) * 100))
        : 0;
    ?>
      <tr>
        <td><?= h($l['name']) ?></td>
        <td style="font-family:monospace;"><?= h($l['username']) ?></td>
        <td><?= h(format_seconds((int)$l['watched_seconds'])) ?></td>
        <td>
          <?= $pct ?>%
          <div class="progress"><div style="width:<?= $pct ?>%;"></div></div>
        </td>
        <td><?= h(format_seconds((int)$l['last_position'])) ?></td>
        <td><?= (int)$l['completed'] ? '<span class="pill ok">완료</span>' : '<span class="pill wait">진행중</span>' ?></td>
        <td class="muted"><?= h(substr($l['updated_at'], 0, 16)) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$logs): ?><tr><td colspan="7" style="text-align:center;color:var(--muted);">시청 기록이 없습니다.</td></tr><?php endif; ?>
  </tbody>
</table>
<?php render_footer(); ?>
