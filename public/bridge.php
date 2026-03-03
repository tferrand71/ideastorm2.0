<?php
// bridge.php

// --- DÉTECTION DU MODE (SILENCIEUX SI INCLUS DANS L'API) ---
$is_api_call = (basename(__FILE__) !== basename($_SERVER['SCRIPT_NAME']));

function log_bridge($message) {
    global $is_api_call;
    // CONDITION CRUCIALE : On n'affiche rien du tout si c'est un appel API
    if ($is_api_call) {
        return;
    }

    // Si on appelle le fichier directement dans le navigateur, on affiche le debug
    if (!headers_sent()) {
        header("Content-Type: text/plain; charset=utf-8");
    }
    echo $message;
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

// --- 2. CONNEXIONS ---

log_bridge("🔌 Connexion Local... ");
$connLocal = @new mysqli($local_host, $local_user, $local_pass, $local_db, $local_port);

if ($connLocal->connect_error) {
    log_bridge("ÉCHEC.\n");
    if ($is_api_call) return; // On quitte en silence pour l'API
    die("Erreur Local: " . $connLocal->connect_error);
}
log_bridge("OK.\n");

log_bridge("☁️ Connexion Aiven (SSL)... ");
$connAiven = mysqli_init();
mysqli_options($connAiven, MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);

try {
    // Le @ masque les erreurs natives qui pollueraient le flux JSON
    $link = @mysqli_real_connect(
        $connAiven,
        $aiven_host,
        $aiven_user,
        $aiven_pass,
        $aiven_db,
        $aiven_port,
        NULL,
        MYSQLI_CLIENT_SSL
    );

    if (!$link) {
        throw new Exception(mysqli_connect_error());
    }
    log_bridge("OK.\n\n");

} catch (Throwable $e) {
    log_bridge("ÉCHEC (Aiven injoignable ou erreur DNS).\n");
    // Sortie silencieuse pour l'API : permet à api.php de continuer sur la DB locale
    if ($is_api_call) return;

    echo "Détail : " . $e->getMessage() . "\n";
    return;
}

// --- 3. LOGIQUE DE SYNCHRONISATION ---

log_bridge("🔄 Démarrage de la synchronisation...\n");

$resLocal = $connLocal->query("
    SELECT u.username, u.password_hash, gs.score, gs.rebirth_count, gs.save_data 
    FROM users u 
    LEFT JOIN game_state gs ON u.id = gs.user_id
");

if ($resLocal) {
    while ($rowLocal = $resLocal->fetch_assoc()) {
        $username = $rowLocal['username'];
        log_bridge("Analyse utilisateur : [$username]... ");

        $stmt = $connAiven->prepare("
            SELECT u.id, u.password_hash, gs.score, gs.rebirth_count 
            FROM users u 
            LEFT JOIN game_state gs ON u.id = gs.user_id 
            WHERE u.username = ?
        ");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $resAiven = $stmt->get_result();
        $rowAiven = $resAiven->fetch_assoc();

        if (!$rowAiven) {
            log_bridge("Absent sur Aiven -> Création... ");
            copyUser($connAiven, $rowLocal);
            log_bridge("✅ Envoyé.\n");
        } else {
            $powerLocal = (intval($rowLocal['rebirth_count']) * 1e15) + floatval($rowLocal['score']);
            $powerAiven = (intval($rowAiven['rebirth_count']) * 1e15) + floatval($rowAiven['score']);

            if ($powerLocal > $powerAiven) {
                log_bridge("Local est plus avancé -> Sync vers Cloud... ");
                updateGameState($connAiven, $rowAiven['id'], $rowLocal);
                log_bridge("✅\n");
            } elseif ($powerAiven > $powerLocal) {
                log_bridge("Cloud est plus avancé -> Sync vers Local... ");
                $localId = getUserId($connLocal, $username);
                $fullAivenData = getUserData($connAiven, $username);
                updateGameState($connLocal, $localId, $fullAivenData);
                log_bridge("✅\n");
            } else {
                log_bridge("Déjà à jour.\n");
            }
        }
    }
}

log_bridge("\n✨ Synchronisation terminée !");

// --- FONCTIONS UTILITAIRES ---

function copyUser($connDest, $data) {
    $connDest->query("SET SESSION sql_require_primary_key = 0");
    $stmt = $connDest->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
    $stmt->bind_param("ss", $data['username'], $data['password_hash']);
    $stmt->execute();
    $newId = $connDest->insert_id;

    $stmt2 = $connDest->prepare("INSERT INTO game_state (user_id, score, rebirth_count, save_data) VALUES (?, ?, ?, ?)");
    $stmt2->bind_param("idss", $newId, $data['score'], $data['rebirth_count'], $data['save_data']);
    $stmt2->execute();
}

function updateGameState($connDest, $userId, $data) {
    $stmt = $connDest->prepare("UPDATE game_state SET score = ?, rebirth_count = ?, save_data = ? WHERE user_id = ?");
    $stmt->bind_param("dssi", $data['score'], $data['rebirth_count'], $data['save_data'], $userId);
    $stmt->execute();
}

function getUserId($conn, $username) {
    $res = $conn->query("SELECT id FROM users WHERE username = '$username'");
    $row = $res->fetch_assoc();
    return $row['id'];
}

function getUserData($conn, $username) {
    $res = $conn->query("
        SELECT u.username, u.password_hash, gs.score, gs.rebirth_count, gs.save_data 
        FROM users u 
        LEFT JOIN game_state gs ON u.id = gs.user_id
        WHERE u.username = '$username'
    ");
    return $res->fetch_assoc();
}