/**
 * scout.js — TW MM Tournament
 * Green Theme Version
 */

window.renderScout = async function() {
    const mainRoot = document.getElementById('main-root');

    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 12px;">

            <!-- Header -->
            <div class="section-title">🔭 Scout Center</div>

            <!-- Tab Toggle -->
            <div style="display:flex;background:#000;padding:4px;border-radius:40px;
                        margin-bottom:18px;border:1px solid var(--border);">
                <button id="btn-p" onclick="window.switchScoutTab('p')"
                    style="flex:1;padding:11px;border:none;border-radius:40px;font-weight:800;
                           cursor:pointer;transition:0.2s;background:var(--green);color:#000;
                           font-family:'Rajdhani',sans-serif;font-size:0.8rem;letter-spacing:1px;">
                    PLAYER SCOUT
                </button>
                <button id="btn-l" onclick="window.switchScoutTab('l')"
                    style="flex:1;padding:11px;border:none;border-radius:40px;font-weight:800;
                           cursor:pointer;transition:0.2s;background:transparent;color:var(--dim);
                           font-family:'Rajdhani',sans-serif;font-size:0.8rem;letter-spacing:1px;">
                    LEAGUE SCOUT
                </button>
            </div>

            <div id="scout-container"></div>
        </div>
    `;
    window.switchScoutTab('p');
};

window.switchScoutTab = function(tab) {
    const btnP = document.getElementById('btn-p');
    const btnL = document.getElementById('btn-l');
    if (!btnP) return;
    if (tab === 'p') {
        btnP.style.background = 'var(--green)'; btnP.style.color = '#000';
        btnL.style.background = 'transparent';  btnL.style.color = 'var(--dim)';
        loadPlayerData();
    } else {
        btnL.style.background = 'var(--green)'; btnL.style.color = '#000';
        btnP.style.background = 'transparent';  btnP.style.color = 'var(--dim)';
        loadLeagueData();
    }
};

// ── Player Scout ──────────────────────────────────────────────────────────────
async function loadPlayerData() {
    const container = document.getElementById('scout-container');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    const snapshot = await db.collection("scout_players").orderBy("total_points","desc").get();
    let players = [];
    snapshot.forEach(doc => players.push({id:doc.id, ...doc.data()}));
    window.allPlayers = players;
    window.currentFilteredPlayers = players;

    container.innerHTML = `
        <!-- Position Filter -->
        <div style="display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;">
            ${['ALL','GKP','DEF','MID','FWD'].map((pos,i) => `
            <button class="pos-btn" onclick="window.filterByPos('${pos}', this)"
                style="background:${i===0?'var(--green)':'var(--card)'};
                       color:${i===0?'#000':'var(--dim)'};
                       border:1px solid ${i===0?'var(--green)':'var(--border)'};
                       padding:6px 14px;border-radius:8px;font-size:0.7rem;font-weight:800;
                       cursor:pointer;white-space:nowrap;flex-shrink:0;
                       font-family:'Rajdhani',sans-serif;letter-spacing:1px;transition:0.15s;">
                ${pos}
            </button>`).join('')}
        </div>

        <!-- Table -->
        <div style="border-radius:14px;border:1px solid var(--border);overflow:hidden;background:var(--card);">
            <table class="scout-table" style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:var(--card2);">
                        <th style="padding:12px 12px;text-align:left;font-family:'Share Tech Mono',monospace;
                                   font-size:0.6rem;color:var(--green);letter-spacing:1px;border-bottom:2px solid var(--green);">
                            PLAYER
                        </th>
                        <th onclick="window.reSortP('gw')"
                            style="padding:12px 8px;text-align:center;cursor:pointer;
                                   font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                                   color:var(--dim);letter-spacing:1px;border-bottom:2px solid var(--border);">
                            GW ▽
                        </th>
                        <th onclick="window.reSortP('tot')"
                            style="padding:12px 8px;text-align:center;cursor:pointer;
                                   font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                                   color:var(--green);letter-spacing:1px;border-bottom:2px solid var(--green);">
                            TOT ▽
                        </th>
                        <th onclick="window.reSortP('own')"
                            style="padding:12px 8px;text-align:center;cursor:pointer;
                                   font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                                   color:var(--dim);letter-spacing:1px;border-bottom:2px solid var(--border);">
                            OWN% ▽
                        </th>
                    </tr>
                </thead>
                <tbody id="p-body"></tbody>
            </table>
        </div>
    `;
    displayPlayerRows(players);
}

window.filterByPos = (pos, btn) => {
    document.querySelectorAll('.pos-btn').forEach(b => {
        b.style.background = 'var(--card)';
        b.style.color = 'var(--dim)';
        b.style.borderColor = 'var(--border)';
    });
    btn.style.background = 'var(--green)';
    btn.style.color = '#000';
    btn.style.borderColor = 'var(--green)';
    window.currentFilteredPlayers = pos === 'ALL' ? window.allPlayers : window.allPlayers.filter(p => p.pos === pos);
    displayPlayerRows(window.currentFilteredPlayers);
};

window.reSortP = (t) => {
    let sorted = [...window.currentFilteredPlayers];
    if (t === 'gw')  sorted.sort((a,b) => (b.gw_points||0) - (a.gw_points||0));
    if (t === 'tot') sorted.sort((a,b) => (b.total_points||0) - (a.total_points||0));
    if (t === 'own') sorted.sort((a,b) => parseFloat(b.ownership||0) - parseFloat(a.ownership||0));
    displayPlayerRows(sorted);
};

function displayPlayerRows(data) {
    const body = document.getElementById('p-body');
    if (!body) return;
    body.innerHTML = data.map((p,i) => `
        <tr onclick="window.showPDetail('${p.id}')"
            style="border-bottom:1px solid var(--border);cursor:pointer;
                   background:${i%2===0?'var(--card)':'var(--card2)'};">
            <td style="padding:12px 12px;">
                <div style="font-weight:800;font-size:0.88rem;color:var(--text);
                             font-family:'Rajdhani',sans-serif;">${p.name}</div>
                <div style="font-size:0.6rem;color:var(--dim);margin-top:2px;
                             font-family:'Share Tech Mono',monospace;">
                    ${p.team} | ${p.pos} | £${p.price}m
                </div>
            </td>
            <td style="padding:10px 8px;text-align:center;color:var(--text);font-size:0.85rem;">${p.gw_points||0}</td>
            <td style="padding:10px 8px;text-align:center;font-weight:800;color:var(--green);
                        font-size:0.9rem;font-family:'Rajdhani',sans-serif;">${p.total_points||0}</td>
            <td style="padding:10px 8px;text-align:center;font-size:0.75rem;color:var(--dim);">${p.ownership||'0.0'}%</td>
        </tr>
    `).join('');
}

window.showPDetail = (id) => {
    const p = window.allPlayers.find(x => x.id === id);
    if (!p) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = () => modal.remove();

    const fixtureHtml = p.fixtures ? p.fixtures.slice(0,5).map(f => `
        <div style="flex:1;background:${f.bg||'var(--card2)'};color:${f.text||'#fff'};
                    text-align:center;padding:6px 2px;border-radius:6px;font-size:0.6rem;
                    font-weight:800;min-width:44px;border:1px solid var(--border);">
            <div>${f.opponent||'TBC'}</div>
            <div style="font-size:0.5rem;opacity:0.7;margin-top:2px;">${f.is_home?'H':'A'}</div>
        </div>`).join('') : `<div style="color:var(--dim);font-size:0.7rem;">No fixtures</div>`;

    modal.innerHTML = `
        <div class="profile-card" style="max-width:340px;" onclick="event.stopPropagation()">
            <div style="text-align:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:1.2rem;color:var(--green);font-family:'Rajdhani',sans-serif;">${p.full_name||p.name}</h3>
                <small style="color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-family:'Share Tech Mono',monospace;font-size:0.6rem;">
                    ${p.team_full||p.team} | ${p.pos}
                </small>
            </div>
            <div class="profile-info" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
                <div class="info-item"><span class="label">GOALS</span><span class="val">${p.goals||0}</span></div>
                <div class="info-item"><span class="label">ASSISTS</span><span class="val">${p.assists||0}</span></div>
                <div class="info-item"><span class="label">CS</span><span class="val">${p.clean_sheets||0}</span></div>
                <div class="info-item"><span class="label">BONUS</span><span class="val">${p.bonus||0}</span></div>
                <div class="info-item"><span class="label">xG</span><span class="val">${p.xg||0}</span></div>
                <div class="info-item"><span class="label">ICT</span><span class="val">${p.ict||0}</span></div>
            </div>
            <div style="margin-bottom:14px;background:rgba(0,255,136,0.04);padding:10px;
                         border-radius:10px;border:1px solid var(--border);">
                <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                             color:var(--green);margin-bottom:8px;letter-spacing:1px;">NEXT 5 FIXTURES</div>
                <div style="display:flex;gap:4px;justify-content:space-between;">${fixtureHtml}</div>
            </div>
            <div style="background:#000;padding:10px;border-radius:8px;border:1px solid var(--border);
                         display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:0.65rem;">
                <span style="color:var(--dim);">Price: <b style="color:var(--text);">£${p.price}m</b></span>
                <span style="color:var(--dim);">Own: <b style="color:var(--green);">${p.ownership}%</b></span>
            </div>
            <button class="primary-btn" style="margin-top:14px;" onclick="this.parentElement.parentElement.remove()">CLOSE</button>
        </div>`;
    document.body.appendChild(modal);
};

// ── League Scout ──────────────────────────────────────────────────────────────
async function loadLeagueData() {
    const container = document.getElementById('scout-container');
    container.innerHTML = `
        <div style="display:flex;gap:6px;margin-bottom:14px;">
            <button id="l-a" onclick="window.fetchL('League_A')"
                style="flex:1;padding:11px;border:none;border-radius:10px;font-weight:800;
                       cursor:pointer;background:var(--green);color:#000;
                       font-family:'Rajdhani',sans-serif;font-size:0.8rem;letter-spacing:1px;">
                LEAGUE A
            </button>
            <button id="l-b" onclick="window.fetchL('League_B')"
                style="flex:1;padding:11px;border:none;border-radius:10px;font-weight:800;
                       cursor:pointer;background:var(--card);color:var(--dim);
                       border:1px solid var(--border);font-family:'Rajdhani',sans-serif;
                       font-size:0.8rem;letter-spacing:1px;">
                LEAGUE B
            </button>
        </div>
        <div id="l-root"></div>
    `;
    window.fetchL('League_A');
}

window.fetchL = async (key) => {
    const root = document.getElementById('l-root');
    const btnA = document.getElementById('l-a');
    const btnB = document.getElementById('l-b');
    if (btnA) { btnA.style.background = key==='League_A'?'var(--green)':'var(--card)'; btnA.style.color = key==='League_A'?'#000':'var(--dim)'; btnA.style.border = key==='League_A'?'none':'1px solid var(--border)'; }
    if (btnB) { btnB.style.background = key==='League_B'?'var(--green)':'var(--card)'; btnB.style.color = key==='League_B'?'#000':'var(--dim)'; btnB.style.border = key==='League_B'?'none':'1px solid var(--border)'; }
    root.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    const snap = await db.collection(`scout_${key}`).orderBy("total_points","desc").get();
    let teams = [];
    snap.forEach(d => teams.push(d.data()));
    window.allLeagues = teams;

    root.innerHTML = `
        <div style="border-radius:14px;border:1px solid var(--border);overflow:hidden;background:var(--card);">
            <table class="scout-table" style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:var(--card2);">
                        <th style="padding:12px 12px;text-align:left;font-family:'Share Tech Mono',monospace;
                                   font-size:0.6rem;color:var(--green);letter-spacing:1px;border-bottom:2px solid var(--green);">
                            MANAGER
                        </th>
                        <th onclick="window.reSortL('gw')" style="padding:12px 8px;text-align:center;cursor:pointer;
                            font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:var(--dim);
                            letter-spacing:1px;border-bottom:2px solid var(--border);">GW ▽</th>
                        <th onclick="window.reSortL('tot')" style="padding:12px 8px;text-align:center;cursor:pointer;
                            font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:var(--green);
                            letter-spacing:1px;border-bottom:2px solid var(--green);">TOT ▽</th>
                    </tr>
                </thead>
                <tbody id="l-body"></tbody>
            </table>
        </div>`;
    displayLeagueRows(teams);
};

function displayLeagueRows(data) {
    const body = document.getElementById('l-body');
    if (!body) return;
    body.innerHTML = data.map((t,i) => `
        <tr onclick="window.showTPitch('${t.entry_id}')"
            style="border-bottom:1px solid var(--border);cursor:pointer;
                   background:${i%2===0?'var(--card)':'var(--card2)'};">
            <td style="padding:12px 12px;">
                <div style="font-weight:800;font-size:0.88rem;color:var(--text);font-family:'Rajdhani',sans-serif;">${t.team_name}</div>
                <div style="font-size:0.6rem;color:var(--dim);font-family:'Share Tech Mono',monospace;margin-top:2px;">${t.manager}</div>
            </td>
            <td style="padding:10px 8px;text-align:center;color:var(--text);font-size:0.85rem;">${t.gw_points||0}</td>
            <td style="padding:10px 8px;text-align:center;font-weight:800;color:var(--green);font-size:0.9rem;font-family:'Rajdhani',sans-serif;">${t.total_points||0}</td>
        </tr>`).join('');
}

window.reSortL = (t) => {
    const sorted = [...window.allLeagues].sort((a,b) => t==='gw'?(b.gw_points||0)-(a.gw_points||0):(b.total_points||0)-(a.total_points||0));
    displayLeagueRows(sorted);
};

window.showTPitch = (id) => {
    const t = window.allLeagues.find(x => x.entry_id == id);
    if (!t) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = () => modal.remove();

    const lineup  = t.lineup || [];
    const starters = lineup.filter(p => p.multiplier > 0);
    const bench    = lineup.filter(p => p.multiplier === 0);
    const realVC   = starters.find(p => p.is_vice_captain === true);

    modal.innerHTML = `
        <div class="profile-card" style="width:98%;max-width:400px;padding:15px;
             background:var(--card);border:1px solid rgba(0,255,136,0.2);" onclick="event.stopPropagation()">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                <div>
                    <h4 style="margin:0;font-size:1rem;color:var(--green);font-family:'Rajdhani',sans-serif;">${t.team_name}</h4>
                    <span style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:var(--dim);">
                        Hit: <span style="color:#ff4444;">-${t.transfer_cost||0}</span> &nbsp;|&nbsp; GW: <span style="color:var(--green);">${t.gw_points}</span>
                    </span>
                </div>
                <div style="background:${t.active_chip?'var(--green)':'var(--card2)'};
                             color:${t.active_chip?'#000':'var(--dim)'};
                             padding:4px 10px;border-radius:6px;font-weight:900;
                             font-size:0.65rem;font-family:'Share Tech Mono',monospace;border:1px solid var(--border);">
                    ${t.active_chip ? t.active_chip.toUpperCase() : 'NO CHIP'}
                </div>
            </div>
            <div style="background:linear-gradient(180deg,#0a3d0a 0%,#052005 100%);border-radius:10px;
                         padding:18px 5px;display:flex;flex-direction:column;justify-content:space-around;
                         min-height:340px;border:1px solid rgba(0,255,136,0.15);gap:12px;">
                <div style="display:flex;justify-content:center;gap:8px;">${renderPitchPlayers(starters.filter(p=>p.pos==='FWD'),realVC)}</div>
                <div style="display:flex;justify-content:center;gap:8px;">${renderPitchPlayers(starters.filter(p=>p.pos==='MID'),realVC)}</div>
                <div style="display:flex;justify-content:center;gap:8px;">${renderPitchPlayers(starters.filter(p=>p.pos==='DEF'),realVC)}</div>
                <div style="display:flex;justify-content:center;gap:8px;">${renderPitchPlayers(starters.filter(p=>p.pos==='GKP'),realVC)}</div>
            </div>
            <div style="margin-top:10px;background:#000;padding:10px;border-radius:8px;
                         display:flex;justify-content:space-between;border:1px solid var(--border);gap:5px;">
                ${bench.map(p => `
                    <div style="text-align:center;flex:1;">
                        <svg width="28" height="28" viewBox="0 0 24 24" style="opacity:0.5;">
                            <path fill="${p.pos==='GKP'?'#ffeb3b':'#aaa'}" d="M13,2V4H11V2H8V4H6V7C6,8.1 6.9,9 8,9V22H16V9C17.1,9 18,8.1 18,7V4H16V2H13Z"/>
                        </svg>
                        <div style="font-size:0.58rem;color:#aaa;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
                        <div style="font-size:0.68rem;color:var(--dim);font-weight:900;">${p.points}</div>
                    </div>`).join('')}
            </div>
            <button class="primary-btn" style="margin-top:14px;background:transparent;border:1px solid var(--border);color:var(--dim);" onclick="this.parentElement.parentElement.remove()">✕ CLOSE</button>
        </div>`;
    document.body.appendChild(modal);
};

function renderPitchPlayers(arr, realVC) {
    return arr.map(p => {
        let badge = '';
        if (p.is_captain) {
            const label = p.multiplier===3?'TC':'C';
            const bg    = p.multiplier===3?'#ff4444':'#000';
            badge = `<div style="position:absolute;top:-10px;right:0;background:${bg};color:var(--green);
                         font-size:0.6rem;padding:1px 4px;border:1px solid var(--green);
                         border-radius:3px;font-weight:900;z-index:5;">${label}</div>`;
        } else if (realVC && p.id===realVC.id) {
            badge = `<div style="position:absolute;top:-10px;right:0;background:#333;color:#aaa;
                         font-size:0.6rem;padding:1px 4px;border:1px solid #555;
                         border-radius:3px;font-weight:900;z-index:5;">V</div>`;
        }
        const score = (p.points||0) * (p.multiplier||1);
        return `<div style="text-align:center;width:68px;position:relative;">
            <div style="position:relative;margin-bottom:2px;">
                ${badge}
                <svg width="30" height="30" viewBox="0 0 24 24">
                    <path fill="${p.pos==='GKP'?'#ffeb3b':'var(--green)'}" d="M13,2V4H11V2H8V4H6V7C6,8.1 6.9,9 8,9V22H16V9C17.1,9 18,8.1 18,7V4H16V2H13Z"/>
                </svg>
            </div>
            <div style="background:rgba(0,0,0,0.85);color:#fff;font-size:0.55rem;padding:2px 3px;
                         border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         max-width:100%;border:0.5px solid rgba(0,255,136,0.2);">${p.name}</div>
            <div style="font-size:0.72rem;color:var(--green);font-weight:900;">${score}</div>
        </div>`;
    }).join('');
}
