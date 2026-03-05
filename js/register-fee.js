/**
 * register-fee.js — TW MM Tournament
 * Weekly / Cup Fee Registration + Coin Deduct
 * 1 coin = 100 MMK
 */

const FEE = {
    weekly: { label: 'Weekly Fee', coins: 5,  mmk: 500,   field: 'week_paid', color: '#00ff88', icon: 'M3 4h18v2H3zM3 10h18v2H3zM3 16h12v2H3z' },
    cup:    { label: 'Cup Fee',    coins: 10, mmk: 1000,  field: 'cup_paid',  color: '#D4AF37', icon: 'M8 21h8M12 21v-5M5 3h14v7a7 7 0 01-14 0V3zM5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9' },
};

window.openRegisterModal = async function(type) {
    const user = auth.currentUser;
    if (!user) return window.showToast("Login အရင်ဝင်ပါ", "error");

    const cfg = FEE[type];
    if (!cfg) return;

    // Load latest user data
    let userData = {};
    try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) userData = doc.data();
    } catch(e) {
        return window.showToast("Data load မရဘူး", "error");
    }

    const coins    = userData.coins ?? 0;
    const alreadyPaid = userData[cfg.field] ?? false;
    const canAfford   = coins >= cfg.coins;
    const isGold      = type === 'cup';

    const holder = document.getElementById('reg-modal-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div class="modal-overlay" id="reg-overlay" onclick="window.closeRegisterModal()">
            <div class="profile-card" onclick="event.stopPropagation()" style="max-width:360px; text-align:left;">

                <!-- Header -->
                <div style="text-align:center; margin-bottom:20px;">
                    <div style="width:56px; height:56px; border-radius:16px; background:${isGold ? 'linear-gradient(135deg,#2a1800,#110a00)' : 'linear-gradient(135deg,#003d1a,#001a0a)'}; border:1.5px solid ${cfg.color}44; display:flex; align-items:center; justify-content:center; margin:0 auto 12px;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${cfg.color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                            <path d="${cfg.icon}"/>
                        </svg>
                    </div>
                    <h3 style="font-family:'Rajdhani',sans-serif; font-size:1.2rem; font-weight:700; color:${cfg.color}; letter-spacing:1px;">${cfg.label}</h3>
                    <p style="font-family:'Share Tech Mono',monospace; font-size:0.62rem; color:var(--dim); letter-spacing:1px; margin-top:4px;">SEASON REGISTRATION</p>
                </div>

                <!-- Fee Info -->
                <div style="background:#000; border-radius:12px; padding:16px; margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border);">
                        <span style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--dim); letter-spacing:1px;">FEE AMOUNT</span>
                        <span style="font-family:'Rajdhani',sans-serif; font-weight:700; font-size:1.1rem; color:${cfg.color};">${cfg.coins} 🪙 <span style="font-size:0.75rem; color:var(--dim);">· ${cfg.mmk.toLocaleString()} ကျပ်</span></span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border);">
                        <span style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--dim); letter-spacing:1px;">YOUR BALANCE</span>
                        <span style="font-family:'Rajdhani',sans-serif; font-weight:700; font-size:1.1rem; color:${canAfford ? 'var(--green)' : 'var(--danger)'};">${coins} 🪙 <span style="font-size:0.75rem; color:var(--dim);">· ${(coins*100).toLocaleString()} ကျပ်</span></span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--dim); letter-spacing:1px;">STATUS</span>
                        ${alreadyPaid
                            ? `<span class="fee-badge badge-paid">✓ ALREADY PAID</span>`
                            : canAfford
                                ? `<span class="fee-badge badge-pending">READY</span>`
                                : `<span class="fee-badge badge-unpaid">INSUFFICIENT</span>`}
                    </div>
                </div>

                <!-- After deduct preview -->
                ${!alreadyPaid && canAfford ? `
                <div style="background:rgba(0,255,136,0.04); border:1px solid rgba(0,255,136,0.1); border-radius:10px; padding:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-family:'Share Tech Mono',monospace; font-size:0.62rem; color:var(--dim); letter-spacing:1px;">AFTER PAYMENT</span>
                    <span style="font-family:'Rajdhani',sans-serif; font-weight:700; color:var(--text);">${coins - cfg.coins} 🪙 <span style="font-size:0.7rem; color:var(--dim);">· ${((coins - cfg.coins)*100).toLocaleString()} ကျပ်</span></span>
                </div>` : ''}

                <!-- Insufficient warning -->
                ${!canAfford && !alreadyPaid ? `
                <div style="background:rgba(255,77,77,0.06); border:1px solid rgba(255,77,77,0.2); border-radius:10px; padding:12px; margin-bottom:16px;">
                    <p style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:#ff6b6b; letter-spacing:0.5px; line-height:1.6;">
                        Coin မလုံလောက်ပါ။<br>Admin ထံ ဆက်သွယ်ပြီး Coin တင်ပေးပါ။<br>
                        <span style="color:var(--dim);">လိုအပ်သည်: ${cfg.coins} 🪙 · ${cfg.mmk.toLocaleString()} ကျပ်</span>
                    </p>
                </div>` : ''}

                <!-- Buttons -->
                ${alreadyPaid ? `
                    <button onclick="window.closeRegisterModal()" class="primary-btn" style="background:var(--card2); color:var(--dim); border:1px solid var(--border);">CLOSE</button>
                ` : canAfford ? `
                    <button onclick="window.confirmRegister('${type}')" class="primary-btn" id="confirm-reg-btn" style="background:${cfg.color}; color:#000; margin-bottom:8px;">
                        ✓ CONFIRM & PAY ${cfg.coins} 🪙
                    </button>
                    <button onclick="window.closeRegisterModal()" class="close-btn">CANCEL</button>
                ` : `
                    <button onclick="window.closeRegisterModal()" class="close-btn">CLOSE</button>
                `}

            </div>
        </div>
    `;
};

window.confirmRegister = async function(type) {
    const user = auth.currentUser;
    if (!user) return;

    const cfg = FEE[type];
    const btn = document.getElementById('confirm-reg-btn');
    if (btn) { btn.disabled = true; btn.innerText = 'Processing...'; }

    try {
        // Load fresh data
        const docRef = db.collection("users").doc(user.uid);
        const snap   = await docRef.get();
        if (!snap.exists) throw new Error("User data မတွေ့ပါ");

        const data  = snap.data();
        const coins = data.coins ?? 0;

        if (coins < cfg.coins) throw new Error("Coin မလုံလောက်ပါ");
        if (data[cfg.field])   throw new Error(`${cfg.label} ပြီးသားပါ`);

        // Firestore transaction
        await db.runTransaction(async tx => {
            const fresh = await tx.get(docRef);
            const cur   = fresh.data().coins ?? 0;
            if (cur < cfg.coins) throw new Error("Coin မလုံလောက်ပါ");

            tx.update(docRef, {
                coins:        cur - cfg.coins,
                [cfg.field]:  true,
            });

            // Transaction log
            tx.set(db.collection("tw_transactions").doc(), {
                uid:          user.uid,
                manager_name: data.manager_name || '',
                type:         type,
                label:        cfg.label,
                coins:        cfg.coins,
                mmk:          cfg.mmk,
                created_at:   firebase.firestore.FieldValue.serverTimestamp(),
            });
        });

        window.closeRegisterModal();
        window.showToast(`${cfg.label} ပေးဆောင်ပြီးပါပြီ! ✅`, "success");

        // Refresh home
        if (window.currentTab === 'home') window.renderHome();

    } catch(e) {
        window.showToast(e.message, "error");
        if (btn) { btn.disabled = false; btn.innerText = `✓ CONFIRM & PAY ${cfg.coins} 🪙`; }
    }
};

window.closeRegisterModal = function() {
    const h = document.getElementById('reg-modal-holder');
    if (h) h.innerHTML = '';
};
