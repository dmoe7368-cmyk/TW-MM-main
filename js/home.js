/**
 * home.js — TW MM Tournament
 * News/Photo Feed + Fee Status + Register Buttons
 */

window.renderHome = async function() {
    const main = document.getElementById('main-root');
    const user = auth.currentUser;

    main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading...</p></div>`;

    let userData = null;
    if (user) {
        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) userData = doc.data();
        } catch(e) { console.error(e); }
    }

    main.innerHTML = `
        <div style="max-width:600px; margin:0 auto; padding:14px 14px 30px;">

            ${user ? buildFeeStatus(userData) : buildLoginPrompt()}
            ${buildNewsSection()}

        </div>
        <div id="reg-modal-holder"></div>
    `;

    loadNews();

    // Real-time coin & fee update
    if (user) {
        db.collection("users").doc(user.uid).onSnapshot(snap => {
            if (!snap.exists) return;
            const d = snap.data();
            updateFeeCards(d);
            // Header coin badge
            const hc = document.getElementById('header-coins');
            if (hc) hc.innerText = d.coins ?? 0;
        });
    }
};

// ── Fee Status Section ────────────────────────────────────────────────────────
function buildFeeStatus(d) {
    const coins     = d?.coins     ?? 0;
    const weekPaid  = d?.week_paid ?? false;
    const cupPaid   = d?.cup_paid  ?? false;
    const mmkWeek   = 5 * 100;   // 5 coins × 100 MMK
    const mmkCup    = 10 * 100;  // 10 coins × 100 MMK

    return `
        <div class="section-title">📋 My Fee Status</div>
        <div class="fee-grid" id="fee-grid">
            ${buildFeeCard('week', weekPaid, 'Weekly', '5', mmkWeek)}
            ${buildFeeCard('cup',  cupPaid,  'Cup',    '10', mmkCup)}
        </div>

        <div class="section-title">🎯 Register Now</div>
        <div class="reg-grid">
            <button class="reg-btn weekly" onclick="window.openRegisterModal('weekly')">
                <span class="reg-btn-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </span>
                <span class="reg-btn-label">Register</span>
                <span class="reg-btn-name">Weekly</span>
                <span class="reg-btn-fee">5 🪙 · 500 ကျပ်</span>
            </button>
            <button class="reg-btn cup" onclick="window.openRegisterModal('cup')">
                <span class="reg-btn-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 21h8M12 21v-5"/><path d="M5 3h14v7a7 7 0 01-14 0V3z"/><path d="M5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9"/>
                    </svg>
                </span>
                <span class="reg-btn-label">Register</span>
                <span class="reg-btn-name">Cup</span>
                <span class="reg-btn-fee">10 🪙 · 1,000 ကျပ်</span>
            </button>
        </div>
    `;
}

function buildFeeCard(id, paid, label, coins, mmk) {
    const cls   = paid ? 'paid' : 'unpaid';
    const icon  = paid ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                       : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const badge = paid ? `<span class="fee-badge badge-paid">PAID</span>`
                       : `<span class="fee-badge badge-unpaid">UNPAID</span>`;
    return `
        <div class="fee-card ${cls}" id="fee-card-${id}">
            <div class="fee-status-icon">${icon}</div>
            <div class="fee-label">${label.toUpperCase()}</div>
            <div class="fee-type">${coins} 🪙<br><small style="font-size:0.65rem;color:#4a7a55;font-family:'Share Tech Mono',monospace;">${mmk.toLocaleString()} ကျပ်</small></div>
            <div style="margin-top:6px;">${badge}</div>
        </div>
    `;
}

function updateFeeCards(d) {
    const grid = document.getElementById('fee-grid');
    if (!grid) return;
    grid.innerHTML =
        buildFeeCard('week', d.week_paid ?? false, 'Weekly', '5',  500) +
        buildFeeCard('cup',  d.cup_paid  ?? false, 'Cup',    '10', 1000);
}

function buildLoginPrompt() {
    return `
        <div class="glow-card" style="text-align:center; padding:24px 16px; margin-bottom:20px;">
            <div style="margin-bottom:12px; color:var(--green);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <p style="font-family:'Rajdhani',sans-serif; font-weight:700; font-size:1rem; margin-bottom:14px; color:var(--text);">Fee Status ကြည့်ဖို့ Login ဝင်ပါ</p>
            <button onclick="window.renderAuthUI()" class="primary-btn" style="max-width:200px; margin:0 auto;">LOGIN</button>
        </div>
    `;
}

// ── News Section ──────────────────────────────────────────────────────────────
function buildNewsSection() {
    return `
        <div class="section-title">📰 Latest News</div>
        <div id="news-list">
            <div class="loading"><div class="spinner"></div><p>News load နေသည်...</p></div>
        </div>
    `;
}

function loadNews() {
    db.collection("tw_news")
        .orderBy("created_at", "desc")
        .limit(20)
        .onSnapshot(snap => {
            const list = document.getElementById('news-list');
            if (!list) return;

            if (snap.empty) {
                list.innerHTML = `
                    <div class="glow-card" style="text-align:center; padding:30px; color:var(--dim);">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.4;">
                            <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8L4 6v14a2 2 0 002 2z"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="10" x2="15" y2="10"/>
                        </svg>
                        <p style="font-family:'Share Tech Mono',monospace; font-size:0.72rem; letter-spacing:1px;">သတင်းများ မရှိသေးပါ</p>
                    </div>`;
                return;
            }

            list.innerHTML = snap.docs.map(doc => buildNewsCard(doc.data())).join('');
        }, err => {
            const list = document.getElementById('news-list');
            if (list) list.innerHTML = `<div style="color:var(--danger); text-align:center; padding:20px; font-size:0.85rem;">${err.message}</div>`;
        });
}

function buildNewsCard(p) {
    const isGold = p.type === 'announcement';
    const time   = p.created_at
        ? new Date(p.created_at.seconds * 1000).toLocaleDateString('my-MM', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
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
        <div class="glow-card ${isGold ? 'gold-glow' : ''}" style="animation-delay:${Math.random()*0.2}s">
            <span class="news-tag ${isGold ? 'gold' : ''}">${tagLabel}</span>
            ${imgHtml}
            <div class="news-title">${p.title || ''}</div>
            ${p.body ? `<div class="news-body" style="margin-top:6px;">${p.body}</div>` : ''}
            <div class="news-meta">
                <span style="display:flex;align-items:center;gap:5px;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ${p.author || 'Admin TW'}
                </span>
                <span>${time}</span>
            </div>
        </div>
    `;
}
