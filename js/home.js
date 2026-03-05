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
            ${buildMembersSection()}
        ${buildNewsSection()}

        </div>
        <div id="reg-modal-holder"></div>
    `;

    loadNews();
    loadMembers();

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

// ── Members Registration List ─────────────────────────────────────────────────
function buildMembersSection() {
    return `
        <div class="section-title" style="margin-top:8px;">👥 Registered Members</div>

        <!-- Tab toggle -->
        <div style="display:flex; background:#000; padding:4px; border-radius:40px; margin-bottom:14px; border:1px solid var(--border);">
            <button id="mem-tab-weekly" onclick="switchMemberTab('weekly')"
                style="flex:1; padding:9px; border-radius:40px; border:none;
                       background:var(--green); color:#000;
                       font-family:'Rajdhani',sans-serif; font-weight:700;
                       font-size:0.8rem; cursor:pointer; letter-spacing:1px; transition:0.2s;">
                📅 WEEKLY
            </button>
            <button id="mem-tab-cup" onclick="switchMemberTab('cup')"
                style="flex:1; padding:9px; border-radius:40px; border:none;
                       background:transparent; color:var(--dim);
                       font-family:'Rajdhani',sans-serif; font-weight:700;
                       font-size:0.8rem; cursor:pointer; letter-spacing:1px; transition:0.2s;">
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
    const isWeekly = type === 'weekly';

    const tw = document.getElementById('mem-tab-weekly');
    const tc = document.getElementById('mem-tab-cup');
    if (tw) {
        tw.style.background = isWeekly ? 'var(--green)' : 'transparent';
        tw.style.color      = isWeekly ? '#000' : 'var(--dim)';
    }
    if (tc) {
        tc.style.background = !isWeekly ? 'var(--gold)' : 'transparent';
        tc.style.color      = !isWeekly ? '#000' : 'var(--dim)';
    }
    loadMembers(type);
};

function loadMembers(type) {
    const t = type || window._memberTab || 'weekly';
    const list = document.getElementById('members-list');
    if (!list) return;

    list.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    db.collection("tw_registrations")
        .where("type", "==", t)
        .orderBy("registered_at", "desc")
        .onSnapshot(snap => {
            const el = document.getElementById('members-list');
            if (!el) return;

            if (snap.empty) {
                el.innerHTML = `
                    <div class="glow-card" style="text-align:center; padding:24px; color:var(--dim);">
                        <p style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; letter-spacing:1px;">
                            ${t === 'weekly' ? 'Weekly' : 'Cup'} Register မရှိသေးပါ
                        </p>
                    </div>`;
                return;
            }

            const isWeekly = t === 'weekly';
            const color    = isWeekly ? 'var(--green)' : 'var(--gold)';
            const total    = snap.docs.length;

            el.innerHTML = `
                <!-- Count badge -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <div style="background:${isWeekly ? 'rgba(0,255,136,0.1)' : 'rgba(212,175,55,0.1)'}; 
                                border:1px solid ${isWeekly ? 'rgba(0,255,136,0.3)' : 'rgba(212,175,55,0.3)'};
                                border-radius:20px; padding:4px 14px;
                                font-family:'Share Tech Mono',monospace; font-size:0.65rem;
                                color:${color}; letter-spacing:1px;">
                        ${total} MEMBERS
                    </div>
                </div>

                <!-- Members cards -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${snap.docs.map((doc, i) => {
                        const d    = doc.data();
                        const time = d.registered_at
                            ? new Date(d.registered_at.seconds * 1000)
                                .toLocaleDateString('en-GB', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})
                            : '';
                        const initial = (d.manager_name || '?').charAt(0).toUpperCase();

                        return `
                        <div style="
                            background:var(--card); border-radius:12px; padding:12px 14px;
                            display:flex; align-items:center; gap:12px;
                            border:1px solid var(--border); position:relative; overflow:hidden;">
                            <!-- Glow left border -->
                            <div style="position:absolute; left:0; top:0; bottom:0; width:3px; background:${color}; opacity:0.6;"></div>

                            <!-- Rank -->
                            <div style="font-family:'Share Tech Mono',monospace; font-size:0.65rem; color:var(--dim); width:18px; text-align:center; flex-shrink:0;">
                                ${i + 1}
                            </div>

                            <!-- Avatar -->
                            <div style="
                                width:36px; height:36px; border-radius:50%; flex-shrink:0;
                                background:${isWeekly ? 'linear-gradient(135deg,#003d1a,#001a0a)' : 'linear-gradient(135deg,#2a1800,#110a00)'};
                                border:1.5px solid ${isWeekly ? 'rgba(0,255,136,0.3)' : 'rgba(212,175,55,0.3)'};
                                display:flex; align-items:center; justify-content:center;
                                font-family:'Rajdhani',sans-serif; font-weight:700;
                                font-size:0.95rem; color:${color};">
                                ${initial}
                            </div>

                            <!-- Info -->
                            <div style="flex:1; min-width:0;">
                                <div style="font-family:'Rajdhani',sans-serif; font-weight:700;
                                            font-size:0.95rem; color:var(--text);
                                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${d.manager_name || 'Unknown'}
                                </div>
                                <div style="font-family:'Share Tech Mono',monospace; font-size:0.58rem;
                                            color:var(--dim); margin-top:2px;
                                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${d.team_name || ''}
                                </div>
                            </div>

                            <!-- Time + badge -->
                            <div style="text-align:right; flex-shrink:0;">
                                <span class="fee-badge ${isWeekly ? 'badge-paid' : ''}" 
                                      style="${!isWeekly ? `background:rgba(212,175,55,0.12); color:var(--gold); border:1px solid rgba(212,175,55,0.3);` : ''}">
                                    ✓ PAID
                                </span>
                                <div style="font-family:'Share Tech Mono',monospace; font-size:0.55rem;
                                            color:var(--dim); margin-top:4px;">
                                    ${time}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `;
        }, err => {
            const el = document.getElementById('members-list');
            if (el) el.innerHTML = `<div style="color:var(--danger);text-align:center;padding:16px;font-size:0.8rem;">${err.message}</div>`;
        });
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
