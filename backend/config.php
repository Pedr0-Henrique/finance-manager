<?php

function env(string $key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

const DB_CHARSET = 'utf8mb4';

function db_config(): array {
    return [
        'host' => env('DB_HOST', '127.0.0.1'),
        'port' => (int)env('DB_PORT', 3306),
        'user' => env('DB_USER', 'root'),
        'pass' => env('DB_PASS', ''),
        'name' => env('DB_NAME', 'finance_manager'),
    ];
}
