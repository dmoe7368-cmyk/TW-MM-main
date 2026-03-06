/**
 * home.js — TW MM Tournament
 * Fee Status + Register + Members List
 * Weekly = 1,000 ကျပ် | Cup = 5,000 ကျပ်
 */

// ── Fee Config ─────────────────────────────────────────────────────────────────
const FEE = {
    weekly: {
        label: 'Weekly Fee', coins: 10, mmk: 1000,
        field: 'week_paid', color: '#00ff88',
        icon: 'M3 4h18v2H3zM3 10h18v2H3zM3 16h12v2H3z'
    },
    cup: {
        label: 'Cup Fee', coins: 50, mmk: 5000,
        field: 'cup_paid', color: '#00ff88',
        icon: 'M8 21h8M12 21v-5M5 3h14v7a7 7 0 01-14 0V3zM5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9'
    },
};

// ── Render Home ────────────────────────────────────────────────────────────────
window.renderHome = async function() {
    const main = document.getElementById('main-root');
    const user = auth.currentUser;

    main.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    // Load user data + remote config in parallel
    let userData = null;
    let regConfig = { weekly_open: true, cup_open: true }; // default open

    const promises = [];

    if (user) {
        promises.push(
            db.collection("users").doc(user.uid).get()
              .then(doc => { if (doc.exists) userData = doc.data(); })
              .catch(e => console.error(e))
        );
    }

    promises.push(
        db.collection("tw_config").doc("settings").get()
          .then(doc => { if (doc.exists) regConfig = { ...regConfig, ...doc.data() }; })
          .catch(() => {}) // fail silently — default open
    );

    await Promise.all(promises);

    main.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 14px 30px;">
            ${user ? buildFeeStatus(userData, regConfig) : buildLoginPrompt(regConfig)}
            ${buildMembersSection()}
            ${buildNewsSection()}
        </div>
        <div id="reg-modal-holder"></div>
    `;

    loadNews();
    loadMembers();

    if (user) {
        db.collection("users").doc(user.uid).onSnapshot(snap => {
            if (!snap.exists) return;
            updateFeeCards(snap.data());
            const hc = document.getElementById('header-coins');
            if (hc) hc.innerText = snap.data().coins ?? 0;
        });
    }
};

// ── Fee Status (logged in) ─────────────────────────────────────────────────────
function buildFeeStatus(d, cfg) {
    const weekPaid   = d?.week_paid ?? false;
    const cupPaid    = d?.cup_paid  ?? false;
    const weeklyOpen = cfg?.weekly_open !== false;
    const cupOpen    = cfg?.cup_open    !== false;

    const weeklyBtn = weeklyOpen
        ? `<button class="reg-btn weekly" onclick="window.openRegisterModal('weekly')">
                <span class="reg-btn-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </span>
                <span class="reg-btn-label">Register</span>
                <span class="reg-btn-name">Weekly</span>
                <span class="reg-btn-fee">1,000 ကျပ်</span>
           </button>`
        : `<div style="flex:1;background:var(--card2);border:1px solid var(--border);
                border-radius:14px;padding:16px;text-align:center;opacity:0.7;">
                <div style="font-size:1.2rem;margin-bottom:4px;">🔒</div>
                <div style="font-family:'Rajdhani',sans-serif;font-weight:800;font-size:0.85rem;
                             color:var(--dim);">WEEKLY CLOSED</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;color:var(--border);margin-top:2px;">
                    Registration ပိတ်ထားသည်
                </div>
           </div>`;

    const cupBtn = cupOpen
        ? `<button class="reg-btn cup" onclick="window.openRegisterModal('cup')">
                <span class="reg-btn-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                        <path d="M8 21h8M12 21v-5"/><path d="M5 3h14v7a7 7 0 01-14 0V3z"/>
                        <path d="M5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9"/>
                    </svg>
                </span>
                <span class="reg-btn-label">Register</span>
                <span class="reg-btn-name">Cup</span>
                <span class="reg-btn-fee">5,000 ကျပ်</span>
           </button>`
        : `<div style="flex:1;background:var(--card2);border:1px solid var(--border);
                border-radius:14px;padding:16px;text-align:center;opacity:0.7;">
                <div style="font-size:1.2rem;margin-bottom:4px;">🔒</div>
                <div style="font-family:'Rajdhani',sans-serif;font-weight:800;font-size:0.85rem;
                             color:var(--dim);">CUP CLOSED</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;color:var(--border);margin-top:2px;">
                    Registration ပိတ်ထားသည်
                </div>
           </div>`;

    return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;
                          color:var(--green);">📋 MY FEE STATUS</span>
        </div>
        <div class="fee-grid" id="fee-grid">
            ${buildFeeCard('week', weekPaid, 'Weekly', '1,000')}
            ${buildFeeCard('cup',  cupPaid,  'Cup',    '5,000')}
        </div>

        <div style="display:flex;align-items:center;gap:10px;margin:16px 0 12px;">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;
                          color:var(--green);">🎯 REGISTER NOW</span>
        </div>
        <div class="reg-grid">
            ${weeklyBtn}
            ${cupBtn}
        </div>
    `;
}

function buildFeeCard(id, paid, label, mmk) {
    const icon = paid
        ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const badge = paid
        ? `<span class="fee-badge badge-paid">PAID</span>`
        : `<span class="fee-badge badge-unpaid">UNPAID</span>`;
    return `
        <div class="fee-card ${paid?'paid':'unpaid'}" id="fee-card-${id}">
            <div class="fee-status-icon">${icon}</div>
            <div class="fee-label">${label.toUpperCase()}</div>
            <div class="fee-type" style="font-family:'Rajdhani',sans-serif;font-size:0.85rem;
                 font-weight:700;color:var(--green);">${mmk} ကျပ်</div>
            <div style="margin-top:6px;">${badge}</div>
        </div>`;
}

function updateFeeCards(d) {
    const grid = document.getElementById('fee-grid');
    if (!grid) return;
    grid.innerHTML =
        buildFeeCard('week', d.week_paid ?? false, 'Weekly', '1,000') +
        buildFeeCard('cup',  d.cup_paid  ?? false, 'Cup',    '5,000');
}

// ── Login Prompt (not logged in) ───────────────────────────────────────────────
function buildLoginPrompt(cfg) {
    const weeklyOpen = cfg?.weekly_open !== false;
    const cupOpen    = cfg?.cup_open    !== false;
    const weeklyText = weeklyOpen
        ? `Weekly <span style="color:var(--green);font-weight:700;">1,000 ကျပ်</span>`
        : `Weekly <span style="color:var(--dim);font-weight:700;">🔒 CLOSED</span>`;
    const cupText = cupOpen
        ? `Cup <span style="color:var(--green);font-weight:700;">5,000 ကျပ်</span>`
        : `Cup <span style="color:var(--dim);font-weight:700;">🔒 CLOSED</span>`;
    return `
        <div style="background:var(--card);border:1px solid rgba(0,255,136,0.15);
                    border-radius:14px;padding:14px 16px;margin-bottom:16px;
                    display:flex;align-items:center;gap:12px;">
            <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;
                         background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);
                         display:flex;align-items:center;justify-content:center;color:var(--green);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div style="flex:1;">
                <div style="font-family:'Rajdhani',sans-serif;font-weight:800;font-size:0.95rem;
                             color:var(--text);">Fee Status ကြည့်ဖို့ Login ဝင်ပါ</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:0.78rem;color:var(--dim);margin-top:2px;">
                    ${weeklyText} &nbsp;·&nbsp; ${cupText}
                </div>
            </div>
            <button onclick="window.renderAuthUI()" class="primary-btn"
                    style="flex-shrink:0;padding:8px 18px;font-size:0.85rem;border-radius:8px;">
                LOGIN
            </button>
        </div>
    `;
}

// ── Members Section ────────────────────────────────────────────────────────────
function buildMembersSection() {
    return `
        <div style="display:flex;align-items:center;gap:10px;margin:4px 0 12px;">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;
                          color:var(--green);">👥 REGISTERED MEMBERS</span>
        </div>
        <div style="display:flex;background:#000;padding:4px;border-radius:40px;
                    margin-bottom:14px;border:1px solid var(--border);">
            <button id="mem-tab-weekly" onclick="switchMemberTab('weekly')"
                style="flex:1;padding:10px;border-radius:40px;border:none;
                       background:var(--green);color:#000;
                       font-family:'Rajdhani',sans-serif;font-weight:800;
                       font-size:0.9rem;cursor:pointer;letter-spacing:1px;transition:0.2s;">
                📅 WEEKLY
            </button>
            <button id="mem-tab-cup" onclick="switchMemberTab('cup')"
                style="flex:1;padding:10px;border-radius:40px;border:none;
                       background:transparent;color:var(--dim);
                       font-family:'Rajdhani',sans-serif;font-weight:800;
                       font-size:0.9rem;cursor:pointer;letter-spacing:1px;transition:0.2s;">
                🏆 CUP
            </button>
        </div>
        <div id="members-list">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
}

window._memberTab = 'weekly';

window.switchMemberTab = function(type) {
    window._memberTab = type;
    const isW = type === 'weekly';
    const tw  = document.getElementById('mem-tab-weekly');
    const tc  = document.getElementById('mem-tab-cup');
    if (tw) { tw.style.background = isW ? 'var(--green)' : 'transparent'; tw.style.color = isW ? '#000' : 'var(--dim)'; }
    if (tc) { tc.style.background = !isW ? 'var(--green)' : 'transparent'; tc.style.color = !isW ? '#000' : 'var(--dim)'; }
    loadMembers(type);
};

function loadMembers(type) {
    const t    = type || window._memberTab || 'weekly';
    const list = document.getElementById('members-list');
    if (!list) return;
    list.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    db.collection("tw_registrations")
        .where("type", "==", t)
        .orderBy("registered_at", "desc")
        .get()
        .then(snap => {
            const el = document.getElementById('members-list');
            if (!el) return;
            if (snap.empty) {
                el.innerHTML = `<div class="glow-card" style="text-align:center;padding:24px;color:var(--dim);">
                    <p style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;">
                        ${t==='weekly'?'Weekly':'Cup'} Register မရှိသေးပါ
                    </p></div>`;
                return;
            }
            const color = 'var(--green)';
            const total = snap.docs.length;
            el.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <div style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.25);
                                border-radius:20px;padding:4px 14px;
                                font-family:'Rajdhani',sans-serif;font-size:0.8rem;
                                font-weight:700;color:var(--green);letter-spacing:1px;">
                        ${total} MEMBERS
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${snap.docs.map((doc,i) => {
                        const d    = doc.data();
                        const time = d.registered_at
                            ? new Date(d.registered_at.seconds*1000)
                                .toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
                            : '';
                        const init = (d.manager_name||'?').charAt(0).toUpperCase();
                        return `
                        <div style="background:var(--card);border-radius:12px;padding:12px 14px;
                                    display:flex;align-items:center;gap:12px;
                                    border:1px solid var(--border);position:relative;overflow:hidden;">
                            <div style="position:absolute;left:0;top:0;bottom:0;width:3px;
                                         background:var(--green);opacity:0.5;"></div>
                            <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;
                                         color:var(--dim);width:20px;text-align:center;flex-shrink:0;
                                         font-weight:700;">${i+1}</div>
                            <div style="width:38px;height:38px;border-radius:50%;flex-shrink:0;
                                         background:rgba(0,255,136,0.06);
                                         border:1.5px solid rgba(0,255,136,0.25);
                                         display:flex;align-items:center;justify-content:center;
                                         font-family:'Rajdhani',sans-serif;font-weight:800;
                                         font-size:1rem;color:var(--green);">${init}</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-family:'Rajdhani',sans-serif;font-weight:800;
                                             font-size:0.95rem;color:var(--text);
                                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${d.manager_name||'Unknown'}
                                </div>
                                <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;
                                             color:var(--dim);margin-top:2px;
                                             white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                    ${d.team_name||''}
                                </div>
                            </div>
                            <div style="text-align:right;flex-shrink:0;">
                                <span class="fee-badge badge-paid">✓ PAID</span>
                                <div style="font-family:'Rajdhani',sans-serif;font-size:0.65rem;
                                             color:var(--dim);margin-top:4px;">${time}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        })
        .catch(err => {
            const el = document.getElementById('members-list');
            if (el) el.innerHTML = `<div style="color:#ff4d4d;text-align:center;padding:16px;
                font-family:'Rajdhani',sans-serif;font-size:0.85rem;">${err.message}</div>`;
        });
}

// ── News Section ───────────────────────────────────────────────────────────────
function buildNewsSection() {
    return `
        <div style="display:flex;align-items:center;gap:10px;margin:16px 0 12px;">
            <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;
                          color:var(--green);">📰 LATEST NEWS</span>
        </div>
        <div id="news-list">
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
}

function loadNews() {
    db.collection("tw_news")
        .orderBy("created_at","desc")
        .limit(20)
        .get()
        .then(snap => {
            const list = document.getElementById('news-list');
            if (!list) return;
            if (snap.empty) {
                list.innerHTML = `<div class="glow-card" style="text-align:center;padding:30px;color:var(--dim);">
                    <p style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;">သတင်းများ မရှိသေးပါ</p></div>`;
                return;
            }
            list.innerHTML = snap.docs.map(doc => buildNewsCard(doc.data())).join('');
        })
        .catch(err => {
            const list = document.getElementById('news-list');
            if (list) list.innerHTML = `<div style="color:#ff4d4d;text-align:center;padding:20px;
                font-family:'Rajdhani',sans-serif;font-size:0.85rem;">${err.message}</div>`;
        });
}

function buildNewsCard(p) {
    const isGold = p.type === 'announcement';
    const time   = p.created_at
        ? new Date(p.created_at.seconds*1000)
            .toLocaleDateString('my-MM',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
        : 'Just now';
    const tagLabel = {
        announcement: '📢 ANNOUNCEMENT',
        weekly:       '📅 WEEKLY UPDATE',
        photo:        '📸 PHOTO',
        result:       '🏅 RESULT',
    }[p.type] || '📰 NEWS';
    const imgHtml = p.image_url
        ? `<div class="news-img-placeholder"><img src="${p.image_url}" alt="news" onerror="this.parentElement.innerHTML='📸'"></div>`
        : '';
    return `
        <div class="glow-card ${isGold?'gold-glow':''}">
            <span class="news-tag ${isGold?'gold':''}">${tagLabel}</span>
            ${imgHtml}
            <div class="news-title">${p.title||''}</div>
            ${p.body?`<div class="news-body" style="margin-top:6px;">${p.body}</div>`:''}
            <div class="news-meta">
                <span style="display:flex;align-items:center;gap:5px;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    ${p.author||'Admin TW'}
                </span>
                <span>${time}</span>
            </div>
        </div>`;
}

// ── Register Modal ─────────────────────────────────────────────────────────────
window.openRegisterModal = async function(type) {
    const user = auth.currentUser;
    if (!user) return window.showToast("Login အရင်ဝင်ပါ","error");
    const cfg = FEE[type];
    if (!cfg) return;

    // Double-check registration is still open (prevent button bypass)
    try {
        const configDoc = await db.collection("tw_config").doc("settings").get();
        if (configDoc.exists) {
            const s = configDoc.data();
            const field = type === 'weekly' ? 'weekly_open' : 'cup_open';
            if (s[field] === false) {
                return window.showToast("Registration ပိတ်ထားသည် 🔒", "error");
            }
        }
    } catch(e) {} // fail open if config unreachable

    let userData = {};
    try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) userData = doc.data();
    } catch(e) { return window.showToast("Data load မရဘူး","error"); }

    const coins       = userData.coins ?? 0;
    const alreadyPaid = userData[cfg.field] ?? false;
    const canAfford   = coins >= cfg.coins;
    const holder      = document.getElementById('reg-modal-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div class="modal-overlay" id="reg-overlay" onclick="window.closeRegisterModal()">
            <div class="profile-card" onclick="event.stopPropagation()" style="max-width:360px;">
                <div style="text-align:center;margin-bottom:18px;">
                    <h3 style="font-family:'Rajdhani',sans-serif;font-size:1.2rem;font-weight:900;
                                color:var(--green);letter-spacing:1px;">${cfg.label}</h3>
                </div>
                <div style="background:#000;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:var(--dim);font-weight:700;">FEE AMOUNT</span>
                        <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;color:var(--green);">
                            ${cfg.mmk.toLocaleString()} ကျပ်
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;
                                margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:var(--dim);font-weight:700;">YOUR COINS</span>
                        <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.1rem;
                                     color:${canAfford?'var(--green)':'#ff4d4d'};">
                            ${coins} 🪙
                            <span style="font-size:0.75rem;color:var(--dim);font-weight:600;">
                                · ${(coins*100).toLocaleString()} ကျပ်
                            </span>
                        </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:var(--dim);font-weight:700;">STATUS</span>
                        ${alreadyPaid
                            ? `<span class="fee-badge badge-paid">✓ ALREADY PAID</span>`
                            : canAfford
                                ? `<span class="fee-badge badge-pending">READY</span>`
                                : `<span class="fee-badge badge-unpaid">INSUFFICIENT</span>`}
                    </div>
                </div>

                ${!alreadyPaid && canAfford ? `
                <div style="background:rgba(0,255,136,0.04);border:1px solid rgba(0,255,136,0.1);
                             border-radius:10px;padding:12px;margin-bottom:16px;
                             display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:var(--dim);font-weight:700;">AFTER PAYMENT</span>
                    <span style="font-family:'Rajdhani',sans-serif;font-weight:900;color:var(--text);">
                        ${coins-cfg.coins} 🪙
                        <span style="font-size:0.75rem;color:var(--dim);font-weight:600;">
                            · ${((coins-cfg.coins)*100).toLocaleString()} ကျပ်
                        </span>
                    </span>
                </div>` : ''}

                ${!canAfford && !alreadyPaid ? `
                <div style="background:rgba(255,77,77,0.06);border:1px solid rgba(255,77,77,0.2);
                             border-radius:10px;padding:14px;margin-bottom:16px;">
                    <p style="font-family:'Rajdhani',sans-serif;font-size:0.85rem;color:#ff6b6b;
                               font-weight:700;margin-bottom:10px;">
                        Coin မလုံလောက်ပါ။ Admin ထံ ဆက်သွယ်ပြီး Coin ဝယ်ပါ။
                    </p>
                    <div style="display:flex;gap:8px;">
                        <a href="${window.TW_CONTACTS?.telegram||'#'}" target="_blank"
                           style="flex:1;display:flex;align-items:center;justify-content:center;gap:7px;
                                  background:#229ED9;border-radius:10px;padding:10px;
                                  text-decoration:none;font-family:'Rajdhani',sans-serif;
                                  font-weight:800;font-size:0.9rem;color:#fff;">
                            Telegram
                        </a>
                    </div>
                </div>` : ''}

                ${alreadyPaid
                    ? `<button onclick="window.closeRegisterModal()" class="primary-btn"
                               style="background:var(--card2);color:var(--dim);border:1px solid var(--border);">CLOSE</button>`
                    : canAfford
                        ? `<button onclick="window.confirmRegister('${type}')" class="primary-btn"
                                   id="confirm-reg-btn" style="margin-bottom:8px;">
                               ✓ PAY ${cfg.mmk.toLocaleString()} ကျပ်
                           </button>
                           <button onclick="window.closeRegisterModal()" class="close-btn">CANCEL</button>`
                        : `<button onclick="window.closeRegisterModal()" class="close-btn">CLOSE</button>`}
            </div>
        </div>`;
};

window.confirmRegister = async function(type) {
    const user = auth.currentUser;
    if (!user) return;
    const cfg = FEE[type];
    const btn = document.getElementById('confirm-reg-btn');
    if (btn) { btn.disabled=true; btn.innerText='Processing...'; }

    try {
        const docRef = db.collection("users").doc(user.uid);
        const snap   = await docRef.get();
        if (!snap.exists) throw new Error("User data မတွေ့ပါ");
        const data   = snap.data();
        const coins  = data.coins ?? 0;
        if (coins < cfg.coins)  throw new Error("Coin မလုံလောက်ပါ");
        if (data[cfg.field])    throw new Error(`${cfg.label} ပြီးသားပါ`);

        await db.runTransaction(async tx => {
            const fresh = await tx.get(docRef);
            const cur   = fresh.data().coins ?? 0;
            if (cur < cfg.coins) throw new Error("Coin မလုံလောက်ပါ");
            tx.update(docRef, { coins: cur-cfg.coins, [cfg.field]: true });
            tx.set(db.collection("tw_transactions").doc(), {
                uid: user.uid, manager_name: data.manager_name||'',
                team_name: data.team_name||'', type, label: cfg.label,
                coins: cfg.coins, mmk: cfg.mmk,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
            });
            tx.set(db.collection("tw_registrations").doc(`${type}_${user.uid}`), {
                uid: user.uid, manager_name: data.manager_name||'',
                team_name: data.team_name||'', facebook: data.facebook_name||'',
                type, label: cfg.label, coins: cfg.coins, mmk: cfg.mmk,
                status: "confirmed",
                registered_at: firebase.firestore.FieldValue.serverTimestamp(),
            });
        });

        window.closeRegisterModal();
        window.showToast(`${cfg.label} ပေးဆောင်ပြီးပါပြီ! ✅`,"success");
        if (window.currentTab==='home') window.renderHome();

    } catch(e) {
        window.showToast(e.message,"error");
        if (btn) { btn.disabled=false; btn.innerText=`✓ PAY ${cfg.mmk.toLocaleString()} ကျပ်`; }
    }
};

window.closeRegisterModal = function() {
    const h = document.getElementById('reg-modal-holder');
    if (h) h.innerHTML='';
};
