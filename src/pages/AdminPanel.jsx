import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
    const { user } = useStore();
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ score: 0, rebirth_count: 0 });

    useEffect(() => {
        if (!user || user.username !== "Letotoo06") {
            navigate('/');
        } else {
            loadPlayers();
        }
    }, [user, navigate]);

    const loadPlayers = async () => {
        try {
            const res = await fetch('./api.php?action=admin_list');
            const data = await res.json();
            // On s'assure que data est bien un tableau avant de set
            setPlayers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur chargement joueurs:", err);
        }
    };

    const startEdit = (player) => {
        setEditingId(player.id);
        setEditData({ score: player.score, rebirth_count: player.rebirth_count });
    };

    const saveStats = async (id) => {
        try {
            const response = await fetch('./api.php?action=admin_update_stats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // <--- INDISPENSABLE pour que PHP lise le JSON
                },
                body: JSON.stringify({
                    id,
                    score: editData.score,
                    rebirth_count: parseInt(editData.rebirth_count)
                })
            });

            const result = await response.json();

            if (result.success) {
                setEditingId(null);
                loadPlayers(); // Rafraîchir pour voir les changements
            } else {
                alert("Erreur lors de la sauvegarde : " + (result.error || "Inconnue"));
            }
        } catch (err) {
            console.error("Erreur réseau:", err);
            alert("Impossible de contacter le serveur.");
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🛡️ ADMIN GOD MODE</h1>

            <table style={styles.table}>
                <thead>
                <tr style={styles.thead}>
                    <th style={{paddingLeft: '10px'}}>Joueur</th>
                    <th>Score</th>
                    <th>Rebirths</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {players.map(p => (
                    <tr key={p.id} style={styles.tr}>
                        <td style={styles.username}>{p.username}</td>

                        <td>
                            {editingId === p.id ? (
                                <input
                                    type="number"
                                    value={editData.score}
                                    onChange={(e) => setEditData({...editData, score: e.target.value})}
                                    style={styles.input}
                                />
                            ) : (
                                parseFloat(p.score).toLocaleString()
                            )}
                        </td>

                        <td>
                            {editingId === p.id ? (
                                <input
                                    type="number"
                                    value={editData.rebirth_count}
                                    onChange={(e) => setEditData({...editData, rebirth_count: e.target.value})}
                                    style={styles.input}
                                />
                            ) : (
                                `✨ ${p.rebirth_count}`
                            )}
                        </td>

                        <td>
                            {editingId === p.id ? (
                                <button onClick={() => saveStats(p.id)} style={styles.saveBtn}>💾 OK</button>
                            ) : (
                                <button onClick={() => startEdit(p)} style={styles.editBtn}>✏️ Modifier</button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

const styles = {
    container: { padding: '100px 20px', maxWidth: '1000px', margin: '0 auto', color: 'white', fontFamily: 'Arial, sans-serif' },
    title: { textAlign: 'center', color: '#4CAF50', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '2px' },
    table: { width: '100%', borderCollapse: 'collapse', background: '#16213e', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' },
    thead: { background: '#0f3460', color: '#4CAF50', textAlign: 'left', height: '50px' },
    tr: { borderBottom: '1px solid #0f3460', height: '60px', transition: '0.3s' },
    input: { background: '#1a1a2e', color: 'white', border: '1px solid #4CAF50', padding: '8px', borderRadius: '4px', width: '150px', outline: 'none' },
    editBtn: { background: '#4CAF50', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontWeight: 'bold' },
    saveBtn: { background: '#00d4ff', color: 'black', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    username: { fontWeight: 'bold', paddingLeft: '10px', color: '#e94560' }
};