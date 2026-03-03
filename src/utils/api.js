// On utilise './api.php' pour forcer la recherche dans le dossier courant (dist)
// Cela évite que le navigateur cherche à la racine du serveur http://localhost/api.php
const API_URL = "./api.php";

export const signIn = async (username, password) => {
    // Debug pour voir exactement où React essaie de taper
    console.log("Appel API Login vers:", `${API_URL}?action=login`);

    const res = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        // Sécurité si le serveur renvoie du HTML au lieu de JSON (Erreur 404 par exemple)
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const err = await res.json();
            throw new Error(err.error || "Erreur de connexion");
        } else {
            throw new Error("Le serveur a renvoyé une réponse invalide (404 ou erreur PHP). Vérifiez que api.php est bien dans le dossier dist.");
        }
    }
    return res.json();
};

export const signUp = async (username, password) => {
    const res = await fetch(`${API_URL}?action=signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const err = await res.json();
            throw new Error(err.error || "Erreur lors de l'inscription");
        } else {
            throw new Error("Erreur serveur lors de l'inscription.");
        }
    }
    return res.json();
};

export const fetchLeaderboard = async () => {
    try {
        const res = await fetch(`${API_URL}?action=leaderboard`);
        if (!res.ok) throw new Error("Erreur leaderboard");
        return await res.json();
    } catch (err) {
        console.error("Erreur Leaderboard détaillée:", err);
        return [];
    }
};