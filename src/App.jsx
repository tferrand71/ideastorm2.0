import React, { useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ClickButton from "./components/ClickButton.jsx";
import Score from "./components/Score.jsx";
import Shop from "./pages/Shop.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import LoginForm from "./pages/LoginForm.jsx";
import SignupForm from "./pages/SignUpForm.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import Header from "./components/Header.jsx";
import MediaOverlay from "./components/MediaOverlay.jsx";
import Snow from "./components/Snow.jsx";
import EasterEgg from "./components/EasterEgg.jsx";

import useStore from "./store/useStore.js";
import { formatNumber } from "./utils/format.js";

export default function App() {
    const {
        score, perClick, perSecond, activeMedia, addScore,
        addPerSecond, saveGame, loadGame, user, setUser, gameState,
        showMedia, hasSeenEnding, closeEasterEgg
    } = useStore();

    // 1. GESTION DE LA SESSION
    useEffect(() => {
        const storedUser = localStorage.getItem("game_user");
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Erreur session:", e);
                localStorage.removeItem("game_user");
            }
        }
    }, [setUser]);

    // 2. BOUCLE DE JEU (Gain par seconde)
    useEffect(() => {
        const interval = setInterval(() => addPerSecond(), 1000);
        return () => clearInterval(interval);
    }, [perSecond, addPerSecond]);

    // 3. SYNCHRO AUTOMATIQUE QUAND ON REVIENT SUR L'ONGLET
    // Très important pour que les modifs faites dans l'Admin Panel soient appliquées au jeu
    useEffect(() => {
        const handleFocus = () => {
            if (user && gameState) {
                console.log("🔄 Synchro avec la base de données (Retour sur onglet)...");
                loadGame();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, gameState, loadGame]);

    // 4. SAUVEGARDE AUTO (Toutes les 10s)
    useEffect(() => {
        if (user && gameState) {
            const saveInterval = setInterval(() => saveGame(), 10000);
            return () => clearInterval(saveInterval);
        }
    }, [user, gameState, saveGame]);

    const END_GAME_THRESHOLD = 1e90;
    const showEnding = score >= END_GAME_THRESHOLD && !hasSeenEnding;

    return (
        <Router>
            {showMedia && <Snow />}
            {showMedia && <MediaOverlay media={activeMedia} />}
            {showEnding && <EasterEgg score={score} onClose={closeEasterEgg} />}

            <Header />

            <Routes>
                <Route
                    path="/"
                    element={
                        user ? (
                            !gameState ? (
                                <div className="page-full bg-home">
                                    <div className="game-card" style={{ textAlign: 'center', padding: '50px' }}>
                                        <h2 style={{ color: '#ff6f61' }}>Chargement de ta partie...</h2>
                                        <div style={{ fontSize: '3rem', marginTop: '20px', animation: 'spin 1s infinite linear' }}>⏳</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="page-full bg-home">
                                    <div className="game-card">
                                        <h1>IdeaStorm</h1>
                                        <Score score={score} />
                                        <p>Clic par clic : {formatNumber(perClick)}</p>
                                        <p>Gain automatique : {formatNumber(perSecond)} /s</p>
                                        <ClickButton onClick={() => addScore(perClick)} />
                                    </div>
                                </div>
                            )
                        ) : <Navigate to="/login" />
                    }
                />

                <Route path="/pages" element={user ? <Shop /> : <Navigate to="/login" />} />
                <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
                <Route path="/login" element={user ? <Navigate to="/" /> : (<div className="page-full bg-auth"><div className="game-card"><LoginForm /></div></div>)} />
                <Route path="/signup" element={user ? <Navigate to="/" /> : (<div className="page-full bg-auth"><div className="game-card"><SignupForm /></div></div>)} />
                <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}