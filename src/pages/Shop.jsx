import React from "react";
import useStore from "../store/useStore";
import { formatNumber } from "../utils/format";

export default function Shop() {
    const store = useStore();
    const powerMult = Math.pow(50, store.rebirthCount);

    const renderUpgradeRow = (label, cost, buyFn, sellFn, disabledBuy, sellDisabledCondition, buttonStyle = {}) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            <button className="upgrade-btn" onClick={buyFn} disabled={disabledBuy} style={{ ...buttonStyle, margin: 0, justifyContent: 'space-between', textAlign: 'left', display: 'flex', width: '100%' }}>
                <span>{label}</span><span style={{ fontSize: '0.85em', opacity: 0.9, fontWeight: 'bold' }}>{formatNumber(cost)}</span>
            </button>
            {!sellDisabledCondition ? (
                <button onClick={sellFn} style={{ width: '100%', margin: 0, padding: '10px 5px', background: 'rgba(255, 118, 117, 0.1)', border: '1px solid #ff7675', color: '#d63031', fontWeight: 'bold', borderRadius: '12px', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>Vendre</button>
            ) : (
                <div style={{ border: '1px dashed #ccc', borderRadius: '12px', padding: '10px 0', textAlign: 'center', color: '#ccc', fontSize: '0.8rem' }}>-</div>
            )}
        </div>
    );

    // Liste EXHAUSTIVE des upgrades de Clic
    const clickUpgrades = [
        { id: 'superClickCost', label: "🌟 Super (+10k)", cost: store.superClickCost, buy: store.buySuperClick, sell: () => store.sellUpgrade('superClickCost', 'perClick', 10000), minSell: 5e5 },
        { id: 'megaClickCost', label: "🔥 Méga (+100k)", cost: store.megaClickCost, buy: store.buyMegaClick, sell: () => store.sellUpgrade('megaClickCost', 'perClick', 100000), minSell: 2.5e6 },
        { id: 'gigaClickCost', label: "🚀 Giga (+200k)", cost: store.gigaClickCost, buy: store.buyGigaClick, sell: () => store.sellUpgrade('gigaClickCost', 'perClick', 200000), minSell: 1.5e7 },
        { id: 'click500kCost', label: "💎 +500k Clic", cost: store.click500kCost, buy: store.buy500k, sell: () => store.sellUpgrade('click500kCost', 'perClick', 500000), minSell: 4e7 },
        { id: 'click1mCost', label: "💎 +1M Clic", cost: store.click1mCost, buy: store.buy1m, sell: () => store.sellUpgrade('click1mCost', 'perClick', 1e6), minSell: 1e8 },
        { id: 'click10mCost', label: "💎 +10M Clic", cost: store.click10mCost, buy: store.buy10m, sell: () => store.sellUpgrade('click10mCost', 'perClick', 1e7), minSell: 1e9 },
        { id: 'click100mCost', label: "💎 +100M Clic", cost: store.click100mCost, buy: store.buy100m, sell: () => store.sellUpgrade('click100mCost', 'perClick', 1e8), minSell: 1e10 },
        { id: 'click1bCost', label: "🪐 +1B Clic", cost: store.click1bCost, buy: store.buy1b, sell: () => store.sellUpgrade('click1bCost', 'perClick', 1e9), minSell: 1e11 },
        { id: 'click10bCost', label: "🪐 +10B Clic", cost: store.click10bCost, buy: store.buy10b, sell: () => store.sellUpgrade('click10bCost', 'perClick', 1e10), minSell: 1e12 },
        { id: 'click100bCost', label: "🪐 +100B Clic", cost: store.click100bCost, buy: store.buy100b, sell: () => store.sellUpgrade('click100bCost', 'perClick', 1e11), minSell: 1e13 },
        { id: 'godClickACost', label: "⚡ Trillion (1T)", cost: store.godClickACost, buy: store.buyGodA, sell: () => store.sellUpgrade('godClickACost', 'perClick', 1e12), minSell: 1e12 },
        { id: 'godClickAACost', label: "🌌 Quadrillion (1Qa)", cost: store.godClickAACost, buy: store.buyGodAA, sell: () => store.sellUpgrade('godClickAACost', 'perClick', 1e15), minSell: 1e15 },
        { id: 'clickSextillionCost', label: "✨ Sextillion (1Sx)", cost: store.clickSextillionCost, buy: store.buySextillion, sell: () => store.sellUpgrade('clickSextillionCost', 'perClick', 1e21), minSell: 1e21 },
        { id: 'clickNonillionCost', label: "💫 Octillion (1e27)", cost: store.clickNonillionCost, buy: store.buyNonillion, sell: () => store.sellUpgrade('clickNonillionCost', 'perClick', 1e27), minSell: 1e27 },
        { id: 'clickDuodecillionCost', label: "🌀 Undécillion (1e36)", cost: store.clickDuodecillionCost, buy: store.buyDuodecillion, sell: () => store.sellUpgrade('clickDuodecillionCost', 'perClick', 1e36), minSell: 1e36 },
        { id: 'clickVigintillionCost', label: "⚛️ Vigintillion (1e63)", cost: store.clickVigintillionCost, buy: store.buyVigintillion, sell: () => store.sellUpgrade('clickVigintillionCost', 'perClick', 1e63), minSell: 1e63, style: {borderColor: '#55efc4'} },
        { id: 'clickTrigintillionCost', label: "🪐 Trigintillion (1e93)", cost: store.clickTrigintillionCost, buy: store.buyTrigintillion, sell: () => store.sellUpgrade('clickTrigintillionCost', 'perClick', 1e93), minSell: 1e93 },
        { id: 'clickGoogolCost', label: "🔥 GOOGOL (1e100)", cost: store.clickGoogolCost, buy: store.buyGoogol, sell: () => store.sellUpgrade('clickGoogolCost', 'perClick', 1e100), minSell: 1e100, style: {borderColor: '#e17055'} },
        { id: 'click1e120Cost', label: "💠 1e120 Clic", cost: store.click1e120Cost, buy: store.buy1e120, sell: () => store.sellUpgrade('click1e120Cost', 'perClick', 1e120), minSell: 1e120 },
        { id: 'clickQuinquagintillionCost', label: "🌀 Quinquagint. (1e153)", cost: store.clickQuinquagintillionCost, buy: store.buyQuinquagintillion, sell: () => store.sellUpgrade('clickQuinquagintillionCost', 'perClick', 1e153), minSell: 1e153 },
        { id: 'click1e180Cost', label: "💠 1e180 Clic", cost: store.click1e180Cost, buy: store.buy1e180, sell: () => store.sellUpgrade('click1e180Cost', 'perClick', 1e180), minSell: 1e180 },
        { id: 'click1e240Cost', label: "💠 1e240 Clic", cost: store.click1e240Cost, buy: store.buy1e240, sell: () => store.sellUpgrade('click1e240Cost', 'perClick', 1e240), minSell: 1e240 },
        { id: 'clickNonagintillionCost', label: "🌌 Nonagintillion (1e273)", cost: store.clickNonagintillionCost, buy: store.buyNonagintillion, sell: () => store.sellUpgrade('clickNonagintillionCost', 'perClick', 1e273), minSell: 1e273 },
        { id: 'click1e300Cost', label: "💠 1e300 Clic", cost: store.click1e300Cost, buy: store.buy1e300, sell: () => store.sellUpgrade('click1e300Cost', 'perClick', 1e300), minSell: 1e300 },
        { id: 'clickCentillionCost', label: "💀 CENTILLION (1e303)", cost: store.clickCentillionCost, buy: store.buyCentillion, sell: null, minSell: 1e303, style: { background: 'black', color: 'gold', border: '2px solid gold' } }
    ];

    // Liste EXHAUSTIVE des upgrades Auto
    const autoUpgrades = [
        { id: 'autoUpgradeCost', label: "🔄 +2 Auto", cost: store.autoUpgradeCost, buy: store.buyAutoUpgrade, sell: () => store.sellUpgrade('autoUpgradeCost', 'perSecond', 2), minSell: 100 },
        { id: 'auto500kCost', label: "⚙️ +500k Auto", cost: store.auto500kCost, buy: store.buyAuto500k, sell: () => store.sellUpgrade('auto500kCost', 'perSecond', 500000), minSell: 4e7 },
        { id: 'auto1mCost', label: "🏭 +1M Auto", cost: store.auto1mCost, buy: store.buyAuto1m, sell: () => store.sellUpgrade('auto1mCost', 'perSecond', 1e6), minSell: 1e8 },
        { id: 'auto10mCost', label: "🏭 +10M Auto", cost: store.auto10mCost, buy: store.buyAuto10m, sell: () => store.sellUpgrade('auto10mCost', 'perSecond', 1e7), minSell: 1e9 },
        { id: 'auto100mCost', label: "🏭 +100M Auto", cost: store.auto100mCost, buy: store.buyAuto100m, sell: () => store.sellUpgrade('auto100mCost', 'perSecond', 1e8), minSell: 1e10 },
        { id: 'auto1bCost', label: "🤖 +1B Auto", cost: store.auto1bCost, buy: store.buyAuto1b, sell: () => store.sellUpgrade('auto1bCost', 'perSecond', 1e9), minSell: 1e11 },
        { id: 'auto10bCost', label: "🤖 +10B Auto", cost: store.auto10bCost, buy: store.buyAuto10b, sell: () => store.sellUpgrade('auto10bCost', 'perSecond', 1e10), minSell: 1e12 },
        { id: 'auto100bCost', label: "🤖 +100B Auto", cost: store.auto100bCost, buy: store.buyAuto100b, sell: () => store.sellUpgrade('auto100bCost', 'perSecond', 1e11), minSell: 1e13 },
        { id: 'godAutoACost', label: "⚡ 1T Auto", cost: store.godAutoACost, buy: store.buyAutoGodA, sell: () => store.sellUpgrade('godAutoACost', 'perSecond', 1e12), minSell: 1e12 },
        { id: 'godAutoAACost', label: "🌌 1Qa Auto", cost: store.godAutoAACost, buy: store.buyAutoGodAA, sell: () => store.sellUpgrade('godAutoAACost', 'perSecond', 1e15), minSell: 1e15 },
        { id: 'autoSextillionCost', label: "✨ 1Sx Auto", cost: store.autoSextillionCost, buy: store.buyAutoSextillion, sell: () => store.sellUpgrade('autoSextillionCost', 'perSecond', 1e21), minSell: 1e21 },
        { id: 'autoNonillionCost', label: "💫 1e27 Auto", cost: store.autoNonillionCost, buy: store.buyAutoNonillion, sell: () => store.sellUpgrade('autoNonillionCost', 'perSecond', 1e27), minSell: 1e27 },
        { id: 'autoDuodecillionCost', label: "🌀 1e36 Auto", cost: store.autoDuodecillionCost, buy: store.buyAutoDuodecillion, sell: () => store.sellUpgrade('autoDuodecillionCost', 'perSecond', 1e36), minSell: 1e36 },
        { id: 'autoGoogolCost', label: "🔥 GOOGOL Auto", cost: store.autoGoogolCost, buy: store.buyAutoGoogol, sell: () => store.sellUpgrade('autoGoogolCost', 'perSecond', 1e100), minSell: 1e100, style: {borderColor: '#e17055'} },
        { id: 'auto1e120Cost', label: "💠 1e120 Auto", cost: store.auto1e120Cost, buy: store.buyAuto1e120, sell: () => store.sellUpgrade('auto1e120Cost', 'perSecond', 1e120), minSell: 1e120 },
        { id: 'auto1e180Cost', label: "💠 1e180 Auto", cost: store.auto1e180Cost, buy: store.buyAuto1e180, sell: () => store.sellUpgrade('auto1e180Cost', 'perSecond', 1e180), minSell: 1e180 },
        { id: 'auto1e240Cost', label: "💠 1e240 Auto", cost: store.auto1e240Cost, buy: store.buyAuto1e240, sell: () => store.sellUpgrade('auto1e240Cost', 'perSecond', 1e240), minSell: 1e240 },
        { id: 'auto1e300Cost', label: "💠 1e300 Auto", cost: store.auto1e300Cost, buy: store.buyAuto1e300, sell: () => store.sellUpgrade('auto1e300Cost', 'perSecond', 1e300), minSell: 1e300 },
        { id: 'autoCentillionCost', label: "💀 CENTILLION Auto", cost: store.autoCentillionCost, buy: store.buyAutoCentillion, sell: null, minSell: 1e303, style: { background: 'black', color: 'gold', border: '2px solid gold' } }
    ];

    // Logique pour bloquer le bouton de vente si l'item n'a pas été acheté
    const isBasePrice = (u) => {
        const factor = store.rebirthCount === 0 ? 1 : (store.rebirthCount + 2);
        return store[u.id] <= (u.minSell * factor);
    };

    // Logique pour n'afficher que les 4 prochaines upgrades disponibles (fenêtre glissante)
    const getVisibleItems = (list) => {
        const factor = (store.rebirthCount + 2);
        const lastPurchasedIndex = list.findLastIndex(u => {
            const basePrice = u.minSell * (store.rebirthCount === 0 ? 1 : factor);
            return store[u.id] > basePrice;
        });
        const startIndex = lastPurchasedIndex === -1 ? 0 : lastPurchasedIndex;
        return list.slice(startIndex, startIndex + 4);
    };

    const nextClickUpgrades = getVisibleItems(clickUpgrades);
    const nextAutoUpgrades = getVisibleItems(autoUpgrades);

    return (
        <div className="page-full bg-shop">
            <div className="game-card" style={{ maxWidth: '900px', width: '95%' }}>
                <h2 style={{ color: '#ff6f61', textAlign: 'center', fontSize: '2.2rem' }}>Boutique de Titouan</h2>

                <div className="stats-box">
                    <div className="stats-row"><span>💰 Score</span> <b>{formatNumber(store.score)}</b></div>
                    <div className="stats-row"><span>👆 / Clic</span> <b>{formatNumber(store.perClick)}</b></div>
                    <div className="stats-row"><span>⏱️ / Sec</span> <b>{formatNumber(store.perSecond)}</b></div>
                </div>

                <h4 style={{ borderLeft: '4px solid #ff7675', paddingLeft: '10px' }}>Améliorations Clics</h4>
                {renderUpgradeRow(
                    "👆 +1 Clic",
                    store.clickUpgradeCost,
                    store.buyClickUpgrade,
                    () => store.sellUpgrade('clickUpgradeCost', 'perClick', 1),
                    store.score < store.clickUpgradeCost,
                    store.clickUpgradeCost <= (50 * (store.rebirthCount === 0 ? 1 : Math.max(1.5, (store.rebirthCount + 2) / 2)))
                )}
                {nextClickUpgrades.map(u => renderUpgradeRow(u.label, u.cost, u.buy, u.sell, store.score < u.cost, isBasePrice(u), u.style))}

                <h4 style={{ borderLeft: '4px solid #74b9ff', paddingLeft: '10px', marginTop: '20px' }}>Automatisation</h4>
                {nextAutoUpgrades.map(u => renderUpgradeRow(u.label, u.cost, u.buy, u.sell, store.score < u.cost, isBasePrice(u), u.style))}

                <h3 style={{ color: '#a29bfe', marginTop: '25px' }}>Puissance Maximale (Multiplicateurs)</h3>
                {store.score >= 1e6 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <button className="upgrade-btn" onClick={store.buyMultX2} disabled={store.score < store.multX2Cost} style={{ background: '#2d3436', color: 'white' }}>⚡ Clic x2 ({formatNumber(store.multX2Cost)})</button>
                        <button className="upgrade-btn" onClick={store.buyAutoMultX2} disabled={store.score < store.autoMultX2Cost} style={{ background: '#2d3436', color: 'white' }}>⚡ Auto x2 ({formatNumber(store.autoMultX2Cost)})</button>
                    </div>
                )}
                {store.score >= 1e7 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        <button className="upgrade-btn" onClick={store.buyUltimateClick} disabled={store.score < store.ultimateClickCost} style={{ background: '#e84393', color: 'white' }}>☄️ ULTIMATE Clic x3 ({formatNumber(store.ultimateClickCost)})</button>
                    </div>
                )}

                <h3 style={{ marginTop: '20px' }}>Compagnons</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Les 5 compagnons complets et fonctionnels */}
                    {!store.catBought ? (
                        <button className="upgrade-btn" onClick={store.buyCatUpgrade} disabled={store.score < store.catUpgradeCost}>🤪 Chat Débile (+{formatNumber(5 * powerMult)}/s) - {formatNumber(store.catUpgradeCost)}</button>
                    ) : <div className="upgrade-btn" style={{opacity: 0.7, background: '#eee', justifyContent: 'center'}}>✅ Chat Débile acquis</div>}

                    {!store.cat2Bought ? (
                        <button className="upgrade-btn" onClick={store.buyCat2Upgrade} disabled={store.score < store.cat2UpgradeCost}>🥷 Chat Ninja (+{formatNumber(60 * powerMult)}/s) - {formatNumber(store.cat2UpgradeCost)}</button>
                    ) : <div className="upgrade-btn" style={{opacity: 0.7, background: '#eee', justifyContent: 'center'}}>✅ Chat Ninja acquis</div>}

                    {!store.volcanBought ? (
                        <button className="upgrade-btn" onClick={store.buyVolcan} disabled={store.score < store.volcanCost}>🔫 Chat Tueur (+{formatNumber(700 * powerMult)}/s) - {formatNumber(store.volcanCost)}</button>
                    ) : <div className="upgrade-btn" style={{opacity: 0.7, background: '#eee', justifyContent: 'center'}}>✅ Chat Tueur acquis</div>}

                    {!store.cat3Bought ? (
                        <button className="upgrade-btn" onClick={store.buyCat3Upgrade} disabled={store.score < store.cat3UpgradeCost}>👑 Roi Chat (+{formatNumber(6000 * powerMult)}/s) - {formatNumber(store.cat3UpgradeCost)}</button>
                    ) : <div className="upgrade-btn" style={{opacity: 0.7, background: '#eee', justifyContent: 'center'}}>✅ Roi Chat acquis</div>}

                    {!store.gooseBought ? (
                        <button className="upgrade-btn" onClick={store.buyGoose} disabled={store.score < store.gooseCost}>🪿 L'Oie d'Or (+{formatNumber(35000 * powerMult)}/s) - {formatNumber(store.gooseCost)}</button>
                    ) : <div className="upgrade-btn" style={{opacity: 0.7, background: '#eee', justifyContent: 'center'}}>✅ L'Oie d'Or acquise</div>}
                </div>

                <div style={{ marginTop: '40px', padding: '25px', border: '5px double gold', borderRadius: '15px', background: '#111' }}>
                    <h2 style={{ color: 'gold', textAlign: 'center' }}>🌟 ASCENSION {store.rebirthCount} / 6</h2>
                    <button className="upgrade-btn" onClick={store.triggerRebirth} disabled={store.score < 1e36} style={{ width: '100%', background: store.score >= 1e36 ? 'gold' : '#444', color: 'black' }}>
                        {store.score >= 1e36 ? "☄️ DÉCLENCHER LE REBIRTH" : `Requis : 1 Undécillion`}
                    </button>
                </div>
            </div>
        </div>
    );
}