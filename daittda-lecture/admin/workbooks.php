<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'create') {
        $title = trim((string)($_POST['title'] ?? ''));
        $desc  = trim((string)($_POST['description'] ?? ''));
        $order = (int)($_POST['sort_order'] ?? 0);
        if ($title !== '') {
            $stmt = db()->prepare('INSERT INTO workbooks (title, description, sort_order) VALUES (?, ?, ?)');
            $stmt->execute([$title, $desc !== '' ? $desc : null, $order]);
            flash_set('문제집을 추가했습니다.');
        }
    } elseif ($action === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) {
            $stmt = db()->prepare('DELETE FROM workbooks WHERE id = ?');
            $stmt->execute([$id]);
            flash_set('문제집을 삭제했습니다.');
        }
    }
    redirect('admin/workbooks.php');
}

$rows = db()->query(<<<'SQL'
    SELECT w.*,
      (SELECT COUNT(*) FROM problems WHERE workbook_id = w.id) AS problem_count
    FROM workbooks w
    ORDER BY w.sort_order ASC, w.created_at ASC
SQL)->fetchAll();

render_header('문제집 관리');
?>
<h1>문제집 관리</h1>
<?php flash_render(); ?>

<form method="post" class="card" style="margin-bottom:16px;">
  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
  <input type="hidden" name="action" value="create">
  <div class="row">
    <input type="text" name="title" placeholder="문제집 제목" required>
    <input type="number" name="sort_order" value="0" min="0" class="fix" style="width:80px;" title="정렬 순서">
    <button class="btn fix">문제집 추가</button>
  </div>
  <div class="spacer"></div>
  <input type="text" name="description" placeholder="설명 (선택)">
</form>

<ul class="list">
  <?php foreach ($rows as $w): ?>
    <li style="padding:10px 14px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <a href="<?= h(app_url('admin/workbook.php?id=' . (int)$w['id'])) ?>"><strong><?= h($w['title']) ?></strong></a>
        <span class="muted" style="margin-left:10px;">문제 <?= (int)$w['problem_count'] ?>개</span>
      </div>
      <form method="post" onsubmit="return confirm('삭제하시겠습니까? 문제·강의·시청기록이 모두 삭제됩니다.');">
        <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
        <input type="hidden" name="action" value="delete">
        <input type="hidden" name="id" value="<?= (int)$w['id'] ?>">
        <button class="btn danger small">삭제</button>
      </form>
    </li>
  <?php endforeach; ?>
  <?php if (!$rows): ?>
    <li><div style="padding:22px; text-align:center; color: var(--muted);">등록된 문제집이 없습니다.</div></li>
  <?php endif; ?>
</ul>
<?php render_footer(); ?>
