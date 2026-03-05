<?php
// bridge.php - Synchronisation Local <-> Aiven

// --- DÉTECTION DU MODE (SILENCIEUX SI INCLUS DANS L'API) ---
$is_api_call = (basename(__FILE__) !== basename($_SERVER['SCRIPT_NAME']));

if (!function_exists('log_bridge')) {
    function log_bridge($message) {
        global $is_api_call;
        if ($is_api_call) {
            return; // Mode silencieux
        }
        if (!headers_sent()) {
            header("Content-Type: text/plain; charset=utf-8");
        }
        echo $message;
    }
}

// --- 1. CONFIGURATION ---
$local_host = "db";
$local_user = "root";
$local_pass = "azerty";
$local_db   = "ideastorm";
$local_port = 3306;

$aiven_host = "mysql-1f9595fd-ideastorm.k.aivencloud.com";
$aiven_port = 16110;
$aiven_user = "avnadmin";
$aiven_pass = "AVNS_u61JknRgEoe0FX1ESOE";
$aiven_db   = "defaultdb";

// --- 2. CONNEXIONS (SILENCIEUSES) ---
$connLocal = @new mysqli($local_host, $local_user, $local_pass, $local_db, $local_port);
$connAiven = @new mysqli($aiven_host, $aiven_user, $aiven_pass, $aiven_db, $aiven_port);

// --- 3. SECURITÉ : ARRET SI UN SERVICE EST HORS LIGNE ---
if ($connLocal->connect_error || $connAiven->connect_error) {
    log_bridge("❌ Impossible de synchroniser : Une des deux bases de données est hors ligne.\n");
    return; // On arrête le bridge ici, sans faire planter l'API principale.
}

log_bridge("✅ Les deux bases sont en ligne. Début de la synchronisation...\n");

// --- 4. RÉCUPÉRATION DES DONNÉES ---
$usersLocal = [];
$resLocal = $connLocal->query("SELECT u.username, u.password_hash, gs.score, gs.rebirth_count, gs.save_data, gs.last_updated FROM users u JOIN game_state gs ON u.id = gs.user_id");
if ($resLocal) {
    while($row = $resLocal->fetch_assoc()) {
        $usersLocal[$row['username']] = $row;
    }
}

$usersAiven = [];
$resAiven = $connAiven->query("SELECT u.username, u.password_hash, gs.score, gs.rebirth_count, gs.save_data, gs.last_updated FROM users u JOIN game_state gs ON u.id = gs.user_id");
if ($resAiven) {
    while($row = $resAiven->fetch_assoc()) {
        $usersAiven[$row['username']] = $row;
    }
}

// --- 5. LOGIQUE DE SYNCHRONISATION ---

// A. Local -> Aiven
foreach ($usersLocal as $username => $dataLocal) {
    if (!isset($usersAiven[$username])) {
        // N'existe pas sur Aiven, on crée
        copyUser($connAiven, $dataLocal);
    } else {
        // Existe des deux côtés, on compare le timestamp
        $dataAiven = $usersAiven[$username];
        if (strtotime($dataLocal['last_updated']) > strtotime($dataAiven['last_updated'])) {
            $userIdAiven = getUserId($connAiven, $username);
            updateGameState($connAiven, $userIdAiven, $dataLocal);
        }
    }
}

// B. Aiven -> Local
foreach ($usersAiven as $username => $dataAiven) {
    if (!isset($usersLocal[$username])) {
        // N'existe pas en Local, on crée
        copyUser($connLocal, $dataAiven);
    } else {
        // Existe des deux côtés, on compare le timestamp
        $dataLocal = $usersLocal[$username];
        if (strtotime($dataAiven['last_updated']) > strtotime($dataLocal['last_updated'])) {
            $userIdLocal = getUserId($connLocal, $username);
            updateGameState($connLocal, $userIdLocal, $dataAiven);
        }
    }
}

log_bridge("\n✨ Synchronisation terminée avec succès !\n");

// --- 6. FONCTIONS UTILITAIRES ---
if (!function_exists('copyUser')) {
    function copyUser($connDest, $data) {
        $connDest->query("SET SESSION sql_require_primary_key = 0"); // Nécessaire pour Aiven parfois

        $stmt = $connDest->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        $stmt->bind_param("ss", $data['username'], $data['password_hash']);
        $stmt->execute();
        $newId = $connDest->insert_id;

        $stmt2 = $connDest->prepare("INSERT INTO game_state (user_id, score, rebirth_count, save_data, last_updated) VALUES (?, ?, ?, ?, ?)");
        $stmt2->bind_param("idsss", $newId, $data['score'], $data['rebirth_count'], $data['save_data'], $data['last_updated']);
        $stmt2->execute();
    }
}

if (!function_exists('updateGameState')) {
    function updateGameState($connDest, $userId, $data) {
        $stmt = $connDest->prepare("UPDATE game_state SET score = ?, rebirth_count = ?, save_data = ?, last_updated = ? WHERE user_id = ?");
        $stmt->bind_param("dsssi", $data['score'], $data['rebirth_count'], $data['save_data'], $data['last_updated'], $userId);
        $stmt->execute();
    }
}

if (!function_exists('getUserId')) {
    function getUserId($conn, $username) {
        $username = $conn->real_escape_string($username);
        $res = $conn->query("SELECT id FROM users WHERE username = '$username'");
        if ($res && $res->num_rows > 0) {
            $row = $res->fetch_assoc();
            return $row['id'];
        }
        return 0;
    }
}
?>