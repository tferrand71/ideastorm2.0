import React, { useState } from 'react';
import { signIn } from '../utils/api';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Pour éviter les doubles clics

    const setUser = useStore(state => state.setUser);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        // 1. On empêche le rechargement de la page
        e.preventDefault();

        // 2. DEBUG : On vérifie que la fonction se lance
        console.log("🚀 Tentative de connexion pour :", username);

        if (!username || !password) {
            alert("Veuillez remplir tous les champs");
            return;
        }

        setIsLoading(true);

        try {
            // 3. DEBUG : On trace l'appel vers api.js
            console.log("Appel de la fonction signIn...");

            const user = await signIn(username, password);

            // 4. DEBUG : Si on arrive ici, c'est que le PHP a répondu du JSON valide
            console.log("✅ Connexion réussie, données reçues :", user);

            setUser(user);
            alert("Connexion réussie !");
            navigate('/');

        } catch(err) {
            // 5. DEBUG : On affiche l'erreur réelle dans la console
            console.error("❌ Erreur attrapée dans LoginForm :", err.message);
            alert(err.message || "Erreur de connexion");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '300px',
                margin: 'auto',
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
            }}
        >
            <h2 style={{ textAlign: 'center', color: 'white' }}>Connexion</h2>

            <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nom d'utilisateur"
                required
                style={{ padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mot de passe"
                type="password"
                required
                style={{ padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            <button
                type="submit"
                disabled={isLoading}
                style={{
                    padding: '10px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    background: isLoading ? '#666' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    fontSize: '1rem',
                    borderRadius: '4px',
                    transition: '0.3s'
                }}
            >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
        </form>
    );
}