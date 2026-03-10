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
    const mmkWeek   = 1000;   // Weekly = 1,000 ကျပ်
    const mmkCup    = 5000;   // Cup    = 5,000 ကျပ်

    return `
        <div class="section-title">📋 My Fee Status</div>
        <div class="fee-grid" id="fee-grid">
            ${buildFeeCard('week', weekPaid, 'Weekly', '1,000', mmkWeek)}
            ${buildFeeCard('cup',  cupPaid,  'Cup',    '5,000', mmkCup)}
        </div>

        <div class="section-title">🎯 Register Now</div>
        <div class="reg-grid">
            <button class="reg-btn weekly" onclick="window.openRegisterModal('weekly')">
                <span class="reg-btn-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </span>
                <div style="flex:1;min-width:0;text-align:left;">
                    <span class="reg-btn-label">REGISTER</span>
                    <span class="reg-btn-name">Weekly</span>
                    <span class="reg-btn-fee">1,000 ကျပ် · 10 coins</span>
                </div>
            </button>
            <button class="reg-btn cup" onclick="window.openRegisterModal('cup')">
                <span class="reg-btn-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 21h8M12 21v-5"/><path d="M5 3h14v7a7 7 0 01-14 0V3z"/><path d="M5 7H2a5 5 0 004 4.9M19 7h3a5 5 0 01-4 4.9"/>
                    </svg>
                </span>
                <div style="flex:1;min-width:0;text-align:left;">
                    <span class="reg-btn-label">REGISTER</span>
                    <span class="reg-btn-name">Cup</span>
                    <span class="reg-btn-fee">5,000 ကျပ် · 50 coins</span>
                </div>
            </button>
        </div>
    `;
}

function buildFeeCard(id, paid, label, coins, mmk) {
    const cls   = paid ? 'paid' : 'unpaid';
    const icon  = paid ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7dd8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
                       : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    const badge = paid ? `<span class="fee-badge badge-paid">PAID</span>`
                       : `<span class="fee-badge badge-unpaid">UNPAID</span>`;
    return `
        <div class="fee-card ${paid ? 'gold-card' : ''}" id="fee-card-${id}">
            <div class="fee-status-icon">${icon}</div>
            <div class="fee-label">${label.toUpperCase()}</div>
            <div class="fee-type">${coins} ကျပ်</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:0.62rem;color:rgba(255,255,255,0.35);margin-top:2px;">${id==="week"?"10 coins":"50 coins"}</div>
            <div style="margin-top:6px;">${badge}</div>
        </div>
    `;
}

function updateFeeCards(d) {
    const grid = document.getElementById('fee-grid');
    if (!grid) return;
    grid.innerHTML =
        buildFeeCard('week', d.week_paid ?? false, 'Weekly', '1,000', 1000) +
        buildFeeCard('cup',  d.cup_paid  ?? false, 'Cup',    '5,000', 5000);
}

function buildLoginPrompt() {
    return `
        <div style="background:rgba(80,190,255,0.3);border:1px solid rgba(80,190,255,0.3);
                    border-radius:14px;padding:14px 16px;margin-bottom:16px;
                    display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;">
            <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;
                         background:rgba(80,190,255,0.3);border:1px solid rgba(80,190,255,0.2);
                         display:flex;align-items:center;justify-content:center;color:#7dd8ff;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div style="flex:1;">
                <div style="font-family:'Rajdhani',sans-serif;font-weight:800;font-size:0.9rem;
                             color:var(--text);">Fee Status ကြည့်ဖို့ Login ဝင်ပါ</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;color:var(--dim);margin-top:2px;">
                    Weekly <span style="color:#7dd8ff;font-weight:700;">1,000 ကျပ် (10 coins)</span>
                    &nbsp;·&nbsp;
                    Cup <span style="color:#7dd8ff;font-weight:700;">5,000 ကျပ် (50 coins)</span>
                </div>
            </div>
            <button onclick="window.renderAuthUI()"
                    style="flex-shrink:0;padding:8px 18px;font-size:0.85rem;border-radius:8px;
                           background:linear-gradient(135deg,rgba(80,190,255,0.3),rgba(0,180,80,0.06));
                           border:1px solid rgba(80,190,255,0.3);color:#7dd8ff;cursor:pointer;
                           font-family:'Rajdhani',sans-serif;font-weight:900;letter-spacing:1px;
                           white-space:nowrap;">
                LOGIN
            </button>
        </div>
    `;
}

// ── Members Registration List ─────────────────────────────────────────────────
function buildMembersSection() {
    return `
        <div class="section-title" style="margin-top:8px;">👥 Registered Members</div>

        <div style="display:flex;gap:6px;margin-bottom:10px;">
            <button id="mem-tab-weekly" class="tab-btn active" onclick="switchMemberTab('weekly')" style="flex:1;padding:6px 10px;border-radius:10px;font-size:0.72rem;">📅 WEEKLY</button>
            <button id="mem-tab-cup"    class="tab-btn"        onclick="switchMemberTab('cup')"    style="flex:1;padding:6px 10px;border-radius:10px;font-size:0.72rem;">🏆 CUP</button>
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
    if (tw) { tw.classList.toggle('active', isWeekly); }
    if (tc) { tc.classList.toggle('active', !isWeekly); }
    loadMembers(type);
};

function loadMembers(type) {
    const t = type || window._memberTab || 'weekly';
    const list = document.getElementById('members-list');
    if (!list) return;

    list.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    db.collection("tw_registrations")
        .where("type", "==", t)
        .onSnapshot(snap => {
            const el = document.getElementById('members-list');
            if (!el) return;

            const sortedDocs = snap.docs.slice().sort((a,b) => {
                const ta = a.data().registered_at?.seconds || 0;
                const tb = b.data().registered_at?.seconds || 0;
                return tb - ta;
            });

            if (!sortedDocs.length) {
                el.innerHTML = `
                    <div class="glow-card" style="text-align:center; padding:24px; color:var(--dim);">
                        <p style="font-family:'Share Tech Mono',monospace; font-size:0.7rem; letter-spacing:1px;">
                            ${t === 'weekly' ? 'Weekly' : 'Cup'} Register မရှိသေးပါ
                        </p>
                    </div>`;
                return;
            }

            const isWeekly = t === 'weekly';
            const color    = isWeekly ? '#7dd8ff' : 'var(--gold)';
            const total    = sortedDocs.length;

            el.innerHTML = `
                <!-- Count badge -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                    <div style="background:${isWeekly ? 'rgba(80,190,255,0.12)' : 'rgba(212,175,55,0.1)'}; 
                                border:1px solid ${isWeekly ? 'rgba(80,190,255,0.28)' : 'rgba(212,175,55,0.3)'};
                                border-radius:20px; padding:4px 14px;
                                font-family:'Share Tech Mono',monospace; font-size:0.65rem;
                                color:${color}; letter-spacing:1px;">
                        ${total} MEMBERS
                    </div>
                </div>

                <!-- Members cards -->
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${sortedDocs.map((doc, i) => {
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
                            <div style="font-family:'Rajdhani',sans-serif; font-size:0.72rem; color:rgba(255,255,255,0.3); width:18px; text-align:center; flex-shrink:0;">
                                ${i + 1}
                            </div>

                            <!-- Avatar -->
                            <div style="
                                width:36px; height:36px; border-radius:50%; flex-shrink:0;
                                background:${isWeekly ? 'rgba(80,190,255,0.1)' : 'rgba(196,160,255,0.1)'};
                                border:1.5px solid ${isWeekly ? 'rgba(80,190,255,0.28)' : 'rgba(212,175,55,0.3)'};
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

            // client-side sort — created_at desc
            const docs = snap.docs.slice().sort((a, b) => {
                const ta = a.data().created_at?.seconds || 0;
                const tb = b.data().created_at?.seconds || 0;
                return tb - ta;
            });

            list.innerHTML = docs.map(doc => buildNewsCard(doc.data())).join('');
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
            ${p.body ? `<div class="news-body" style="margin-top:6px;white-space:pre-line;">${p.body}</div>` : ''}
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
