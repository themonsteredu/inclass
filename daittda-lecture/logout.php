<?php
require_once __DIR__ . '/lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
}
logout();
header('Location: ' . app_url('login.php'));
exit;
