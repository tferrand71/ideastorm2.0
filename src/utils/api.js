// ⚠️ L'adresse du port exposé par ton Docker pour le serveur Web.
// Assure-toi que cette URL ouvre bien une page blanche ou retourne "Action invalide" si tu la tapes dans ton navigateur.
const API_URL = "./api.php";

export const signIn = async (username, password) => {
    console.log("Appel API Login vers:", `${API_URL}?action=login`);

    const res = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const err = await res.json();
            throw new Error(err.error || "Erreur de connexion");
        } else {
            throw new Error("Le serveur a renvoyé une réponse non-JSON. Vérifiez que API_URL pointe bien vers le Docker PHP.");
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
        const res = await fetch(`${API_URL}?action=get_score`);
        if (!res.ok) throw new Error("Erreur réseau");
        return await res.json();
    } catch (err) {
        console.error("Erreur Leaderboard détaillée:", err);
        return [];
    }
};