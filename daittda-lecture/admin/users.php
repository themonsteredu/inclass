<?php
require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/layout.php';

$me = require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'create') {
        $username = trim((string)($_POST['username'] ?? ''));
        $name     = trim((string)($_POST['name'] ?? ''));
        $password = (string)($_POST['password'] ?? '');
        $role     = ($_POST['role'] ?? 'STUDENT') === 'ADMIN' ? 'ADMIN' : 'STUDENT';
        if (strlen($username) < 3 || !preg_match('/^[A-Za-z0-9._-]+$/', $username)) {
            flash_set('아이디는 영문/숫자/._- 만 3자 이상이어야 합니다.');
        } elseif ($name === '' || strlen($password) < 6) {
            flash_set('이름과 6자 이상 비밀번호를 입력하세요.');
        } else {
            try {
                $stmt = db()->prepare('INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)');
                $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name, $role]);
                flash_set('계정을 생성했습니다.');
            } catch (PDOException $e) {
                flash_set('이미 존재하는 아이디입니다.');
            }
        }
    } elseif ($action === 'reset') {
        $id = (int)$_POST['id'];
        $password = (string)($_POST['password'] ?? '');
        if ($id && strlen($password) >= 6) {
            $stmt = db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
            $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
            flash_set('비밀번호를 변경했습니다.');
        } else {
            flash_set('비밀번호는 6자 이상이어야 합니다.');
        }
    } elseif ($action === 'delete') {
        $id = (int)$_POST['id'];
        if ($id && $id !== (int)$me['id']) {
            $stmt = db()->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$id]);
            flash_set('계정을 삭제했습니다.');
        } else {
            flash_set('본인 계정은 삭제할 수 없습니다.');
        }
    }
    redirect('admin/users.php');
}

$users = db()->query('SELECT * FROM users ORDER BY role ASC, created_at ASC')->fetchAll();

render_header('사용자 관리');
?>
<h1>사용자 관리</h1>
<?php flash_render(); ?>

<form method="post" class="card" style="margin-bottom:16px;">
  <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
  <input type="hidden" name="action" value="create">
  <div class="row" style="gap:6px;">
    <input type="text" name="username" placeholder="아이디" required>
    <input type="text" name="name" placeholder="이름" required>
    <input type="text" name="password" placeholder="초기 비밀번호(6자+)" required minlength="6">
    <select name="role" class="fix" style="width:110px;">
      <option value="STUDENT">학생</option>
      <option value="ADMIN">관리자</option>
    </select>
    <button class="btn fix">등록</button>
  </div>
</form>

<table class="table">
  <thead>
    <tr>
      <th>아이디</th><th>이름</th><th>권한</th><th>가입일</th>
      <th style="width:260px;">비밀번호 재설정</th>
      <th style="width:60px;">삭제</th>
    </tr>
  </thead>
  <tbody>
    <?php foreach ($users as $u): ?>
      <tr>
        <td style="font-family:monospace;"><?= h($u['username']) ?></td>
        <td><?= h($u['name']) ?></td>
        <td><?= $u['role'] === 'ADMIN' ? '관리자' : '학생' ?></td>
        <td class="muted"><?= h(substr($u['created_at'], 0, 10)) ?></td>
        <td>
          <form method="post" class="row" style="gap:6px;">
            <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
            <input type="hidden" name="action" value="reset">
            <input type="hidden" name="id" value="<?= (int)$u['id'] ?>">
            <input type="text" name="password" placeholder="새 비밀번호" minlength="6">
            <button class="btn small secondary fix">변경</button>
          </form>
        </td>
        <td>
          <?php if ((int)$u['id'] !== (int)$me['id']): ?>
            <form method="post" onsubmit="return confirm('계정을 삭제합니다.');">
              <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
              <input type="hidden" name="action" value="delete">
              <input type="hidden" name="id" value="<?= (int)$u['id'] ?>">
              <button class="btn danger small">삭제</button>
            </form>
          <?php else: ?>
            <span class="muted" style="font-size:12px;">본인</span>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>
<?php render_footer(); ?>
