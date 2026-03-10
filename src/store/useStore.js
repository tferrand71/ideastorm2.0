import { create } from "zustand";

// --- CONFIGURATION ---
const API_URL = "./api.php";

let autosaveTimer = null;

const toCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const newObj = {};
    for (const key in obj) {
        const newKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[newKey] = obj[key];
    }
    return newObj;
};

const toNumber = (val, defaultVal) => {
    if (val === undefined || val === null) return defaultVal;
    const num = Number(val);
    return isNaN(num) ? defaultVal : num;
};

const BASE_COSTS = {
    click: 50, auto: 100,
    cat: 250, cat2: 2500, volcan: 25000, cat3: 200000, goose: 1000000,
    super: 500000, mega: 2500000, giga: 15000000, ultimate: 2500000,
    c500k: 40000000, c1m: 1e8, c10m: 1e9, c100m: 1e10, c1b: 1e11, c10b: 1e12, c100b: 1e13,
    a500k: 40000000, a1m: 1e8, a10m: 1e9, a100m: 1e10, a1b: 1e11, a10b: 1e12, a100b: 1e13,
    multX2: 1e8, autoMultX2: 1e8,
    godA: 1e12, godAA: 1e15, sext: 1e21, noni: 1e27, duo: 1e36,
    vigin: 1e63, trigin: 1e93, quinqua: 1e153, nonagin: 1e273,
    googol: 1e100, cent: 1e303,
    c1e120: 1e120, c1e180: 1e180, c1e240: 1e240, c1e300: 1e300
};

const getResetState = (rebirthCount) => {
    const isHardReset = rebirthCount === 0;
    const highMult = isHardReset ? 1 : (rebirthCount + 2);
    const lowMult = isHardReset ? 1 : Math.max(1.5, highMult / 2);
    const powerMult = isHardReset ? 1 : Math.pow(50, rebirthCount);

    return {
        score: 0,
        perClick: 1 * powerMult,
        perSecond: 0,
        rebirthCount: rebirthCount,
        activeMedia: [],

        catBought: false, cat2Bought: false, cat3Bought: false,
        volcanBought: false, gooseBought: false,

        clickUpgradeCost: Math.floor(BASE_COSTS.click * lowMult),
        autoUpgradeCost: Math.floor(BASE_COSTS.auto * lowMult),
        catUpgradeCost: Math.floor(BASE_COSTS.cat * lowMult),
        cat2UpgradeCost: Math.floor(BASE_COSTS.cat2 * lowMult),
        volcanCost: Math.floor(BASE_COSTS.volcan * ((lowMult + highMult) / 2)),
        cat3UpgradeCost: Math.floor(BASE_COSTS.cat3 * highMult),
        gooseCost: Math.floor(BASE_COSTS.goose * highMult),

        superClickCost: BASE_COSTS.super * highMult, megaClickCost: BASE_COSTS.mega * highMult, gigaClickCost: BASE_COSTS.giga * highMult, ultimateClickCost: BASE_COSTS.ultimate * highMult,
        click500kCost: BASE_COSTS.c500k * highMult, auto500kCost: BASE_COSTS.a500k * highMult,
        click1mCost: BASE_COSTS.c1m * highMult, auto1mCost: BASE_COSTS.a1m * highMult,
        click10mCost: BASE_COSTS.c10m * highMult, click100mCost: BASE_COSTS.c100m * highMult, click1bCost: BASE_COSTS.c1b * highMult, click10bCost: BASE_COSTS.c10b * highMult, click100bCost: BASE_COSTS.c100b * highMult,
        auto10mCost: BASE_COSTS.a10m * highMult, auto100mCost: BASE_COSTS.a100m * highMult, auto1bCost: BASE_COSTS.a1b * highMult, auto10bCost: BASE_COSTS.a10b * highMult, auto100bCost: BASE_COSTS.a100b * highMult,
        multX2Cost: BASE_COSTS.multX2 * highMult, autoMultX2Cost: BASE_COSTS.autoMultX2 * highMult,
        godClickACost: BASE_COSTS.godA * highMult, godClickAACost: BASE_COSTS.godAA * highMult,
        clickSextillionCost: BASE_COSTS.sext * highMult, autoSextillionCost: BASE_COSTS.sext * highMult,
        clickNonillionCost: BASE_COSTS.noni * highMult, autoNonillionCost: BASE_COSTS.noni * highMult,
        clickDuodecillionCost: BASE_COSTS.duo * highMult, autoDuodecillionCost: BASE_COSTS.duo * highMult,

        clickVigintillionCost: BASE_COSTS.vigin * highMult,
        clickTrigintillionCost: BASE_COSTS.trigin * highMult,
        clickQuinquagintillionCost: BASE_COSTS.quinqua * highMult,
        clickNonagintillionCost: BASE_COSTS.nonagin * highMult,

        clickGoogolCost: BASE_COSTS.googol * highMult, autoGoogolCost: BASE_COSTS.googol * highMult,
        clickCentillionCost: BASE_COSTS.cent * highMult, autoCentillionCost: BASE_COSTS.cent * highMult,
        click1e120Cost: BASE_COSTS.c1e120 * highMult, auto1e120Cost: BASE_COSTS.c1e120 * highMult,
        click1e180Cost: BASE_COSTS.c1e180 * highMult, auto1e180Cost: BASE_COSTS.c1e180 * highMult,
        click1e240Cost: BASE_COSTS.c1e240 * highMult, auto1e240Cost: BASE_COSTS.c1e240 * highMult,
        click1e300Cost: BASE_COSTS.c1e300 * highMult, auto1e300Cost: BASE_COSTS.c1e300 * highMult,
        godAutoACost: BASE_COSTS.godA * highMult, godAutoAACost: BASE_COSTS.godAA * highMult
    };
};

export const useStore = create((set, get) => ({
    ...getResetState(0),
    user: null,
    gameState: false, // <-- Sécurité pour que l'autosave n'écrase pas la BDD au lancement
    showMedia: true,
    hasSeenEnding: false,

    toggleMedia: () => set((state) => ({ showMedia: !state.showMedia })),
    closeEasterEgg: () => set({ hasSeenEnding: true }),
    setActiveMedia: (media) => set({ activeMedia: media }),

    setUser: (user) => {
        set({ user });
        if (user) {
            localStorage.setItem("game_user", JSON.stringify(user));
            get().loadGame();

            // Lancement de la sauvegarde automatique (toutes les 5s)
            if (!autosaveTimer) {
                autosaveTimer = setInterval(() => {
                    get().saveToDB();
                }, 5000);
            }
        } else {
            localStorage.removeItem("game_user");
            set({ gameState: false, ...getResetState(0) });

            if (autosaveTimer) {
                clearInterval(autosaveTimer);
                autosaveTimer = null;
            }
        }
    },

    loadGame: async () => {
        const s = get();
        if (!s.user) return;

        // 🟢 CORRECTION VITALE ICI : On récupère l'ID correctement
        const currentUserId = s.user.userId || s.user.id;

        try {
            console.log("📥 Chargement de la sauvegarde pour l'ID :", currentUserId);
            // On ajoute Date.now() pour empêcher le navigateur de nous ressortir une vieille sauvegarde du cache
            const res = await fetch(`${API_URL}?action=load&userId=${currentUserId}&t=${Date.now()}`, {
                cache: 'no-store'
            });

            if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);

            const rawData = await res.json();
            console.log("✅ Données reçues depuis la BDD :", rawData);

            if (rawData && Object.keys(rawData).length > 0) {
                const camelData = toCamelCase(rawData);
                const savedRebirth = toNumber(camelData.rebirthCount, 0);
                const defaultState = getResetState(savedRebirth);
                set({
                    ...defaultState,
                    ...camelData,
                    gameState: true, // <-- Le jeu est chargé, on débloque l'autosave !
                    score: toNumber(camelData.score, 0),
                    perClick: toNumber(camelData.perClick, defaultState.perClick),
                    perSecond: toNumber(camelData.perSecond, 0),
                    rebirthCount: savedRebirth
                });
            } else {
                console.log("📝 Nouveau joueur, initialisation à zéro.");
                set({ ...getResetState(0), gameState: true });
            }
        } catch (err) {
            console.error("❌ Erreur de chargement:", err);
            set({ ...getResetState(0), gameState: true });
        }
    },

    saveToDB: async (partialState = {}) => {
        const s = get();
        if (!s.user) return;

        // 🛑 SÉCURITÉ : On bloque la sauvegarde tant que loadGame n'a pas fini de télécharger la vraie sauvegarde
        if (s.gameState !== true) return;

        // 🟢 CORRECTION VITALE ICI : On utilise le bon ID pour sauvegarder
        const currentUserId = s.user.userId || s.user.id;

        const currentState = { ...s, ...partialState };
        const keysToExclude = ['user', 'gameState', 'saveToDB', 'saveGame', 'loadGame', 'buyUpgrade', 'sellUpgrade', 'buyAutoUpgradeHelper', 'resetGame'];
        const dataToSave = {};
        for (const key in currentState) {
            if (typeof currentState[key] !== 'function' && !keysToExclude.includes(key)) {
                dataToSave[key] = currentState[key];
            }
        }
        try {
            await fetch(`${API_URL}?action=save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: currentUserId, // C'est lui qui faisait l'erreur !
                    score: currentState.score,
                    save_data: dataToSave
                })
            });
            console.log("💾 Sauvegardé avec succès ! Score:", currentState.score);
        } catch (err) { console.error("Erreur sauvegarde:", err); }
    },

    saveGame: async () => { get().saveToDB(); },

    addScore: (value) => {
        const { score } = get();
        const newScore = Math.floor(score + toNumber(value, 0));
        if (!isNaN(newScore)) set({ score: newScore });
    },

    addPerSecond: () => {
        const { perSecond, score } = get();
        const ps = toNumber(perSecond, 0);
        if (ps > 0) {
            const newScore = Math.floor(score + ps);
            if (!isNaN(newScore)) set({ score: newScore });
        }
    },

    triggerRebirth: async () => {
        const s = get();
        const REBIRTH_REQ = 1e36;
        if (s.score < REBIRTH_REQ || s.rebirthCount >= 6) return;
        const newRebirthCount = s.rebirthCount + 1;
        const resetState = getResetState(newRebirthCount);
        set(resetState);
        get().saveToDB(resetState);
        window.location.reload();
    },

    resetGame: async () => {
        const s = get();
        if (!s.user) return;
        const resetState = getResetState(0);
        set(resetState);
        get().saveToDB(resetState);
        window.location.reload();
    },

    buyUpgrade: async (costKey, clickBonus) => {
        const state = get();
        const cost = toNumber(state[costKey], Infinity);
        if (state.score >= cost) {
            const newScore = Math.floor(state.score - cost);
            const newPerClick = Math.floor(state.perClick + Number(clickBonus));
            const newCost = cost * 1.5;
            set({ score: newScore, perClick: newPerClick, [costKey]: newCost });
            get().saveToDB();
        }
    },

    buyAutoUpgradeHelper: async (costKey, autoBonus) => {
        const state = get();
        const cost = toNumber(state[costKey], Infinity);
        if (state.score >= cost) {
            const pm = Math.pow(50, state.rebirthCount);
            const newScore = Math.floor(state.score - cost);
            const newPerSecond = Math.floor(state.perSecond + Number(autoBonus) * pm);
            const newCost = cost * 1.5;
            set({ score: newScore, perSecond: newPerSecond, [costKey]: newCost });
            get().saveToDB();
        }
    },

    sellUpgrade: async (costKey, statKey, statDeduction) => {
        const state = get();
        const currentCost = toNumber(state[costKey], 0);
        if (currentCost <= 0) return;
        const previousCost = currentCost / 1.5;
        const refund = previousCost / 2;

        let deduction = toNumber(statDeduction, 0);
        if (statKey === 'perSecond') {
            deduction = Math.floor(deduction * Math.pow(50, state.rebirthCount));
        }

        set({
            score: Math.floor(state.score + refund),
            [statKey]: Math.max(0, Math.floor(state[statKey] - deduction)),
            [costKey]: previousCost
        });
        get().saveToDB();
    },

    // --- MAPPINGS CLICS ---
    buyClickUpgrade: () => get().buyUpgrade('clickUpgradeCost', 1),
    buySuperClick: () => get().buyUpgrade('superClickCost', 10000),
    buyMegaClick: () => get().buyUpgrade('megaClickCost', 100000),
    buyGigaClick: () => get().buyUpgrade('gigaClickCost', 200000),
    buy500k: () => get().buyUpgrade('click500kCost', 500000),
    buy1m: () => get().buyUpgrade('click1mCost', 1000000),
    buy10m: () => get().buyUpgrade('click10mCost', 10000000),
    buy100m: () => get().buyUpgrade('click100mCost', 100000000),
    buy1b: () => get().buyUpgrade('click1bCost', 1000000000),
    buy10b: () => get().buyUpgrade('click10bCost', 10000000000),
    buy100b: () => get().buyUpgrade('click100bCost', 100000000000),
    buyGodA: () => get().buyUpgrade('godClickACost', 1e12),
    buyGodAA: () => get().buyUpgrade('godClickAACost', 1e15),
    buySextillion: () => get().buyUpgrade('clickSextillionCost', 1e21),
    buyNonillion: () => get().buyUpgrade('clickNonillionCost', 1e27),
    buyDuodecillion: () => get().buyUpgrade('clickDuodecillionCost', 1e36),
    buyVigintillion: () => get().buyUpgrade('clickVigintillionCost', 1e60),
    buyTrigintillion: () => get().buyUpgrade('clickTrigintillionCost', 1e90),
    buyQuinquagintillion: () => get().buyUpgrade('clickQuinquagintillionCost', 1e150),
    buyNonagintillion: () => get().buyUpgrade('clickNonagintillionCost', 1e270),
    buyGoogol: () => get().buyUpgrade('clickGoogolCost', 1e100),
    buyCentillion: () => get().buyUpgrade('clickCentillionCost', 1e303),
    buy1e120: () => get().buyUpgrade('click1e120Cost', 1e120),
    buy1e180: () => get().buyUpgrade('click1e180Cost', 1e180),
    buy1e240: () => get().buyUpgrade('click1e240Cost', 1e240),
    buy1e300: () => get().buyUpgrade('click1e300Cost', 1e300),

    // --- MAPPINGS AUTO ---
    buyAutoUpgrade: () => get().buyAutoUpgradeHelper('autoUpgradeCost', 2),
    buyAuto500k: () => get().buyAutoUpgradeHelper('auto500kCost', 500000),
    buyAuto1m: () => get().buyAutoUpgradeHelper('auto1mCost', 1000000),
    buyAuto10m: () => get().buyAutoUpgradeHelper('auto10mCost', 10000000),
    buyAuto100m: () => get().buyAutoUpgradeHelper('auto100mCost', 100000000),
    buyAuto1b: () => get().buyAutoUpgradeHelper('auto1bCost', 1000000000),
    buyAuto10b: () => get().buyAutoUpgradeHelper('auto10bCost', 10000000000),
    buyAuto100b: () => get().buyAutoUpgradeHelper('auto100bCost', 100000000000),
    buyAutoGodA: () => get().buyAutoUpgradeHelper('godAutoACost', 1e12),
    buyAutoGodAA: () => get().buyAutoUpgradeHelper('godAutoAACost', 1e15),
    buyAutoSextillion: () => get().buyAutoUpgradeHelper('autoSextillionCost', 1e21),
    buyAutoNonillion: () => get().buyAutoUpgradeHelper('autoNonillionCost', 1e27),
    buyAutoDuodecillion: () => get().buyAutoUpgradeHelper('autoDuodecillionCost', 1e36),
    buyAutoGoogol: () => get().buyAutoUpgradeHelper('autoGoogolCost', 1e100),
    buyAutoCentillion: () => get().buyAutoUpgradeHelper('autoCentillionCost', 1e303),

    // --- MULTIPLICATEURS ---
    buyMultX2: async () => {
        const s = get();
        if(s.score >= s.multX2Cost){
            set({score: s.score - s.multX2Cost, perClick: s.perClick * 2, multX2Cost: s.multX2Cost * 3});
            get().saveToDB();
        }
    },
    buyAutoMultX2: async () => {
        const s = get();
        if(s.score >= s.autoMultX2Cost){
            set({score: s.score - s.autoMultX2Cost, perSecond: s.perSecond * 2, autoMultX2Cost: s.autoMultX2Cost * 3});
            get().saveToDB();
        }
    },
    buyUltimateClick: async () => {
        const s = get();
        if(s.score >= s.ultimateClickCost){
            set({score: s.score - s.ultimateClickCost, perClick: s.perClick * 3, ultimateClickCost: s.ultimateClickCost * 4});
            get().saveToDB();
        }
    },

    sellClickUpgrade: () => get().sellUpgrade('clickUpgradeCost', 'perClick', 1),
    sellSuperClick: () => get().sellUpgrade('superClickCost', 'perClick', 10000),

    // --- COMPAGNONS UNIQUES ---
    buyCatUpgrade: async () => {
        const s = get();
        if(s.score >= s.catUpgradeCost && !s.catBought) {
            const pm = Math.pow(50, s.rebirthCount);
            set({score: Math.floor(s.score - s.catUpgradeCost), perSecond: Math.floor(s.perSecond + 5 * pm), catBought: true});
            get().saveToDB();
        }
    },
    buyCat2Upgrade: async () => {
        const s = get();
        if(s.score >= s.cat2UpgradeCost && !s.cat2Bought) {
            const pm = Math.pow(50, s.rebirthCount);
            set({score: Math.floor(s.score - s.cat2UpgradeCost), perSecond: Math.floor(s.perSecond + 60 * pm), cat2Bought: true});
            get().saveToDB();
        }
    },
    buyVolcan: async () => {
        const s = get();
        if(s.score >= s.volcanCost && !s.volcanBought) {
            const pm = Math.pow(50, s.rebirthCount);
            set({score: Math.floor(s.score - s.volcanCost), perSecond: Math.floor(s.perSecond + 700 * pm), volcanBought: true});
            get().saveToDB();
        }
    },
    buyCat3Upgrade: async () => {
        const s = get();
        if(s.score >= s.cat3UpgradeCost && !s.cat3Bought) {
            const pm = Math.pow(50, s.rebirthCount);
            set({score: Math.floor(s.score - s.cat3UpgradeCost), perSecond: Math.floor(s.perSecond + 6000 * pm), cat3Bought: true});
            get().saveToDB();
        }
    },
    buyGoose: async () => {
        const s = get();
        if(s.score >= s.gooseCost && !s.gooseBought) {
            const pm = Math.pow(50, s.rebirthCount);
            set({score: Math.floor(s.score - s.gooseCost), perSecond: Math.floor(s.perSecond + 35000 * pm), gooseBought: true});
            get().saveToDB();
        }
    },
}));

// ==============================================================
// 🟢 AUTO-RECONNEXION LORS DU RAFRAÎCHISSEMENT (F5) DE LA PAGE
// ==============================================================
const restoreSession = () => {
    try {
        const savedUserStr = localStorage.getItem("game_user");
        if (savedUserStr) {
            useStore.getState().setUser(JSON.parse(savedUserStr));
        }
    } catch (err) {
        console.error("Erreur de restauration de la session:", err);
    }
};

restoreSession();

export default useStore;