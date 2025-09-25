<?php
// backend/index.php
require_once __DIR__ . '/db.php';

enable_cors();
$pdo = db();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH);

function route_params($pattern, $path) {
    $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $pattern) . '$#';
    if (preg_match($regex, $path, $m)) {
        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
    return null;
}

function query($name, $default = null) {
    return $_GET[$name] ?? $default;
}

try {
    // Reports timeseries (monthly)
    if ($path === '/reports/timeseries' && $method === 'GET') {
        $months = (int)query('months', 12);
        if ($months < 1 || $months > 60) $months = 12;

        // Optional date filters still apply
        $where = [];
        $params = [];
        if ($df = query('date_from')) { $where[] = 't.date >= :df'; $params[':df'] = $df; }
        if ($dt = query('date_to')) { $where[] = 't.date <= :dt'; $params[':dt'] = $dt; }

        $whereSql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';
        // Group by YYYY-MM
        $sql = 'SELECT DATE_FORMAT(t.date, "%Y-%m") as ym,
                       COALESCE(SUM(CASE WHEN t.type = "income" THEN t.amount ELSE 0 END),0) as income,
                       COALESCE(SUM(CASE WHEN t.type = "expense" THEN t.amount ELSE 0 END),0) as expense
                FROM transactions t' . $whereSql . '
                GROUP BY ym
                ORDER BY ym DESC
                LIMIT ' . (int)$months;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Ensure chronological ascending order
        $rows = array_reverse($rows);
        foreach ($rows as &$r) { $r['balance'] = (float)$r['income'] - (float)$r['expense']; }
        send_json($rows);
    }

    // Reports timeseries by category (monthly), optional type=income|expense and top N categories
    if ($path === '/reports/timeseries-by-category' && $method === 'GET') {
        $months = (int)query('months', 12);
        if ($months < 1 || $months > 60) $months = 12;
        $type = query('type'); // income|expense|null
        $top = (int)query('top', 5);
        if ($top < 1 || $top > 20) $top = 5;

        $where = [];
        $params = [];
        if ($df = query('date_from')) { $where[] = 't.date >= :df'; $params[':df'] = $df; }
        if ($dt = query('date_to')) { $where[] = 't.date <= :dt'; $params[':dt'] = $dt; }
        if ($type && in_array($type, ['income','expense'])) { $where[] = 't.type = :ttype'; $params[':ttype'] = $type; }
        $whereSql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

        // Determine top categories in the window by total absolute amount
        $sqlTop = 'SELECT c.id, c.name, COALESCE(SUM(t.amount),0) as total
                   FROM transactions t LEFT JOIN categories c ON c.id = t.category_id' . $whereSql . '
                   GROUP BY c.id, c.name
                   ORDER BY total DESC
                   LIMIT ' . (int)$top;
        $stmt = $pdo->prepare($sqlTop);
        $stmt->execute($params);
        $tops = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $catIds = array_map(fn($r) => (int)$r['id'], $tops);
        if (!$catIds) { send_json([]); }

        // Build IN clause safely
        $in = implode(',', array_fill(0, count($catIds), '?'));
        $params2 = array_values($catIds);
        // Apply date/type filters again
        $cond = [];
        if ($df) { $cond[] = 't.date >= ?'; $params2[] = $df; }
        if ($dt) { $cond[] = 't.date <= ?'; $params2[] = $dt; }
        if ($type && in_array($type, ['income','expense'])) { $cond[] = 't.type = ?'; $params2[] = $type; }
        $where2 = 'WHERE t.category_id IN (' . $in . ')';
        if ($cond) $where2 .= ' AND ' . implode(' AND ', $cond);

        $sql = 'SELECT DATE_FORMAT(t.date, "%Y-%m") as ym, c.id as category_id, COALESCE(c.name, "Sem categoria") as category_name,
                       COALESCE(SUM(t.amount),0) as total
                FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
                ' . $where2 . '
                GROUP BY ym, c.id, c.name
                ORDER BY ym DESC
                LIMIT ' . (int)$months * max(1, count($catIds));
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params2);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Return chronological order
        $rows = array_reverse($rows);
        send_json($rows);
    }
    if ($path === '/' || $path === '') {
        send_json(['status' => 'ok', 'message' => 'Finance Manager API']);
    }

    // Categories
    if ($path === '/categories' && $method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM categories ORDER BY name');
        send_json($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($path === '/categories' && $method === 'POST') {
        $in = json_input();
        if (!isset($in['name']) || trim($in['name']) === '') send_json(['error' => 'Nome é obrigatório'], 400);
        $stmt = $pdo->prepare('INSERT INTO categories (name, color) VALUES (:name, :color)');
        $stmt->execute([':name' => $in['name'], ':color' => $in['color'] ?? null]);
        $id = (int)$pdo->lastInsertId();
        $row = $pdo->query('SELECT * FROM categories WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
        send_json($row, 201);
    }

    if (($p = route_params('/categories/{id}', $path)) && $method === 'PUT') {
        $id = (int)$p['id'];
        $in = json_input();
        $stmt = $pdo->prepare('UPDATE categories SET name = :name, color = :color WHERE id = :id');
        $stmt->execute([':name' => $in['name'] ?? null, ':color' => $in['color'] ?? null, ':id' => $id]);
        $row = $pdo->query('SELECT * FROM categories WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
        send_json($row ?? ['error' => 'Não encontrado'], $row ? 200 : 404);
    }

    if (($p = route_params('/categories/{id}', $path)) && $method === 'DELETE') {
        $id = (int)$p['id'];
        $stmt = $pdo->prepare('DELETE FROM categories WHERE id = :id');
        $stmt->execute([':id' => $id]);
        send_json(['deleted' => $stmt->rowCount() > 0]);
    }

    // Transactions list with filters
    if ($path === '/transactions' && $method === 'GET') {
        $where = [];
        $params = [];
        if ($df = query('date_from')) { $where[] = 't.date >= :df'; $params[':df'] = $df; }
        if ($dt = query('date_to')) { $where[] = 't.date <= :dt'; $params[':dt'] = $dt; }
        if ($cid = query('category_id')) { $where[] = 't.category_id = :cid'; $params[':cid'] = (int)$cid; }
        if ($type = query('type')) { $where[] = 't.type = :type'; $params[':type'] = $type; }
        if (($paid = query('paid')) !== null && $paid !== '') {
            $where[] = 't.paid = :paid';
            $params[':paid'] = (int)$paid ? 1 : 0;
        }
        if (($q = query('q'))) { $where[] = 'LOWER(t.description) LIKE :q'; $params[':q'] = '%' . mb_strtolower($q, 'UTF-8') . '%'; }

        $sqlBase = 'FROM transactions t LEFT JOIN categories c ON c.id = t.category_id';
        if ($where) { $sqlBase .= ' WHERE ' . implode(' AND ', $where); }

        // Sorting
        $allowedSort = ['date' => 't.date', 'amount' => 't.amount', 'id' => 't.id'];
        $sortBy = query('sort_by', 'date');
        $sortCol = $allowedSort[$sortBy] ?? 't.date';
        $sortDir = strtolower((string)query('sort_dir', 'desc')) === 'asc' ? 'ASC' : 'DESC';

        // Pagination
        $page = (int)query('page', 0); // if 0 -> no pagination (keep legacy response)
        $pageSize = max(1, min((int)query('page_size', 10), 100));
        $limitOffset = '';
        if ($page > 0) {
            $offset = ($page - 1) * $pageSize;
            $limitOffset = ' LIMIT ' . (int)$pageSize . ' OFFSET ' . (int)$offset;
        }

        $sqlSelect = 'SELECT t.*, c.name as category_name, c.color as category_color ' . $sqlBase . ' ORDER BY ' . $sortCol . ' ' . $sortDir . ', t.id ' . $sortDir . $limitOffset;
        $stmt = $pdo->prepare($sqlSelect);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($page > 0) {
            $stmt = $pdo->prepare('SELECT COUNT(1) ' . $sqlBase);
            $stmt->execute($params);
            $total = (int)$stmt->fetchColumn();
            $totalPages = (int)ceil($total / $pageSize);
            send_json([
                'data' => $rows,
                'pagination' => [
                    'page' => $page,
                    'page_size' => $pageSize,
                    'total' => $total,
                    'total_pages' => $totalPages,
                    'sort_by' => $sortBy,
                    'sort_dir' => strtolower($sortDir),
                ],
            ]);
        } else {
            // Legacy behavior: return plain array when no pagination requested
            send_json($rows);
        }
    }

    if ($path === '/transactions' && $method === 'POST') {
        $in = json_input();
        foreach (['type','amount','date'] as $field) {
            if (!isset($in[$field])) send_json(['error' => "Campo '$field' é obrigatório"], 400);
        }
        if (!in_array($in['type'], ['income','expense'])) send_json(['error' => 'type inválido'], 400);
        $stmt = $pdo->prepare('INSERT INTO transactions(type, paid, amount, description, date, category_id)
            VALUES (:type, :paid, :amount, :description, :date, :category_id)');
        $stmt->execute([
            ':type' => $in['type'],
            ':paid' => isset($in['paid']) ? ((int)$in['paid'] ? 1 : 0) : 0,
            ':amount' => (float)$in['amount'],
            ':description' => $in['description'] ?? null,
            ':date' => $in['date'],
            ':category_id' => isset($in['category_id']) ? (int)$in['category_id'] : null,
        ]);
        $id = (int)$pdo->lastInsertId();
        $row = $pdo->query('SELECT * FROM transactions WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
        send_json($row, 201);
    }

    if (($p = route_params('/transactions/{id}', $path)) && $method === 'PUT') {
        $id = (int)$p['id'];
        $in = json_input();
        if (isset($in['type']) && !in_array($in['type'], ['income','expense'])) send_json(['error' => 'type inválido'], 400);
        $stmt = $pdo->prepare('UPDATE transactions SET type = COALESCE(:type, type), paid = COALESCE(:paid, paid), amount = COALESCE(:amount, amount), description = COALESCE(:description, description), date = COALESCE(:date, date), category_id = :category_id WHERE id = :id');
        $stmt->execute([
            ':type' => $in['type'] ?? null,
            ':paid' => array_key_exists('paid', $in) ? ((int)$in['paid'] ? 1 : 0) : null,
            ':amount' => isset($in['amount']) ? (float)$in['amount'] : null,
            ':description' => $in['description'] ?? null,
            ':date' => $in['date'] ?? null,
            ':category_id' => array_key_exists('category_id', $in) ? (int)$in['category_id'] : null,
            ':id' => $id,
        ]);
        $row = $pdo->query('SELECT * FROM transactions WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
        send_json($row ?? ['error' => 'Não encontrado'], $row ? 200 : 404);
    }

    // PATCH toggle/set paid
    if (($p = route_params('/transactions/{id}/paid', $path)) && $method === 'PATCH') {
        $id = (int)$p['id'];
        $in = json_input();
        if (!array_key_exists('paid', $in)) send_json(['error' => 'Campo paid é obrigatório'], 400);
        $paid = (int)$in['paid'] ? 1 : 0;
        $stmt = $pdo->prepare('UPDATE transactions SET paid = :paid WHERE id = :id');
        $stmt->execute([':paid' => $paid, ':id' => $id]);
        $row = $pdo->query('SELECT * FROM transactions WHERE id=' . $id)->fetch(PDO::FETCH_ASSOC);
        send_json($row ?? ['updated' => $stmt->rowCount() > 0]);
    }

    if (($p = route_params('/transactions/{id}', $path)) && $method === 'DELETE') {
        $id = (int)$p['id'];
        $stmt = $pdo->prepare('DELETE FROM transactions WHERE id = :id');
        $stmt->execute([':id' => $id]);
        send_json(['deleted' => $stmt->rowCount() > 0]);
    }

    // Reports summary
    if ($path === '/reports/summary' && $method === 'GET') {
        $where = [];
        $params = [];
        if ($df = query('date_from')) { $where[] = 'date >= :df'; $params[':df'] = $df; }
        if ($dt = query('date_to')) { $where[] = 'date <= :dt'; $params[':dt'] = $dt; }
        $whereSql = $where ? (' WHERE ' . implode(' AND ', $where)) : '';

        // Totais
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount),0) as total FROM transactions ' . $whereSql . ($where? ' AND ':' WHERE ') . "type='income'");
        $stmt->execute($params);
        $income = (float)$stmt->fetchColumn();

        $stmt = $pdo->prepare('SELECT COALESCE(SUM(amount),0) as total FROM transactions ' . $whereSql . ($where? ' AND ':' WHERE ') . "type='expense'");
        $stmt->execute($params);
        $expense = (float)$stmt->fetchColumn();

        // By category
        $sqlCat = 'SELECT c.id, c.name, c.color, 
                  COALESCE(SUM(CASE WHEN t.type = "income" THEN t.amount ELSE 0 END),0) as income,
                  COALESCE(SUM(CASE WHEN t.type = "expense" THEN t.amount ELSE 0 END),0) as expense
                   FROM categories c
                   LEFT JOIN transactions t ON t.category_id = c.id';
        if ($where) {
            $tConds = [];
            foreach ($where as $w) {
                // prefix column with t.
                $tConds[] = 't.' . $w;
            }
            $sqlCat .= ' WHERE ' . implode(' AND ', $tConds);
        }
        $sqlCat .= ' GROUP BY c.id, c.name, c.color ORDER BY c.name';
        $stmt = $pdo->prepare($sqlCat);
        $stmt->execute($params);
        $byCategory = $stmt->fetchAll(PDO::FETCH_ASSOC);

        send_json([
            'income' => $income,
            'expense' => $expense,
            'balance' => $income - $expense,
            'by_category' => $byCategory,
        ]);
    }

    send_json(['error' => 'Endpoint não encontrado: ' . $path], 404);
} catch (Throwable $e) {
    send_json(['error' => $e->getMessage()], 500);
}
