import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const { user } = useStore();
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);

    // État pour stocker toutes les données du joueur en cours de modification
    const [selectedUser, setSelectedUser] = useState(null);

    // Adapte si besoin selon ta configuration
    const API_URL = "http://localhost/ideastorm/dist/api.php";

    useEffect(() => {
        if (!user || user.username !== "Letotoo06") {
            navigate('/');
        } else {
            loadPlayers();
        }
    }, [user, navigate]);

    const loadPlayers = async () => {
        try {
            const res = await fetch(`${API_URL}?action=admin_list`);
            const data = await res.json();
            setPlayers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur chargement joueurs:", err);
        }
    };

    // 1. Ouvrir le profil d'un joueur et charger sa SAUVEGARDE COMPLÈTE
    const handleSelectUser = async (player) => {
        try {
            const res = await fetch(`${API_URL}?action=load&userId=${player.id}`);
            const saveData = await res.json() || {};

            // On fusionne les infos de base et sa sauvegarde
            setSelectedUser({
                id: player.id,
                username: player.username,
                score: player.score || saveData.score || 0,
                rebirthCount: player.rebirth_count || saveData.rebirthCount || 0,
                perClick: saveData.perClick || 1,
                perSecond: saveData.perSecond || 0,
                catBought: saveData.catBought || false,
                cat2Bought: saveData.cat2Bought || false,
                volcanBought: saveData.volcanBought || false,
                cat3Bought: saveData.cat3Bought || false,
                gooseBought: saveData.gooseBought || false,
                rawSaveData: saveData // On garde le reste (prix des upgrades, etc.) intact
            });
        } catch (err) {
            console.error("Erreur chargement sauvegarde:", err);
            alert("Impossible de charger la sauvegarde détaillée du joueur.");
        }
    };

    // 2. Sauvegarder les modifications en écrasant la sauvegarde du joueur
    const handleSaveUser = async () => {
        if (!selectedUser) return;

        // On recrée l'objet de sauvegarde exact que le jeu utilise
        const updatedSaveData = {
            ...selectedUser.rawSaveData,
            score: selectedUser.score,
            rebirthCount: selectedUser.rebirthCount,
            perClick: selectedUser.perClick,
            perSecond: selectedUser.perSecond,
            catBought: selectedUser.catBought,
            cat2Bought: selectedUser.cat2Bought,
            volcanBought: selectedUser.volcanBought,
            cat3Bought: selectedUser.cat3Bought,
            gooseBought: selectedUser.gooseBought
        };

        try {
            const response = await fetch(`${API_URL}?action=save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: selectedUser.id,
                    score: selectedUser.score,
                    save_data: updatedSaveData // On écrase l'inventaire complet !
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(`✅ Sauvegarde de ${selectedUser.username} modifiée avec succès !`);
                setSelectedUser(null);
                loadPlayers(); // On rafraîchit la liste
            } else {
                alert("Erreur lors de la sauvegarde : " + (result.error || "Inconnue"));
            }
        } catch (err) {
            console.error("Erreur réseau:", err);
            alert("Erreur réseau lors de la sauvegarde.");
        }
    };

    // --- Fonctions utilitaires pour les boutons ---
    const updateField = (field, value) => setSelectedUser(prev => ({ ...prev, [field]: value }));
    const addField = (field, amount) => setSelectedUser(prev => ({ ...prev, [field]: prev[field] + amount }));

    // ==========================================
    // VUE 1 : LE TABLEAU DE BORD DU JOUEUR SÉLECTIONNÉ
    // ==========================================
    if (selectedUser) {
        return (
            <div style={styles.container}>
                <button onClick={() => setSelectedUser(null)} style={styles.backBtn}>🔙 Retour à la liste</button>
                <h1 style={styles.title}>⚙️ GESTION : <span style={{color: '#e94560'}}>{selectedUser.username}</span></h1>

                <div style={styles.panelGrid}>

                    {/* SECTION 1 : RESSOURCES DE BASE */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>💰 Score & Rebirth</h3>
                        <label style={styles.label}>Score Actuel</label>
                        <input type="number" value={selectedUser.score} onChange={e => updateField('score', parseFloat(e.target.value) || 0)} style={styles.inputFull} />
                        <div style={styles.btnGroup}>
                            <button onClick={() => addField('score', 1e6)} style={styles.addBtn}>+1 Million</button>
                            <button onClick={() => addField('score', 1e9)} style={styles.addBtn}>+1 Milliard</button>
                            <button onClick={() => addField('score', 1e12)} style={styles.addBtn}>+1 Trillion</button>
                        </div>

                        <label style={styles.label}>Niveau de Rebirth</label>
                        <input type="number" value={selectedUser.rebirthCount} onChange={e => updateField('rebirthCount', parseInt(e.target.value) || 0)} style={styles.inputFull} />
                        <div style={styles.btnGroup}>
                            <button onClick={() => addField('rebirthCount', 1)} style={{...styles.addBtn, background: 'gold', color: 'black'}}>+1 Rebirth</button>
                        </div>
                    </div>

                    {/* SECTION 2 : PUISSANCE (CLIC & AUTO) */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>⚡ Puissance</h3>

                        <label style={styles.label}>Points par Clic</label>
                        <input type="number" value={selectedUser.perClick} onChange={e => updateField('perClick', parseFloat(e.target.value) || 0)} style={styles.inputFull} />
                        <div style={styles.btnGroup}>
                            <button onClick={() => addField('perClick', 1000)} style={styles.addBtn}>+1k Clic</button>
                            <button onClick={() => addField('perClick', 100000)} style={styles.addBtn}>+100k Clic</button>
                            <button onClick={() => addField('perClick', 10000000)} style={styles.addBtn}>+10M Clic</button>
                        </div>

                        <label style={styles.label}>Points par Seconde (Auto)</label>
                        <input type="number" value={selectedUser.perSecond} onChange={e => updateField('perSecond', parseFloat(e.target.value) || 0)} style={styles.inputFull} />
                        <div style={styles.btnGroup}>
                            <button onClick={() => addField('perSecond', 1000)} style={styles.addBtn}>+1k Auto</button>
                            <button onClick={() => addField('perSecond', 100000)} style={styles.addBtn}>+100k Auto</button>
                            <button onClick={() => addField('perSecond', 10000000)} style={styles.addBtn}>+10M Auto</button>
                        </div>
                    </div>

                    {/* SECTION 3 : INVENTAIRE & COMPAGNONS */}
                    <div style={styles.card}>
                        <h3 style={styles.cardTitle}>🐾 Compagnons Débloqués</h3>
                        <div style={styles.companionList}>
                            <label style={styles.checkLabel}>
                                <input type="checkbox" checked={selectedUser.catBought} onChange={e => updateField('catBought', e.target.checked)} style={styles.checkbox} /> 🤪 Chat Débile
                            </label>
                            <label style={styles.checkLabel}>
                                <input type="checkbox" checked={selectedUser.cat2Bought} onChange={e => updateField('cat2Bought', e.target.checked)} style={styles.checkbox} /> 🥷 Chat Ninja
                            </label>
                            <label style={styles.checkLabel}>
                                <input type="checkbox" checked={selectedUser.volcanBought} onChange={e => updateField('volcanBought', e.target.checked)} style={styles.checkbox} /> 🔫 Chat Tueur
                            </label>
                            <label style={styles.checkLabel}>
                                <input type="checkbox" checked={selectedUser.cat3Bought} onChange={e => updateField('cat3Bought', e.target.checked)} style={styles.checkbox} /> 👑 Roi Chat
                            </label>
                            <label style={styles.checkLabel}>
                                <input type="checkbox" checked={selectedUser.gooseBought} onChange={e => updateField('gooseBought', e.target.checked)} style={styles.checkbox} /> 🪿 L'Oie d'Or
                            </label>
                        </div>
                    </div>
                </div>

                {/* BOUTON SAUVEGARDE GLOBAL */}
                <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '50px' }}>
                    <button onClick={handleSaveUser} style={styles.bigSaveBtn}>💾 SAUVEGARDER LE JOUEUR</button>
                </div>
            </div>
        );
    }

    // ==========================================
    // VUE 2 : LISTE DE TOUS LES JOUEURS
    // ==========================================
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🛡️ ADMIN GOD MODE</h1>

            <table style={styles.table}>
                <thead>
                <tr style={styles.thead}>
                    <th style={{paddingLeft: '15px'}}>Joueur</th>
                    <th>Score</th>
                    <th>Rebirths</th>
                    <th style={{textAlign: 'center'}}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {players.map(p => (
                    <tr key={p.id} style={styles.tr}>
                        <td style={styles.username}>{p.username}</td>
                        <td style={{color: '#a29bfe', fontWeight: 'bold'}}>{parseFloat(p.score).toLocaleString()}</td>
                        <td style={{color: 'gold', fontWeight: 'bold'}}>✨ {p.rebirth_count}</td>
                        <td style={{textAlign: 'center', padding: '10px'}}>
                            <button onClick={() => handleSelectUser(p)} style={styles.manageBtn}>⚙️ Gérer</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

// ==========================================
// STYLES
// ==========================================
const styles = {
    container: { padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', color: 'white', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', color: '#4CAF50', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 10px rgba(76, 175, 80, 0.5)' },

    // Liste
    table: { width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' },
    thead: { background: '#0f3460', color: '#4CAF50', textAlign: 'left', height: '55px', textTransform: 'uppercase', fontSize: '0.9rem' },
    tr: { borderBottom: '1px solid rgba(255,255,255,0.05)', height: '65px', transition: '0.2s', ':hover': { background: '#1a1a2e' } },
    username: { fontWeight: 'bold', paddingLeft: '15px', color: '#e94560', fontSize: '1.1rem' },
    manageBtn: { background: '#00d4ff', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)' },

    // Panneau de contrôle
    backBtn: { background: '#333', color: 'white', border: '1px solid #555', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' },
    panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { background: '#16213e', padding: '25px', borderRadius: '12px', borderTop: '4px solid #e94560', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' },
    cardTitle: { marginTop: 0, marginBottom: '20px', color: '#e94560', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' },
    label: { display: 'block', color: '#a29bfe', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', marginTop: '15px', fontWeight: 'bold' },
    inputFull: { width: '100%', background: '#0f3460', color: 'white', border: '1px solid #4CAF50', padding: '12px', borderRadius: '8px', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' },

    btnGroup: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px', marginBottom: '10px' },
    addBtn: { background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50', color: '#4CAF50', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' },

    companionList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    checkLabel: { display: 'flex', alignItems: 'center', fontSize: '1.1rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' },
    checkbox: { transform: 'scale(1.5)', marginRight: '15px', accentColor: '#4CAF50' },

    bigSaveBtn: { background: 'linear-gradient(45deg, #4CAF50, #00d4ff)', color: 'black', border: 'none', padding: '20px 40px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)', textTransform: 'uppercase', letterSpacing: '2px' }
};