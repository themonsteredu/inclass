<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$perStudent = db()->query(<<<'SQL'
    SELECT u.id, u.name, u.username,
           COUNT(wl.id) AS watched_count,
           COALESCE(SUM(wl.watched_seconds),0) AS total_sec
    FROM users u
    LEFT JOIN watch_logs wl ON wl.user_id = u.id
    WHERE u.role = 'STUDENT'
    GROUP BY u.id
    ORDER BY u.created_at ASC
SQL)->fetchAll();

$perLecture = db()->query(<<<'SQL'
    SELECT l.id AS lecture_id, l.type, l.title, l.duration,
           p.number AS problem_number, p.title AS problem_title,
           w.title AS workbook_title,
           COUNT(wl.id) AS viewers,
           COALESCE(SUM(wl.watched_seconds),0) AS total_sec
    FROM lectures l
    JOIN problems p ON p.id = l.problem_id
    JOIN workbooks w ON w.id = p.workbook_id
    LEFT JOIN watch_logs wl ON wl.lecture_id = l.id
    GROUP BY l.id
    ORDER BY w.sort_order, w.created_at, p.number, l.type
SQL)->fetchAll();

render_header('수강 현황');
?>
<h1>수강 현황</h1>

<h2>학생별 총 시청 시간</h2>
<table class="table">
  <thead><tr><th>학생</th><th>아이디</th><th>수강 강의 수</th><th>누적 시청</th><th>상세</th></tr></thead>
  <tbody>
    <?php foreach ($perStudent as $s): ?>
      <tr>
        <td><?= h($s['name']) ?></td>
        <td style="font-family:monospace;"><?= h($s['username']) ?></td>
        <td><?= (int)$s['watched_count'] ?></td>
        <td><?= h(format_seconds((int)$s['total_sec'])) ?></td>
        <td><a href="<?= h(app_url('admin/analytics_user.php?id=' . (int)$s['id'])) ?>">상세보기</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$perStudent): ?><tr><td colspan="5" style="text-align:center;color:var(--muted);">학생이 없습니다.</td></tr><?php endif; ?>
  </tbody>
</table>

<h2>강의별 시청 합계</h2>
<table class="table">
  <thead><tr><th>문제집</th><th>문제</th><th>강의</th><th>시청자 수</th><th>누적 시청</th><th>상세</th></tr></thead>
  <tbody>
    <?php foreach ($perLecture as $l): ?>
      <tr>
        <td><?= h($l['workbook_title']) ?></td>
        <td>#<?= (int)$l['problem_number'] ?> <?= h($l['problem_title']) ?></td>
        <td>[<?= h(lecture_type_label($l['type'])) ?>] <?= h($l['title']) ?></td>
        <td><?= (int)$l['viewers'] ?></td>
        <td><?= h(format_seconds((int)$l['total_sec'])) ?></td>
        <td><a href="<?= h(app_url('admin/analytics_lecture.php?id=' . (int)$l['lecture_id'])) ?>">상세보기</a></td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$perLecture): ?><tr><td colspan="6" style="text-align:center;color:var(--muted);">등록된 강의가 없습니다.</td></tr><?php endif; ?>
  </tbody>
</table>
<?php render_footer(); ?>
