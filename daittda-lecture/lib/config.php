<?php
// 전역 설정. 필요하면 이 파일만 수정하세요.

declare(strict_types=1);

const APP_NAME = 'inclass 강의 시스템';

// 데이터베이스 파일 경로 (웹 접근 불가 영역에 저장)
const DB_PATH = __DIR__ . '/../data/inclass.db';

// 영상 저장 폴더 (웹 직접 접근 차단됨, stream.php 통해서만 서빙)
const VIDEO_DIR = __DIR__ . '/../videos';

// 업로드 허용 MIME / 확장자
const ALLOWED_VIDEO_MIME = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'video/x-m4v',
];
const ALLOWED_VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'mkv'];

// 업로드 최대 용량 (바이트) — php.ini 의 upload_max_filesize / post_max_size 도 같이 조정 필요
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

// 세션 쿠키 이름
const SESSION_COOKIE_NAME = 'inclass_session';

// 강의 유형 (표시 라벨)
const LECTURE_TYPES = [
    'TIP'     => '팁강의',
    'CONCEPT' => '개념강의',
    'PATTERN' => '유형강의',
];
