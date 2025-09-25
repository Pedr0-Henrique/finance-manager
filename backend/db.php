<?php
// backend/db.php (MySQL)
require_once __DIR__ . '/config.php';

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $cfg = db_config();

    // Step 1: connect to server without database to ensure DB exists
    $dsnServer = sprintf('mysql:host=%s;port=%d;charset=%s', $cfg['host'], $cfg['port'], DB_CHARSET);
    $pdoServer = new PDO($dsnServer, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdoServer->exec(sprintf('CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_unicode_ci', $cfg['name'], DB_CHARSET, DB_CHARSET));

    // Step 2: connect to target database
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'], $cfg['name'], DB_CHARSET);
    $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    bootstrap_schema($pdo);
    return $pdo;
}

function bootstrap_schema(PDO $pdo): void {
    // Create tables if not exists (MySQL)
    $pdo->exec('CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(191) NOT NULL UNIQUE,
        color VARCHAR(32) NULL
    ) ENGINE=InnoDB');

    $pdo->exec('CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM("income","expense") NOT NULL,
        paid TINYINT(1) NOT NULL DEFAULT 0,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT NULL,
        date DATE NOT NULL,
        category_id INT NULL,
        CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    ) ENGINE=InnoDB');

    // Seed default categories if table empty
    $count = (int)$pdo->query('SELECT COUNT(1) AS c FROM categories')->fetchColumn();
    if ($count === 0) {
        $stmt = $pdo->prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
        $defaults = [
            ['Salário', '#2e7d32'],
            ['Investimentos', '#1565c0'],
            ['Alimentação', '#ef6c00'],
            ['Transporte', '#6d4c41'],
            ['Moradia', '#8e24aa'],
            ['Lazer', '#c62828'],
        ];
        foreach ($defaults as $row) {
            $stmt->execute($row);
        }
    }

    // Try to add 'paid' column if upgrading from older schema
    try {
        $pdo->exec('ALTER TABLE transactions ADD COLUMN paid TINYINT(1) NOT NULL DEFAULT 0 AFTER type');
    } catch (Throwable $e) {
        // ignore if already exists
    }
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function enable_cors(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}
