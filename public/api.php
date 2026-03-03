<?php
// On active le tampon de sortie pour capturer tout texte parasite
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// --- CONNEXION LOCALE ---
$conn = @new mysqli("db", "root", "azerty", "ideastorm");
if ($conn->connect_error) {
    ob_clean();
    die(json_encode(["error" => "Base de données locale inaccessible"]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- FONCTION POUR LANCER LA SYNCHRO ---
function runBridgeSync() {
    if (file_exists('bridge.php')) {
        include 'bridge.php';
    }
}

// --- 1. INSCRIPTION ---
if ($method === 'POST' && $action === 'signup') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $conn->real_escape_string($data['username']);
    $pass = password_hash($data['password'], PASSWORD_BCRYPT);

    $sql = "INSERT INTO users (username, password_hash) VALUES ('$user', '$pass')";
    if ($conn->query($sql)) {
        $newId = $conn->insert_id;
        $conn->query("INSERT INTO game_state (user_id, save_data, score, rebirth_count) VALUES ($newId, '{}', 0, 0)");
        runBridgeSync();
        ob_clean();
        echo json_encode(["id" => $newId, "username" => $user]);
    } else {
        ob_clean();
        echo json_encode(["error" => "Pseudo déjà pris"]);
    }
}

// --- 2. CONNEXION ---
else if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $conn->real_escape_string($data['username']);
    $res = $conn->query("SELECT * FROM users WHERE username = '$user'");
    $userData = $res->fetch_assoc();

    if ($userData && password_verify($data['password'], $userData['password_hash'])) {
        runBridgeSync();
        ob_clean();
        echo json_encode(["id" => $userData['id'], "username" => $userData['username']]);
    } else {
        ob_clean();
        http_response_code(401);
        echo json_encode(["error" => "Identifiants incorrects"]);
    }
}

// --- 3. CHARGER ---
else if ($method === 'GET' && $action === 'load') {
    $userId = intval($_GET['userId']);
    $res = $conn->query("SELECT save_data FROM game_state WHERE user_id = $userId");
    $row = $res->fetch_assoc();
    ob_clean();
    echo $row['save_data'] ?? json_encode([]);
}

// --- 4. SAUVEGARDER ---
else if ($method === 'POST' && $action === 'save') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = intval($data['user_id'] ?? 0);
    $score = $data['score'] ?? 0;
    $rebirthCount = intval($data['rebirth_count'] ?? 0);

    $saveData = $conn->real_escape_string(json_encode($data['save_data'] ?? []));
    $sql = "UPDATE game_state SET save_data = '$saveData', score = '$score', rebirth_count = $rebirthCount WHERE user_id = $userId";

    ob_clean();
    if ($conn->query($sql)) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => $conn->error]);
    }
}

// --- 5. LEADERBOARD ---
else if ($method === 'GET' && $action === 'leaderboard') {
    $sql = "SELECT u.username, gs.score, gs.rebirth_count FROM game_state gs JOIN users u ON gs.user_id = u.id ORDER BY gs.rebirth_count DESC, gs.score DESC LIMIT 50";
    $result = $conn->query($sql);
    $rows = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $rows[] = ["username" => $row['username'], "score" => floatval($row['score']), "rebirth_count" => intval($row['rebirth_count'])];
        }
    }
    ob_clean();
    echo json_encode($rows);
}

// --- ACTION : ADMIN UPDATE STATS (VERSION FINALE SYNCHRONISÉE) ---
else if ($method === 'POST' && $action === 'admin_update_stats') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = intval($data['id'] ?? 0);
    $newScore = $data['score'] ?? 0;
    $newRebirth = intval($data['rebirth_count'] ?? 0);

    // 1. On récupère le save_data actuel pour ne pas perdre les upgrades achetées
    $res = $conn->query("SELECT save_data FROM game_state WHERE user_id = $userId");
    $row = $res->fetch_assoc();
    $currentSave = json_decode($row['save_data'], true) ?: [];

    // 2. On met à jour les stats vitales à l'intérieur du JSON
    // Note: On utilise les clés exactes de ton useStore (score, rebirthCount)
    $currentSave['score'] = (float)$newScore;
    $currentSave['rebirthCount'] = $newRebirth;

    // On recalcule souvent le perClick/perSecond en fonction du rebirth dans ton ResetState,
    // mais ici on injecte directement les valeurs pour plus de sûreté
    $updatedSaveData = $conn->real_escape_string(json_encode($currentSave));

    $sql = "UPDATE game_state SET 
            score = '$newScore', 
            rebirth_count = $newRebirth, 
            save_data = '$updatedSaveData' 
            WHERE user_id = $userId";

    if ($conn->query($sql)) {
        ob_clean();
        echo json_encode(["success" => true]);
    } else {
        ob_clean();
        echo json_encode(["error" => $conn->error]);
    }
}

// --- 7. ADMIN : LISTE DES JOUEURS ---
else if ($method === 'GET' && $action === 'admin_list') {
    $sql = "SELECT u.id, u.username, gs.score, gs.rebirth_count 
            FROM users u 
            JOIN game_state gs ON u.id = gs.user_id 
            ORDER BY gs.rebirth_count DESC, gs.score DESC";

    $result = $conn->query($sql);
    $players = [];
    while($row = $result->fetch_assoc()) {
        $players[] = $row;
    }
    ob_clean();
    echo json_encode($players);
}

// --- 8. ADMIN : SUPPRIMER JOUEUR ---
else if ($method === 'POST' && $action === 'admin_delete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $idToDelete = intval($data['id'] ?? 0);

    if ($idToDelete > 0) {
        $conn->query("DELETE FROM game_state WHERE user_id = $idToDelete");
        $conn->query("DELETE FROM users WHERE id = $idToDelete");
        ob_clean();
        echo json_encode(["success" => true]);
    }
}

ob_end_flush();