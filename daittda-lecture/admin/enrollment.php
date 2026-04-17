<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$userId = (int)($_GET['id'] ?? 0);
$stmt = db()->prepare('SELECT * FROM users WHERE id = ? AND role = ?');
$stmt->execute([$userId, 'STUDENT']);
$student = $stmt->fetch();
if (!$student) { http_response_code(404); echo '학생을 찾을 수 없습니다.'; exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $checked = $_POST['workbook_ids'] ?? [];
    if (!is_array($checked)) $checked = [];
    $checkedInt = array_values(array_unique(array_filter(array_map('intval', $checked))));

    $pdo = db();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT workbook_id FROM enrollments WHERE user_id = ?');
    $stmt->execute([$student['id']]);
    $current = array_map('intval', array_column($stmt->fetchAll(), 'workbook_id'));

    $toAdd    = array_diff($checkedInt, $current);
    $toRemove = array_diff($current, $checkedInt);

    if ($toRemove) {
        $ph = implode(',', array_fill(0, count($toRemove), '?'));
        $del = $pdo->prepare("DELETE FROM enrollments WHERE user_id = ? AND workbook_id IN ($ph)");
        $del->execute(array_merge([$student['id']], $toRemove));
    }
    if ($toAdd) {
        $ins = $pdo->prepare('INSERT INTO enrollments (user_id, workbook_id) VALUES (?, ?)');
        foreach ($toAdd as $wbId) $ins->execute([$student['id'], $wbId]);
    }
    $pdo->commit();

    flash_set('접근 권한을 저장했습니다.');
    redirect('admin/enrollment.php?id=' . $student['id']);
}

$workbooks = db()->query(<<<'SQL'
    SELECT w.*, (SELECT COUNT(*) FROM problems WHERE workbook_id = w.id) AS problem_count
    FROM workbooks w
    ORDER BY w.sort_order ASC, w.created_at ASC
SQL)->fetchAll();
$stmt = db()->prepare('SELECT workbook_id FROM enrollments WHERE user_id = ?');
$stmt->execute([$student['id']]);
$enrolled = array_flip(array_map('intval', array_column($stmt->fetchAll(), 'workbook_id')));

render_header($student['name'] . ' 권한');
?>
<div class="breadcrumb">
  <a href="<?= h(app_url('admin/enrollments.php')) ?>">← 권한 목록</a>
</div>
<h1><?= h($student['name']) ?> <span class="muted" style="font-size:14px; font-weight:400;">(<?= h($student['username']) ?>)</span></h1>
<p class="muted">이 학생이 접근할 수 있는 문제집을 체크하세요.</p>
<?php flash_render(); ?>

<form method="post">
  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
  <ul class="list">
    <?php if (!$workbooks): ?>
      <li><div style="padding:22px;text-align:center;color:var(--muted);">등록된 문제집이 없습니다.</div></li>
    <?php endif; ?>
    <?php foreach ($workbooks as $w): $wid = (int)$w['id']; ?>
      <li>
        <label style="display:flex; align-items:center; gap:10px; padding:12px 14px; cursor:pointer;">
          <input type="checkbox" name="workbook_ids[]" value="<?= $wid ?>" <?= isset($enrolled[$wid]) ? 'checked' : '' ?>>
          <span style="flex:1;"><strong><?= h($w['title']) ?></strong>
            <span class="muted" style="margin-left:8px; font-size:12px;">문제 <?= (int)$w['problem_count'] ?>개</span>
          </span>
        </label>
      </li>
    <?php endforeach; ?>
  </ul>
  <div style="margin-top:14px; text-align:right;">
    <button class="btn">저장</button>
  </div>
</form>
<?php render_footer(); ?>
