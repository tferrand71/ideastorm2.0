<?php
// On active le tampon de sortie pour capturer tout texte parasite et éviter de casser le JSON
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Gestion des requêtes pre-flight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// --- CONFIGURATION HYBRIDE (LOCAL & CLOUD) ---
$db_configs = [
    'local' => [
        'host' => 'db',
        'user' => 'root',
        'pass' => 'azerty',
        'name' => 'ideastorm',
        'port' => 3306
    ],
    'aiven' => [
        'host' => 'mysql-1f9595fd-ideastorm.k.aivencloud.com',
        'user' => 'avnadmin',
        'pass' => 'AVNS_u61JknRgEoe0FX1ESOE',
        'name' => 'defaultdb',
        'port' => 16110
    ]
];

$conn = null;
$active_mode = "none";

// 1. Tentative de connexion Locale
$conn = @new mysqli($db_configs['local']['host'], $db_configs['local']['user'], $db_configs['local']['pass'], $db_configs['local']['name'], $db_configs['local']['port']);

if ($conn->connect_error) {
    // 2. Repli silencieux sur Aiven (Cloud) si le local échoue
    $conn = @new mysqli($db_configs['aiven']['host'], $db_configs['aiven']['user'], $db_configs['aiven']['pass'], $db_configs['aiven']['name'], $db_configs['aiven']['port']);

    if ($conn->connect_error) {
        ob_clean();
        die(json_encode(["error" => "Serveurs injoignables. Le jeu fonctionne en mode hors ligne temporaire."]));
    }
    $active_mode = "cloud";
} else {
    $active_mode = "local";
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- FONCTION POUR LANCER LA SYNCHRO ---
function runBridgeSync() {
    if (file_exists('bridge.php')) {
        include_once 'bridge.php'; // include_once pour éviter de redéclarer les fonctions
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

        runBridgeSync(); // Synchro
        ob_clean();
        echo json_encode(["success" => true, "userId" => $newId, "username" => $user, "mode" => $active_mode]);
    } else {
        ob_clean();
        echo json_encode(["error" => "Pseudo déjà pris ou erreur serveur."]);
    }
}

// --- 2. CONNEXION ---
else if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $conn->real_escape_string($data['username']);
    $pass = $data['password'];

    $sql = "SELECT id, password_hash FROM users WHERE username='$user'";
    $res = $conn->query($sql);

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        if (password_verify($pass, $row['password_hash'])) {
            ob_clean();
            echo json_encode(["success" => true, "userId" => $row['id'], "username" => $user, "mode" => $active_mode]);
        } else {
            ob_clean();
            echo json_encode(["error" => "Mot de passe incorrect"]);
        }
    } else {
        ob_clean();
        echo json_encode(["error" => "Utilisateur non trouvé"]);
    }
}

// --- 3. SAUVEGARDER LE JEU ---
else if ($method === 'POST' && $action === 'save') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)$data['user_id'];
    $score = (float)$data['score'];
    $saveData = $conn->real_escape_string(json_encode($data['save_data']));
    $rebirthCount = isset($data['save_data']['rebirthCount']) ? (int)$data['save_data']['rebirthCount'] : 0;

    $sql = "UPDATE game_state SET score = '$score', rebirth_count = '$rebirthCount', save_data = '$saveData' WHERE user_id = $userId";

    if ($conn->query($sql)) {
        runBridgeSync(); // Synchro
        ob_clean();
        echo json_encode(["success" => true, "mode" => $active_mode]);
    } else {
        ob_clean();
        echo json_encode(["error" => $conn->error]);
    }
}

// --- 4. CHARGER LE JEU ---
else if ($method === 'GET' && $action === 'load') {
    $userId = (int)$_GET['userId'];
    $sql = "SELECT save_data FROM game_state WHERE user_id=$userId";
    $res = $conn->query($sql);

    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        ob_clean();
        echo $row['save_data'];
    } else {
        ob_clean();
        echo json_encode([]);
    }
}

// --- 5. CLASSEMENT (GET SCORE) ---
else if ($method === 'GET' && $action === 'get_score') {
    $sql = "SELECT u.username, gs.score, gs.rebirth_count 
            FROM users u 
            JOIN game_state gs ON u.id = gs.user_id 
            ORDER BY gs.rebirth_count DESC, gs.score DESC";

    $res = $conn->query($sql);
    $scores = [];
    while($row = $res->fetch_assoc()) {
        $scores[] = $row;
    }
    ob_clean();
    echo json_encode($scores);
}

// --- 6. ADMIN : LISTE DES JOUEURS ---
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

// --- 7. ADMIN : MODIFIER STATS ---
else if ($method === 'POST' && $action === 'admin_update_stats') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)$data['id'];
    $newScore = (float)$data['score'];
    $newRebirth = (int)$data['rebirth_count'];

    // On récupère la sauvegarde actuelle pour ne pas écraser l'inventaire
    $res = $conn->query("SELECT save_data FROM game_state WHERE user_id = $userId");
    $currentSave = [];
    if ($res->num_rows > 0) {
        $row = $res->fetch_assoc();
        $currentSave = json_decode($row['save_data'], true);
    }

    $currentSave['score'] = $newScore;
    $currentSave['rebirthCount'] = $newRebirth;

    $updatedSaveData = $conn->real_escape_string(json_encode($currentSave));

    $sql = "UPDATE game_state SET 
            score = '$newScore', 
            rebirth_count = $newRebirth, 
            save_data = '$updatedSaveData' 
            WHERE user_id = $userId";

    if ($conn->query($sql)) {
        runBridgeSync();
        ob_clean();
        echo json_encode(["success" => true]);
    } else {
        ob_clean();
        echo json_encode(["error" => $conn->error]);
    }
}

// Si l'action n'est pas reconnue
else {
    ob_clean();
    echo json_encode(["error" => "Action invalide"]);
}
?>