<?php
declare(strict_types=1);

function render_header(string $title = ''): void
{
    $user = current_user();
    $appName = APP_NAME;
    $fullTitle = $title !== '' ? "{$title} · {$appName}" : $appName;
    ?><!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= h($fullTitle) ?></title>
<link rel="stylesheet" href="<?= h(app_url('assets/style.css')) ?>">
</head>
<body>
<header class="nav">
  <div class="nav-inner">
    <a class="brand" href="<?= h(app_url('')) ?>">inclass</a>
    <nav>
      <?php if ($user): ?>
        <a href="<?= h(app_url('workbooks.php')) ?>">문제집</a>
        <?php if ($user['role'] === 'ADMIN'): ?>
          <a href="<?= h(app_url('admin/')) ?>">관리자</a>
        <?php endif; ?>
        <span class="user">
          <?= h($user['name']) ?> (<?= h($user['username']) ?>)
        </span>
        <form method="post" action="<?= h(app_url('logout.php')) ?>" class="inline">
          <input type="hidden" name="csrf" value="<?= h(csrf_token()) ?>">
          <button class="btn">로그아웃</button>
        </form>
      <?php else: ?>
        <a class="btn" href="<?= h(app_url('login.php')) ?>">로그인</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
<main class="container">
<?php
}

function render_footer(): void
{
    ?>
</main>
</body>
</html>
<?php
}

