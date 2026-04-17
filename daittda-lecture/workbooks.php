<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

$user = require_login();

if ($user['role'] === 'ADMIN') {
    $rows = db()->query(<<<'SQL'
        SELECT w.id, w.title, w.description,
            (SELECT COUNT(*) FROM problems WHERE workbook_id = w.id) AS problem_count
        FROM workbooks w
        ORDER BY w.sort_order ASC, w.created_at ASC
    SQL)->fetchAll();
} else {
    $stmt = db()->prepare(<<<'SQL'
        SELECT w.id, w.title, w.description,
            (SELECT COUNT(*) FROM problems WHERE workbook_id = w.id) AS problem_count
        FROM workbooks w
        JOIN enrollments e ON e.workbook_id = w.id AND e.user_id = ?
        ORDER BY w.sort_order ASC, w.created_at ASC
    SQL);
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();
}

render_header('문제집');
?>
<h1>문제집</h1>
<?php flash_render(); ?>
<?php if (!$rows): ?>
  <div class="card" style="text-align:center; color: var(--muted);">
    <?= $user['role'] === 'ADMIN' ? '등록된 문제집이 없습니다.' : '배정된 문제집이 없습니다. 관리자에게 문의하세요.' ?>
  </div>
<?php else: ?>
  <div class="grid grid-2">
    <?php foreach ($rows as $w): ?>
      <a class="card" style="text-decoration:none; color:inherit;" href="<?= h(app_url('workbook.php?id=' . (int)$w['id'])) ?>">
        <div style="font-size:16px; font-weight:600;"><?= h($w['title']) ?></div>
        <?php if ($w['description']): ?>
          <div class="muted" style="margin-top:4px;"><?= h($w['description']) ?></div>
        <?php endif; ?>
        <div class="muted" style="margin-top:8px;">문제 <?= (int)$w['problem_count'] ?>개</div>
      </a>
    <?php endforeach; ?>
  </div>
<?php endif; ?>
<?php render_footer(); ?>
