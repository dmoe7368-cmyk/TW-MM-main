/**
 * scout.js — TW MM Tournament
 * Green Theme — Clear Typography Version
 */

window.renderScout = async function() {
    const mainRoot = document.getElementById('main-root');
    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 12px;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                <span style="font-size:1.3rem;">🔭</span>
                <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.3rem;
                              color:var(--green);letter-spacing:1px;">SCOUT CENTER</span>
            </div>

            <!-- Tab Toggle -->
            <div style="display:flex;background:#000;padding:4px;border-radius:40px;
                        margin-bottom:16px;border:1px solid var(--border);">
                <button id="btn-p" onclick="window.switchScoutTab('p')"
                    style="flex:1;padding:12px;border:none;border-radius:40px;font-weight:900;
                           cursor:pointer;transition:0.2s;background:var(--green);color:#000;
                           font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
                    PLAYER SCOUT
                </button>
                <button id="btn-l" onclick="window.switchScoutTab('l')"
                    style="flex:1;padding:12px;border:none;border-radius:40px;font-weight:900;
                           cursor:pointer;transition:0.2s;background:transparent;color:var(--dim);
                           font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
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
    snapshot.forEach(doc => players.push({id:doc.id,...doc.data()}));
    window.allPlayers = players;
    window.currentFilteredPlayers = players;

    container.innerHTML = `
        <!-- Position Filter -->
        <div style="display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px;">
            ${['ALL','GKP','DEF','MID','FWD'].map((pos,i) => `
            <button class="pos-btn" onclick="window.filterByPos('${pos}',this)"
                style="background:${i===0?'var(--green)':'var(--card)'};
                       color:${i===0?'#000':'var(--text)'};
                       border:1px solid ${i===0?'var(--green)':'var(--border)'};
                       padding:8px 16px;border-radius:8px;
                       font-family:'Rajdhani',sans-serif;
                       font-size:0.9rem;font-weight:800;
                       cursor:pointer;white-space:nowrap;flex-shrink:0;transition:0.15s;">
                ${pos}
            </button>`).join('')}
        </div>

        <!-- Table -->
        <div style="border-radius:14px;border:1px solid var(--border);overflow:hidden;background:var(--card);">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:var(--card2);">
                        <th style="padding:14px 14px;text-align:left;border-bottom:2px solid var(--green);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:900;color:var(--green);">PLAYER</span>
                        </th>
                        <th onclick="window.reSortP('gw')"
                            style="padding:14px 10px;text-align:center;cursor:pointer;border-bottom:2px solid var(--border);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:800;color:var(--dim);">GW ▽</span>
                        </th>
                        <th onclick="window.reSortP('tot')"
                            style="padding:14px 10px;text-align:center;cursor:pointer;border-bottom:2px solid var(--green);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:900;color:var(--green);">TOT ▽</span>
                        </th>
                        <th onclick="window.reSortP('own')"
                            style="padding:14px 10px;text-align:center;cursor:pointer;border-bottom:2px solid var(--border);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:800;color:var(--dim);">OWN% ▽</span>
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
        b.style.background  = 'var(--card)';
        b.style.color       = 'var(--text)';
        b.style.borderColor = 'var(--border)';
    });
    btn.style.background  = 'var(--green)';
    btn.style.color       = '#000';
    btn.style.borderColor = 'var(--green)';
    window.currentFilteredPlayers = pos==='ALL' ? window.allPlayers : window.allPlayers.filter(p=>p.pos===pos);
    displayPlayerRows(window.currentFilteredPlayers);
};

window.reSortP = (t) => {
    let sorted = [...window.currentFilteredPlayers];
    if (t==='gw')  sorted.sort((a,b)=>(b.gw_points||0)-(a.gw_points||0));
    if (t==='tot') sorted.sort((a,b)=>(b.total_points||0)-(a.total_points||0));
    if (t==='own') sorted.sort((a,b)=>parseFloat(b.ownership||0)-parseFloat(a.ownership||0));
    displayPlayerRows(sorted);
};

function displayPlayerRows(data) {
    const body = document.getElementById('p-body');
    if (!body) return;
    body.innerHTML = data.map((p,i) => `
        <tr onclick="window.showPDetail('${p.id}')"
            style="border-bottom:1px solid var(--border);cursor:pointer;
                   background:${i%2===0?'var(--card)':'var(--card2)'};">
            <td style="padding:13px 14px;">
                <div style="font-weight:800;font-size:1rem;color:var(--text);
                             font-family:'Rajdhani',sans-serif;">${p.name}</div>
                <div style="font-size:0.78rem;color:var(--dim);margin-top:3px;
                             font-family:'Rajdhani',sans-serif;font-weight:600;">
                    ${p.team} | ${p.pos} | £${p.price}m
                </div>
            </td>
            <td style="padding:12px 10px;text-align:center;color:var(--text);
                        font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;">
                ${p.gw_points||0}
            </td>
            <td style="padding:12px 10px;text-align:center;font-weight:900;color:var(--green);
                        font-family:'Rajdhani',sans-serif;font-size:1.05rem;">
                ${p.total_points||0}
            </td>
            <td style="padding:12px 10px;text-align:center;color:var(--dim);
                        font-family:'Rajdhani',sans-serif;font-size:0.9rem;font-weight:700;">
                ${p.ownership||'0.0'}%
            </td>
        </tr>`).join('');
}

window.showPDetail = (id) => {
    const p = window.allPlayers.find(x=>x.id===id);
    if (!p) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = () => modal.remove();

    const fixtureHtml = p.fixtures ? p.fixtures.slice(0,5).map(f=>`
        <div style="flex:1;background:${f.bg||'var(--card2)'};color:${f.text||'#fff'};
                    text-align:center;padding:7px 3px;border-radius:6px;
                    font-family:'Rajdhani',sans-serif;font-size:0.78rem;
                    font-weight:800;min-width:44px;border:1px solid var(--border);">
            <div>${f.opponent||'TBC'}</div>
            <div style="font-size:0.65rem;opacity:0.7;margin-top:2px;">${f.is_home?'H':'A'}</div>
        </div>`).join('') : `<div style="color:var(--dim);font-family:'Rajdhani',sans-serif;">No fixtures</div>`;

    modal.innerHTML = `
        <div class="profile-card" style="max-width:340px;" onclick="event.stopPropagation()">
            <div style="text-align:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:1.3rem;color:var(--green);font-family:'Rajdhani',sans-serif;font-weight:900;">
                    ${p.full_name||p.name}
                </h3>
                <div style="color:var(--dim);font-family:'Rajdhani',sans-serif;font-size:0.85rem;
                             font-weight:700;margin-top:4px;letter-spacing:1px;">
                    ${p.team_full||p.team} | ${p.pos}
                </div>
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
                <div style="font-family:'Rajdhani',sans-serif;font-size:0.85rem;font-weight:800;
                             color:var(--green);margin-bottom:8px;letter-spacing:1px;">NEXT 5 FIXTURES</div>
                <div style="display:flex;gap:4px;justify-content:space-between;">${fixtureHtml}</div>
            </div>
            <div style="background:#000;padding:12px;border-radius:8px;border:1px solid var(--border);
                         display:flex;justify-content:space-between;
                         font-family:'Rajdhani',sans-serif;font-size:0.9rem;font-weight:700;">
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
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <button id="l-a" onclick="window.fetchL('League_A')"
                style="flex:1;padding:12px;border:none;border-radius:10px;font-weight:900;
                       cursor:pointer;background:var(--green);color:#000;
                       font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
                LEAGUE A
            </button>
            <button id="l-b" onclick="window.fetchL('League_B')"
                style="flex:1;padding:12px;border:none;border-radius:10px;font-weight:900;
                       cursor:pointer;background:var(--card);color:var(--dim);
                       border:1px solid var(--border);
                       font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
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
    if (btnA) { btnA.style.background=key==='League_A'?'var(--green)':'var(--card)'; btnA.style.color=key==='League_A'?'#000':'var(--dim)'; btnA.style.border=key==='League_A'?'none':'1px solid var(--border)'; }
    if (btnB) { btnB.style.background=key==='League_B'?'var(--green)':'var(--card)'; btnB.style.color=key==='League_B'?'#000':'var(--dim)'; btnB.style.border=key==='League_B'?'none':'1px solid var(--border)'; }
    root.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    const snap = await db.collection(`scout_${key}`).orderBy("total_points","desc").get();
    let teams = [];
    snap.forEach(d=>teams.push(d.data()));
    window.allLeagues = teams;

    root.innerHTML = `
        <div style="border-radius:14px;border:1px solid var(--border);overflow:hidden;background:var(--card);">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:var(--card2);">
                        <th style="padding:14px 14px;text-align:left;border-bottom:2px solid var(--green);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:900;color:var(--green);">MANAGER</span>
                        </th>
                        <th onclick="window.reSortL('gw')"
                            style="padding:14px 10px;text-align:center;cursor:pointer;border-bottom:2px solid var(--border);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:800;color:var(--dim);">GW ▽</span>
                        </th>
                        <th onclick="window.reSortL('tot')"
                            style="padding:14px 10px;text-align:center;cursor:pointer;border-bottom:2px solid var(--green);">
                            <span style="font-family:'Rajdhani',sans-serif;font-size:0.9rem;
                                          font-weight:900;color:var(--green);">TOT ▽</span>
                        </th>
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
    body.innerHTML = data.map((t,i)=>`
        <tr onclick="window.showTPitch('${t.entry_id}')"
            style="border-bottom:1px solid var(--border);cursor:pointer;
                   background:${i%2===0?'var(--card)':'var(--card2)'};">
            <td style="padding:13px 14px;">
                <div style="font-weight:900;font-size:1rem;color:var(--text);font-family:'Rajdhani',sans-serif;">${t.team_name}</div>
                <div style="font-size:0.78rem;color:var(--dim);font-family:'Rajdhani',sans-serif;font-weight:600;margin-top:3px;">${t.manager}</div>
            </td>
            <td style="padding:12px 10px;text-align:center;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;">${t.gw_points||0}</td>
            <td style="padding:12px 10px;text-align:center;font-weight:900;color:var(--green);font-family:'Rajdhani',sans-serif;font-size:1.05rem;">${t.total_points||0}</td>
        </tr>`).join('');
}

window.reSortL = (t) => {
    const s = [...window.allLeagues].sort((a,b)=>t==='gw'?(b.gw_points||0)-(a.gw_points||0):(b.total_points||0)-(a.total_points||0));
    displayLeagueRows(s);
};

window.showTPitch = (id) => {
    const t = window.allLeagues.find(x=>x.entry_id==id);
    if (!t) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.onclick = () => modal.remove();

    const lineup   = t.lineup||[];
    const starters = lineup.filter(p=>p.multiplier>0);
    const bench    = lineup.filter(p=>p.multiplier===0);
    const realVC   = starters.find(p=>p.is_vice_captain===true);

    modal.innerHTML = `
        <div class="profile-card" style="width:98%;max-width:400px;padding:15px;
             background:var(--card);border:1px solid rgba(0,255,136,0.2);" onclick="event.stopPropagation()">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
                <div>
                    <h4 style="margin:0;font-size:1.1rem;color:var(--green);font-family:'Rajdhani',sans-serif;font-weight:900;">${t.team_name}</h4>
                    <span style="font-family:'Rajdhani',sans-serif;font-size:0.85rem;color:var(--dim);font-weight:600;">
                        Hit: <span style="color:#ff4444;">-${t.transfer_cost||0}</span> &nbsp;|&nbsp;
                        GW: <span style="color:var(--green);">${t.gw_points}</span>
                    </span>
                </div>
                <div style="background:${t.active_chip?'var(--green)':'var(--card2)'};
                             color:${t.active_chip?'#000':'var(--dim)'};
                             padding:5px 12px;border-radius:6px;font-weight:900;
                             font-size:0.78rem;font-family:'Rajdhani',sans-serif;border:1px solid var(--border);">
                    ${t.active_chip?t.active_chip.toUpperCase():'NO CHIP'}
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
                ${bench.map(p=>`
                    <div style="text-align:center;flex:1;opacity:0.7;">
                        <img src="https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code||0}${p.pos==='GKP'?'_1':''}-66.png"
                             width="34" height="34"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='block';"
                             style="display:block;margin:0 auto;">
                        <svg width="34" height="34" viewBox="0 0 24 24" style="display:none;margin:0 auto;">
                            <path fill="${p.pos==='GKP'?'#ffeb3b':'#aaa'}" d="M13,2V4H11V2H8V4H6V7C6,8.1 6.9,9 8,9V22H16V9C17.1,9 18,8.1 18,7V4H16V2H13Z"/>
                        </svg>
                        <div style="font-size:0.68rem;color:#aaa;font-family:'Rajdhani',sans-serif;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
                        <div style="font-size:0.8rem;color:var(--dim);font-weight:900;font-family:'Rajdhani',sans-serif;">${p.points}</div>
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
                         font-size:0.65rem;padding:1px 5px;border:1px solid var(--green);
                         border-radius:3px;font-weight:900;z-index:5;">${label}</div>`;
        } else if (realVC && p.id===realVC.id) {
            badge = `<div style="position:absolute;top:-10px;right:0;background:#333;color:#aaa;
                         font-size:0.65rem;padding:1px 5px;border:1px solid #555;
                         border-radius:3px;font-weight:900;z-index:5;">V</div>`;
        }
        const score   = (p.points||0)*(p.multiplier||1);
        const kitCode = p.team_code || 0;
        const isGK    = p.pos === 'GKP';
        const kitUrl  = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${kitCode}${isGK?'_1':''}-66.png`;

        return `<div style="text-align:center;width:72px;position:relative;">
            <div style="position:relative;margin-bottom:3px;">${badge}
                <img src="${kitUrl}" width="44" height="44"
                     style="display:block;margin:0 auto;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                <svg width="44" height="44" viewBox="0 0 24 24" style="display:none;margin:0 auto;">
                    <path fill="${isGK?'#ffeb3b':'var(--green)'}" d="M13,2V4H11V2H8V4H6V7C6,8.1 6.9,9 8,9V22H16V9C17.1,9 18,8.1 18,7V4H16V2H13Z"/>
                </svg>
            </div>
            <div style="background:rgba(0,0,0,0.85);color:#fff;font-size:0.62rem;padding:2px 4px;
                         border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                         max-width:100%;font-family:'Rajdhani',sans-serif;font-weight:700;">${p.name}</div>
            <div style="font-size:0.82rem;color:var(--green);font-weight:900;font-family:'Rajdhani',sans-serif;">${score}</div>
        </div>`;
    }).join('');
}
