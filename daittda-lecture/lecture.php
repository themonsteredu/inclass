<?php
require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/layout.php';

$user = require_login();
$id = (int)($_GET['id'] ?? 0);

$stmt = db()->prepare(<<<'SQL'
    SELECT l.*, p.number AS problem_number, p.title AS problem_title, p.id AS problem_id,
           w.id AS workbook_id, w.title AS workbook_title
    FROM lectures l
    JOIN problems p ON p.id = l.problem_id
    JOIN workbooks w ON w.id = p.workbook_id
    WHERE l.id = ?
SQL);
$stmt->execute([$id]);
$lec = $stmt->fetch();
if (!$lec) { http_response_code(404); echo '강의를 찾을 수 없습니다.'; exit; }
if (!can_access_workbook($user, (int)$lec['workbook_id'])) {
    redirect('workbooks.php');
}

$stmt = db()->prepare('SELECT * FROM watch_logs WHERE user_id = ? AND lecture_id = ?');
$stmt->execute([$user['id'], $lec['id']]);
$log = $stmt->fetch();

$streamUrl = app_url('stream.php?id=' . (int)$lec['id']);
$progressUrl = app_url('progress.php');

render_header($lec['title']);
?>
<div class="breadcrumb">
  <a href="<?= h(app_url('workbook.php?id=' . (int)$lec['workbook_id'])) ?>"><?= h($lec['workbook_title']) ?></a>
  &nbsp;/&nbsp;
  <a href="<?= h(app_url('problem.php?id=' . (int)$lec['problem_id'])) ?>">#<?= (int)$lec['problem_number'] ?> <?= h($lec['problem_title']) ?></a>
</div>
<h1 style="margin-bottom:4px;"><?= h($lec['title']) ?></h1>
<div class="muted" style="margin-bottom:12px;">
  <?= h(lecture_type_label($lec['type'])) ?> · 길이 <?= h(format_seconds((int)$lec['duration'])) ?> ·
  누적 시청 <?= h(format_seconds((int)($log['watched_seconds'] ?? 0))) ?>
  <?php if (!empty($log['completed'])): ?><span class="pill ok">완료</span><?php endif; ?>
</div>

<video id="player"
       src="<?= h($streamUrl) ?>"
       controls playsinline controlsList="nodownload"
       data-lecture-id="<?= (int)$lec['id'] ?>"
       data-initial-position="<?= (int)($log['last_position'] ?? 0) ?>"></video>

<script>
(function() {
  var video = document.getElementById('player');
  var lectureId = video.dataset.lectureId;
  var progressUrl = <?= json_encode($progressUrl) ?>;
  var initialPosition = parseInt(video.dataset.initialPosition || '0', 10);
  var csrf = <?= json_encode(csrf_token()) ?>;

  var accumulator = 0;
  var lastTick = null;
  var lastSentPosition = 0;

  if (initialPosition > 0) {
    video.addEventListener('loadedmetadata', function onMeta() {
      try { video.currentTime = initialPosition; } catch (e) {}
      video.removeEventListener('loadedmetadata', onMeta);
    });
  }

  function flush(isFinal) {
    var delta = Math.floor(accumulator);
    var position = Math.floor(video.currentTime || 0);
    var completed = isFinal && video.duration > 0 && position >= Math.floor(video.duration) - 1;
    if (delta <= 0 && position === lastSentPosition && !completed) return;
    accumulator -= delta;
    lastSentPosition = position;
    var payload = JSON.stringify({
      lectureId: parseInt(lectureId, 10),
      deltaSeconds: delta,
      position: position,
      duration: Math.floor(video.duration || 0),
      completed: completed || undefined,
      csrf: csrf
    });
    if (isFinal && navigator.sendBeacon) {
      navigator.sendBeacon(progressUrl, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(progressUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        body: payload,
        keepalive: true,
        credentials: 'same-origin'
      }).catch(function() {});
    }
  }

  video.addEventListener('timeupdate', function() {
    if (video.paused || video.seeking) { lastTick = null; return; }
    var now = performance.now();
    if (lastTick != null) {
      var diff = (now - lastTick) / 1000;
      if (diff > 0 && diff < 2) accumulator += diff;
    }
    lastTick = now;
  });
  video.addEventListener('pause', function() { lastTick = null; flush(false); });
  video.addEventListener('ended', function() { lastTick = null; flush(true); });
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') { lastTick = null; flush(false); }
  });
  setInterval(function() { flush(false); }, 10000);
  window.addEventListener('pagehide', function() { flush(true); });
})();
</script>
<?php render_footer(); ?>
