/**
 * register-fee.js — TW MM Tournament
 * Weekly / Cup Fee Registration + Coin Deduct
 * Sub-collection: tw_registrations/weekly/gw_30/{uid}
 *                 tw_registrations/cup/season_13/{uid}
 */

const FEE = {
    weekly: { label: 'Weekly Fee', coins: 10, mmk: 1000, field: 'week_paid', color: '#7dd8ff', icon: 'M3 4h18v2H3zM3 10h18v2H3zM3 16h12v2H3z' },
    cup:    { label: 'Cup Fee',    coins: 50, mmk: 5000, field: 'cup_paid',  color: '#c4a0ff', icon: 'M8 21h8M12 21v-5M5 3h14v7a7 7 0 01-14 0V3zM5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9' },
};

// ── Helper: get config from Firebase ──────────────────────────
async function getConfig() {
    let currentGw = 30, currentSeason = 13;
    let weeklyOpen = true, cupOpen = true;
    try {
        const cfgDoc = await db.collection('tw_config').doc('settings').get();
        if (cfgDoc.exists) {
            const s       = cfgDoc.data();
            currentGw     = s.current_gw     ?? 30;
            currentSeason = s.current_season ?? 13;
            weeklyOpen    = s.weekly_open    !== false;
            cupOpen       = s.cup_open       !== false;
        }
    } catch(e) {}
    return { currentGw, currentSeason, weeklyOpen, cupOpen };
}

// ── Sub-collection path helper ─────────────────────────────────
function getRegRef(type, uid, currentGw, currentSeason) {
    if (type === 'weekly') {
        return db.collection('tw_registrations')
                 .doc('weekly')
                 .collection('gw_' + currentGw)
                 .doc(uid);
    } else {
        return db.collection('tw_registrations')
                 .doc('cup')
                 .collection('season_' + currentSeason)
                 .doc(uid);
    }
}

// ── Open Modal ─────────────────────────────────────────────────
window.openRegisterModal = async function(type) {
    const user = auth.currentUser;
    if (!user) return window.showToast('Login အရင်ဝင်ပါ', 'error');

    const cfg = FEE[type];
    if (!cfg) return;

    const { currentGw, currentSeason, weeklyOpen, cupOpen } = await getConfig();
    const isOpen = type === 'weekly' ? weeklyOpen : cupOpen;

    if (!isOpen) {
        return window.showToast(
            (type === 'weekly' ? 'Weekly' : 'Cup') + ' Registration ပိတ်ထားပါသည်',
            'error'
        );
    }

    const regLabel = type === 'weekly' ? 'GW' + currentGw : 'Season ' + currentSeason;

    // Load user data
    let userData = {};
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) userData = doc.data();
    } catch(e) {
        return window.showToast('Data load မရဘူး', 'error');
    }

    const coins      = userData.coins ?? 0;
    const alreadyPaid = userData[cfg.field] ?? false;
    const canAfford   = coins >= cfg.coins;
    const isGold      = type === 'cup';

    const holder = document.getElementById('reg-modal-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div class="modal-overlay" id="reg-overlay" onclick="window.closeRegisterModal()">
            <div onclick="event.stopPropagation()" style="
                background:#0e0018;
                border-radius:20px 20px 0 0;
                width:100%; max-width:480px;
                border:1px solid rgba(255,255,255,0.1);
                border-bottom:none;
                padding:20px 18px 36px;
                animation:slideUp 0.3s ease;
            ">
                <!-- Drag bar -->
                <div style="width:40px;height:4px;background:rgba(255,255,255,0.15);border-radius:4px;margin:0 auto 20px;"></div>

                <!-- Header -->
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="width:56px;height:56px;border-radius:16px;
                        background:${isGold ? 'rgba(196,160,255,0.1)' : 'rgba(80,190,255,0.1)'};
                        border:1.5px solid ${cfg.color}44;
                        display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="${cfg.color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <path d="${cfg.icon}"/>
                        </svg>
                    </div>
                    <h3 style="font-family:'Rajdhani',sans-serif;font-size:1.2rem;font-weight:700;
                        color:${cfg.color};letter-spacing:1px;">${cfg.label}</h3>
                    <p style="font-family:'Barlow Condensed',sans-serif;font-size:0.8rem;
                        color:${cfg.color};letter-spacing:2px;font-weight:700;margin-top:4px;
                        opacity:0.7;">${regLabel} REGISTRATION</p>
                </div>

                <!-- Fee Info -->
                <div style="background:rgba(0,0,0,0.4);border-radius:12px;padding:16px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;
                        margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                        <span style="font-size:0.65rem;color:var(--dim);letter-spacing:1px;">FEE AMOUNT</span>
                        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
                            font-size:1.1rem;color:${cfg.color};">
                            ${cfg.coins} 🪙
                            <span style="font-size:0.75rem;color:var(--dim);">· ${cfg.mmk.toLocaleString()} ကျပ်</span>
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;
                        margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                        <span style="font-size:0.65rem;color:var(--dim);letter-spacing:1px;">YOUR BALANCE</span>
                        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
                            font-size:1.1rem;color:${canAfford ? '#7dd8ff' : '#f87171'};">
                            ${coins} 🪙
                            <span style="font-size:0.75rem;color:var(--dim);">· ${(coins*100).toLocaleString()} ကျပ်</span>
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:0.65rem;color:var(--dim);letter-spacing:1px;">STATUS</span>
                        ${alreadyPaid
                            ? `<span class="fee-badge badge-paid">✓ ALREADY PAID</span>`
                            : canAfford
                                ? `<span class="fee-badge badge-pending">READY</span>`
                                : `<span class="fee-badge badge-unpaid">INSUFFICIENT</span>`}
                    </div>
                </div>

                <!-- After payment preview -->
                ${!alreadyPaid && canAfford ? `
                <div style="background:rgba(80,190,255,0.06);border:1px solid rgba(80,190,255,0.15);
                    border-radius:10px;padding:12px;margin-bottom:12px;
                    display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:0.62rem;color:var(--dim);letter-spacing:1px;">AFTER PAYMENT</span>
                    <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;color:var(--text);">
                        ${coins - cfg.coins} 🪙
                        <span style="font-size:0.7rem;color:var(--dim);">· ${((coins-cfg.coins)*100).toLocaleString()} ကျပ်</span>
                    </span>
                </div>` : ''}

                <!-- Insufficient -->
                ${!canAfford && !alreadyPaid ? `
                <div style="background:rgba(255,77,77,0.06);border:1px solid rgba(255,77,77,0.2);
                    border-radius:10px;padding:14px;margin-bottom:12px;">
                    <p style="font-size:0.65rem;color:#ff6b6b;letter-spacing:0.5px;line-height:1.8;margin-bottom:12px;">
                        Coin မလုံလောက်ပါ။ Admin ထံ ဆက်သွယ်ပြီး Coin ဝယ်ပါ။<br>
                        <span style="color:var(--dim);">လိုအပ်သည်: ${cfg.coins} 🪙 · ${cfg.mmk.toLocaleString()} ကျပ်</span>
                    </p>
                    <div style="display:flex;gap:8px;">
                        <a href="${window.TW_CONTACTS?.facebook || 'https://m.me/'}" target="_blank"
                            style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
                            background:#1877f2;border-radius:10px;padding:10px 8px;
                            text-decoration:none;font-family:'Rajdhani',sans-serif;
                            font-weight:700;font-size:0.85rem;color:#fff;">
                            Messenger
                        </a>
                        <a href="${window.TW_CONTACTS?.telegram || 'https://t.me/'}" target="_blank"
                            style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
                            background:#229ED9;border-radius:10px;padding:10px 8px;
                            text-decoration:none;font-family:'Rajdhani',sans-serif;
                            font-weight:700;font-size:0.85rem;color:#fff;">
                            Telegram
                        </a>
                    </div>
                </div>` : ''}

                <!-- Action buttons -->
                ${alreadyPaid
                    ? `<button onclick="window.closeRegisterModal()" class="primary-btn"
                        style="background:var(--card2);color:var(--dim);border:1px solid var(--border);">
                        CLOSE
                       </button>`
                    : canAfford
                        ? `<button onclick="window.confirmRegister('${type}',${currentGw},${currentSeason})"
                            class="primary-btn" id="confirm-reg-btn"
                            style="background:${cfg.color};color:#000;font-weight:900;margin-bottom:8px;">
                            ✓ CONFIRM & PAY ${cfg.coins} 🪙
                           </button>
                           <button onclick="window.closeRegisterModal()" class="close-btn">CANCEL</button>`
                        : `<button onclick="window.closeRegisterModal()" class="close-btn">CLOSE</button>`
                }
            </div>
        </div>
    `;
};

// ── Confirm & Pay ──────────────────────────────────────────────
window.confirmRegister = async function(type, currentGw, currentSeason) {
    const user = auth.currentUser;
    if (!user) return;

    const cfg = FEE[type];
    const btn = document.getElementById('confirm-reg-btn');
    if (btn) { btn.disabled = true; btn.innerText = 'Processing...'; }

    try {
        const docRef = db.collection('users').doc(user.uid);
        const snap   = await docRef.get();
        if (!snap.exists) throw new Error('User data မတွေ့ပါ');

        const data  = snap.data();
        const coins = data.coins ?? 0;

        if (coins < cfg.coins)  throw new Error('Coin မလုံလောက်ပါ');
        if (data[cfg.field])    throw new Error(cfg.label + ' ပြီးသားပါ');

        // Sub-collection ref
        const regRef = getRegRef(type, user.uid, currentGw, currentSeason);

        await db.runTransaction(async tx => {
            const fresh = await tx.get(docRef);
            const cur   = fresh.data().coins ?? 0;
            if (cur < cfg.coins) throw new Error('Coin မလုံလောက်ပါ');

            // Deduct coins + set paid flag
            tx.update(docRef, {
                coins:       cur - cfg.coins,
                [cfg.field]: true,
            });

            // Transaction log
            tx.set(db.collection('tw_transactions').doc(), {
                uid:          user.uid,
                manager_name: data.manager_name || '',
                team_name:    data.team_name    || '',
                type:         type,
                label:        cfg.label,
                coins:        cfg.coins,
                mmk:          cfg.mmk,
                gw:           type === 'weekly' ? currentGw    : null,
                season:       type === 'cup'    ? currentSeason : null,
                created_at:   firebase.firestore.FieldValue.serverTimestamp(),
            });

            // Registration record — sub-collection
            tx.set(regRef, {
                uid:          user.uid,
                manager_name: data.manager_name  || '',
                team_name:    data.team_name      || '',
                facebook:     data.facebook_name  || '',
                type:         type,
                label:        cfg.label,
                coins:        cfg.coins,
                mmk:          cfg.mmk,
                gw:           type === 'weekly' ? currentGw    : null,
                season:       type === 'cup'    ? currentSeason : null,
                status:       'confirmed',
                registered_at: firebase.firestore.FieldValue.serverTimestamp(),
            });
        });

        window.closeRegisterModal();
        window.showToast(cfg.label + ' ပေးဆောင်ပြီးပါပြီ! ✅', 'success');
        if (window.currentTab === 'home') window.renderHome();

    } catch(e) {
        window.showToast(e.message, 'error');
        if (btn) { btn.disabled = false; btn.innerText = '✓ CONFIRM & PAY ' + cfg.coins + ' 🪙'; }
    }
};

// ── Close Modal ────────────────────────────────────────────────
window.closeRegisterModal = function() {
    const h = document.getElementById('reg-modal-holder');
    if (h) h.innerHTML = '';
};
