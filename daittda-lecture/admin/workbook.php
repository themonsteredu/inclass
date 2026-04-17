<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

$id = (int)($_GET['id'] ?? 0);
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (($_POST['action'] ?? '') !== '')) {
    verify_csrf();
    $action = $_POST['action'];
    if ($action === 'problem_create') {
        $wbId   = (int)$_POST['workbook_id'];
        $number = (int)$_POST['number'];
        $title  = trim((string)($_POST['title'] ?? ''));
        if ($wbId && $number > 0 && $title !== '') {
            try {
                $stmt = db()->prepare('INSERT INTO problems (workbook_id, number, title) VALUES (?, ?, ?)');
                $stmt->execute([$wbId, $number, $title]);
                flash_set('문제를 추가했습니다.');
            } catch (PDOException $e) {
                flash_set('동일한 번호의 문제가 이미 존재합니다.');
            }
            redirect('admin/workbook.php?id=' . $wbId);
        }
    } elseif ($action === 'problem_delete') {
        $pid = (int)$_POST['id'];
        $stmt = db()->prepare('DELETE FROM problems WHERE id = ?');
        $stmt->execute([$pid]);
        flash_set('문제를 삭제했습니다.');
        redirect('admin/workbook.php?id=' . $id);
    } elseif ($action === 'lecture_delete') {
        $lid = (int)$_POST['id'];
        // 파일도 제거
        $stmt = db()->prepare('SELECT file_path FROM lectures WHERE id = ?');
        $stmt->execute([$lid]);
        if ($row = $stmt->fetch()) {
            $full = realpath(VIDEO_DIR . '/' . $row['file_path']);
            $root = realpath(VIDEO_DIR);
            if ($full && $root && strncmp($full, $root . DIRECTORY_SEPARATOR, strlen($root) + 1) === 0) {
                @unlink($full);
            }
        }
        $stmt = db()->prepare('DELETE FROM lectures WHERE id = ?');
        $stmt->execute([$lid]);
        flash_set('강의를 삭제했습니다.');
        redirect('admin/workbook.php?id=' . $id);
    }
}

$stmt = db()->prepare('SELECT * FROM workbooks WHERE id = ?');
$stmt->execute([$id]);
$wb = $stmt->fetch();
if (!$wb) { http_response_code(404); echo '문제집을 찾을 수 없습니다.'; exit; }

$stmt = db()->prepare('SELECT * FROM problems WHERE workbook_id = ? ORDER BY number ASC');
$stmt->execute([$wb['id']]);
$problems = $stmt->fetchAll();

// 강의 묶음
$lecturesByProblem = [];
if ($problems) {
    $ids = array_column($problems, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = db()->prepare("SELECT * FROM lectures WHERE problem_id IN ($placeholders)");
    $stmt->execute($ids);
    foreach ($stmt->fetchAll() as $lec) {
        $lecturesByProblem[(int)$lec['problem_id']][$lec['type']] = $lec;
    }
}

render_header($wb['title']);
?>
<div class="breadcrumb">
  <a href="<?= h(app_url('admin/workbooks.php')) ?>">← 문제집 목록</a>
</div>
<h1><?= h($wb['title']) ?></h1>
<?php flash_render(); ?>

<form method="post" class="card" style="margin-bottom:16px;">
  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
  <input type="hidden" name="action" value="problem_create">
  <input type="hidden" name="workbook_id" value="<?= (int)$wb['id'] ?>">
  <div class="row">
    <input type="number" name="number" min="1" placeholder="번호" required style="max-width:80px;">
    <input type="text" name="title" placeholder="문제 제목" required>
    <button class="btn fix">문제 추가</button>
  </div>
</form>

<?php foreach ($problems as $p): $pid = (int)$p['id']; ?>
  <div class="card" style="margin-bottom:12px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <div><span class="muted">#<?= (int)$p['number'] ?></span> <strong><?= h($p['title']) ?></strong></div>
      <form method="post" onsubmit="return confirm('문제와 강의·시청기록이 삭제됩니다. 진행할까요?');">
        <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
        <input type="hidden" name="action" value="problem_delete">
        <input type="hidden" name="id" value="<?= $pid ?>">
        <button class="btn danger small">문제 삭제</button>
      </form>
    </div>

    <div class="grid grid-3">
      <?php foreach (['TIP','CONCEPT','PATTERN'] as $t):
        $lec = $lecturesByProblem[$pid][$t] ?? null;
      ?>
        <div class="card" style="background:#f8fafc;">
          <div class="muted" style="font-size:12px;"><?= h(lecture_type_label($t)) ?></div>
          <?php if ($lec): ?>
            <div style="margin-top:4px; font-weight:600;"><?= h($lec['title']) ?></div>
            <div class="muted" style="font-size:12px; margin-top:4px;">
              <?= h(format_seconds((int)$lec['duration'])) ?> ·
              <?= number_format((int)$lec['size_bytes'] / 1024 / 1024, 1) ?>MB
            </div>
            <form method="post" style="margin-top:8px;" onsubmit="return confirm('이 강의를 삭제합니다.');">
              <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="action" value="lecture_delete">
              <input type="hidden" name="id" value="<?= (int)$lec['id'] ?>">
              <button class="btn small secondary" type="submit" style="width:100%;">강의 삭제</button>
            </form>
          <?php else: ?>
            <div class="muted" style="margin-top:4px;">미업로드</div>
          <?php endif; ?>

          <form method="post"
                action="<?= h(app_url('admin/upload.php')) ?>"
                enctype="multipart/form-data"
                style="margin-top:8px;">
            <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
            <input type="hidden" name="problem_id" value="<?= $pid ?>">
            <input type="hidden" name="type" value="<?= h($t) ?>">
            <input type="text" name="title" value="<?= h($lec['title'] ?? '') ?>" placeholder="강의 제목" required style="font-size:13px;">
            <div class="spacer"></div>
            <input type="file" name="video" accept="video/*" required style="font-size:12px;">
            <div class="spacer"></div>
            <button class="btn small" type="submit" style="width:100%;"><?= $lec ? '교체 업로드' : '업로드' ?></button>
          </form>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
<?php endforeach; ?>
<?php if (!$problems): ?>
  <div class="card" style="text-align:center; color:var(--muted);">문제를 먼저 추가하세요.</div>
<?php endif; ?>
<?php render_footer(); ?>
