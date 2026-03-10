<?php
// --- 1. GESTION DU CORS (DOIT ÊTRE LA TOUTE PREMIÈRE CHOSE) ---
// Cela autorise ton application React (localhost:5173) à communiquer avec PHP
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Si le navigateur envoie une requête de "pré-vérification" (OPTIONS), on lui dit OK et on arrête le script
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// --- 2. CONFIGURATION DU TAMPON ET DU JSON ---
ob_start(); // Empêche l'affichage de caractères parasites (espaces vides, warnings) avant le JSON
header("Content-Type: application/json; charset=UTF-8");

// --- 3. CONNEXION DOCKER (LOCAL UNIQUEMENT) ---
$db_host = "knhpdkvadmin.mysql.db"; // Nom du conteneur MySQL
$db_user = "knhpdkvadmin";
$db_pass = "qaffMU75eePZ9ET";
$db_name = "knhpdkvadmin";
$db_port = 3306;

mysqli_report(MYSQLI_REPORT_OFF); // Désactive les exceptions fatales de PHP 8+
$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

if ($conn->connect_error) {
    ob_clean();
    die(json_encode([
        "error" => "Impossible de se connecter au conteneur MySQL 'db'.",
        "details" => $conn->connect_error
    ]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// --- 4. ROUTES DE L'API ---

// Inscription
if ($method === 'POST' && $action === 'signup') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $conn->real_escape_string($data['username']);
    $pass = password_hash($data['password'], PASSWORD_BCRYPT);

    $sql = "INSERT INTO users (username, password_hash) VALUES ('$user', '$pass')";
    if ($conn->query($sql)) {
        $newId = $conn->insert_id;
        $conn->query("INSERT INTO game_state (user_id, save_data, score, rebirth_count) VALUES ($newId, '{}', 0, 0)");

        ob_clean();
        echo json_encode(["success" => true, "userId" => $newId, "username" => $user]);
    } else {
        ob_clean();
        echo json_encode(["error" => "Ce pseudo est déjà pris ou erreur serveur."]);
    }
}

// Connexion
else if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $user = $conn->real_escape_string($data['username']);
    $pass = $data['password'];

    $sql = "SELECT id, password_hash FROM users WHERE username='$user'";
    $res = $conn->query($sql);

    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        if (password_verify($pass, $row['password_hash'])) {
            ob_clean();
            echo json_encode(["success" => true, "userId" => $row['id'], "username" => $user]);
        } else {
            ob_clean();
            echo json_encode(["error" => "Mot de passe incorrect"]);
        }
    } else {
        ob_clean();
        echo json_encode(["error" => "Utilisateur non trouvé"]);
    }
}

// Sauvegarder le jeu
else if ($method === 'POST' && $action === 'save') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['user_id'])) {
        ob_clean();
        die(json_encode(["error" => "ID Utilisateur manquant."]));
    }

    $userId = (int)$data['user_id'];
    $score = (float)($data['score'] ?? 0);
    $saveData = $conn->real_escape_string(json_encode($data['save_data']));
    $rebirthCount = isset($data['save_data']['rebirthCount']) ? (int)$data['save_data']['rebirthCount'] : 0;

    $sql = "UPDATE game_state SET score = '$score', rebirth_count = '$rebirthCount', save_data = '$saveData' WHERE user_id = $userId";

    if ($conn->query($sql)) {
        ob_clean();
        echo json_encode(["success" => true]);
    } else {
        ob_clean();
        echo json_encode(["error" => "Erreur DB: " . $conn->error]);
    }
}

// Charger le jeu
else if ($method === 'GET' && $action === 'load') {
    $userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;
    $sql = "SELECT save_data FROM game_state WHERE user_id = $userId";
    $res = $conn->query($sql);

    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        ob_clean();
        echo $row['save_data'];
    } else {
        ob_clean();
        echo json_encode([]);
    }
}

// Classement (Leaderboard)
else if ($method === 'GET' && $action === 'get_score') {
    $sql = "SELECT u.username, gs.score, gs.rebirth_count 
            FROM users u 
            JOIN game_state gs ON u.id = gs.user_id 
            ORDER BY gs.rebirth_count DESC, gs.score DESC";

    $res = $conn->query($sql);
    $scores = [];
    if ($res) {
        while($row = $res->fetch_assoc()) {
            $scores[] = $row;
        }
    }
    ob_clean();
    echo json_encode($scores);
}

// ADMIN : Liste des joueurs
else if ($method === 'GET' && $action === 'admin_list') {
    $sql = "SELECT u.id, u.username, gs.score, gs.rebirth_count 
            FROM users u 
            JOIN game_state gs ON u.id = gs.user_id 
            ORDER BY gs.rebirth_count DESC, gs.score DESC";

    $result = $conn->query($sql);
    $players = [];
    if ($result) {
        while($row = $result->fetch_assoc()) {
            $players[] = $row;
        }
    }
    ob_clean();
    echo json_encode($players);
}

// ADMIN : Modifier les statistiques d'un joueur
else if ($method === 'POST' && $action === 'admin_update_stats') {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = (int)$data['id'];
    $newScore = (float)$data['score'];
    $newRebirth = (int)$data['rebirth_count'];

    $res = $conn->query("SELECT save_data FROM game_state WHERE user_id = $userId");
    $currentSave = [];
    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        $currentSave = json_decode($row['save_data'], true) ?? [];
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
        ob_clean();
        echo json_encode(["success" => true]);
    } else {
        ob_clean();
        echo json_encode(["error" => $conn->error]);
    }
}

// Commande inconnue
else {
    ob_clean();
    echo json_encode(["error" => "Action invalide"]);
}
?>