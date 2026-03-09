/**
 * scout.js — TW MM Tournament  v13
 * Purple/Cyan Theme
 */

// ── Main render ───────────────────────────────────────────────────────────────
window.renderScout = window.renderScoutHub = async function() {
    var main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    var hdr = '<div style="max-width:600px;margin:0 auto;padding:12px 10px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">'
        + '<span style="font-size:1.1rem;">🔭</span>'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;color:#7dd8ff;letter-spacing:2px;">SCOUT CENTER</span>'
        + '</div>'
        // Tab toggle
        + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        + '<button id="btn-p" onclick="window.switchScoutTab(\'p\')" style="flex:1;padding:6px 8px;border-radius:10px;border:2px solid rgba(80,190,255,0.5);background:rgba(80,190,255,0.13);color:#7dd8ff;font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;transition:0.2s;">🔍 PLAYER SCOUT</button>'
        + '<button id="btn-l" onclick="window.switchScoutTab(\'l\')" style="flex:1;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;transition:0.2s;">🏅 LEAGUE SCOUT</button>'
        + '</div>'
        + '<div id="scout-container"></div>'
        + '</div>';

    main.innerHTML = hdr;
    window.switchScoutTab('p');
};

window.switchScoutTab = function(tab) {
    var btnP = document.getElementById('btn-p');
    var btnL = document.getElementById('btn-l');
    if (!btnP) return;
    if (tab === 'p') {
        btnP.style.background  = 'rgba(80,190,255,0.15)';
        btnP.style.borderColor = 'rgba(80,190,255,0.55)';
        btnP.style.color       = '#7dd8ff';
        btnL.style.background  = 'rgba(255,255,255,0.04)';
        btnL.style.borderColor = 'rgba(255,255,255,0.1)';
        btnL.style.color       = 'rgba(255,255,255,0.35)';
        loadPlayerData();
    } else {
        btnL.style.background  = 'rgba(196,160,255,0.15)';
        btnL.style.borderColor = 'rgba(196,160,255,0.55)';
        btnL.style.color       = '#c4a0ff';
        btnP.style.background  = 'rgba(255,255,255,0.04)';
        btnP.style.borderColor = 'rgba(255,255,255,0.1)';
        btnP.style.color       = 'rgba(255,255,255,0.35)';
        loadLeagueData();
    }
};

// ── Player Scout ──────────────────────────────────────────────────────────────
async function loadPlayerData() {
    var container = document.getElementById('scout-container');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var snapshot = await db.collection('scout_players').orderBy('total_points','desc').get();
    var players = [];
    snapshot.forEach(function(doc) { players.push(Object.assign({id:doc.id}, doc.data())); });
    window.allPlayers = players;
    window.currentFilteredPlayers = players;

    var hBg = '#08001a';
    container.innerHTML =
        // Position filter
        '<div style="display:flex;gap:6px;margin-bottom:12px;overflow-x:auto;padding-bottom:2px;">'
        + ['ALL','GKP','DEF','MID','FWD'].map(function(pos, i) {
            var active = i === 0;
            return '<button class="pos-btn" onclick="window.filterByPos(\'' + pos + '\',this)"'
                + ' style="flex-shrink:0;padding:5px 12px;border-radius:8px;cursor:pointer;transition:0.15s;'
                + 'background:' + (active ? 'rgba(80,190,255,0.15)' : 'rgba(255,255,255,0.05)') + ';'
                + 'color:' + (active ? '#7dd8ff' : 'rgba(255,255,255,0.5)') + ';'
                + 'border:1px solid ' + (active ? 'rgba(80,190,255,0.45)' : 'rgba(255,255,255,0.1)') + ';'
                + 'font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.72rem;letter-spacing:1px;">'
                + pos + '</button>';
          }).join('')
        + '</div>'
        // Table
        + '<div style="border-radius:12px;border:1px solid rgba(80,190,255,0.12);overflow:auto;max-height:calc(100vh - 280px);background:' + hBg + ';">'
        + '<table style="width:100%;border-collapse:collapse;">'
        + '<thead><tr style="background:' + hBg + ';position:sticky;top:0;z-index:3;">'
        + '<th style="padding:10px 12px;text-align:left;background:' + hBg + ';border-bottom:2px solid rgba(80,190,255,0.4);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:#7dd8ff;letter-spacing:1.5px;">PLAYER</span></th>'
        + '<th onclick="window.reSortP(\'gw\')" style="padding:10px 8px;text-align:center;cursor:pointer;background:' + hBg + ';border-bottom:2px solid rgba(255,255,255,0.1);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);">GW ▽</span></th>'
        + '<th onclick="window.reSortP(\'tot\')" style="padding:10px 8px;text-align:center;cursor:pointer;background:' + hBg + ';border-bottom:2px solid rgba(80,190,255,0.4);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:#7dd8ff;">TOT ▽</span></th>'
        + '<th onclick="window.reSortP(\'own\')" style="padding:10px 8px;text-align:center;cursor:pointer;background:' + hBg + ';border-bottom:2px solid rgba(255,255,255,0.1);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);">OWN% ▽</span></th>'
        + '</tr></thead>'
        + '<tbody id="p-body"></tbody>'
        + '</table></div>';

    displayPlayerRows(players);
}

window.filterByPos = function(pos, btn) {
    document.querySelectorAll('.pos-btn').forEach(function(b) {
        b.style.background  = 'rgba(255,255,255,0.05)';
        b.style.color       = 'rgba(255,255,255,0.5)';
        b.style.borderColor = 'rgba(255,255,255,0.1)';
    });
    btn.style.background  = 'rgba(80,190,255,0.15)';
    btn.style.color       = '#7dd8ff';
    btn.style.borderColor = 'rgba(80,190,255,0.45)';
    window.currentFilteredPlayers = pos === 'ALL' ? window.allPlayers : window.allPlayers.filter(function(p){return p.pos===pos;});
    displayPlayerRows(window.currentFilteredPlayers);
};

window.reSortP = function(t) {
    var sorted = window.currentFilteredPlayers.slice();
    if (t === 'gw')  sorted.sort(function(a,b){return (b.gw_points||0)-(a.gw_points||0);});
    if (t === 'tot') sorted.sort(function(a,b){return (b.total_points||0)-(a.total_points||0);});
    if (t === 'own') sorted.sort(function(a,b){return parseFloat(b.ownership||0)-parseFloat(a.ownership||0);});
    displayPlayerRows(sorted);
};

function displayPlayerRows(data) {
    var body = document.getElementById('p-body');
    if (!body) return;
    var html = '';
    for (var i = 0; i < data.length; i++) {
        var p   = data[i];
        var rBg = i % 2 === 0 ? '#0b001e' : '#110025';
        html += '<tr onclick="window.showPDetail(\'' + p.id + '\')" style="border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;background:' + rBg + ';">'
            + '<td style="padding:11px 12px;">'
            + '<div style="font-weight:800;font-size:0.9rem;color:#ffffff;font-family:\'Rajdhani\',sans-serif;">' + p.name + '</div>'
            + '<div style="font-size:0.65rem;color:rgba(255,255,255,0.38);margin-top:2px;font-family:\'Rajdhani\',sans-serif;font-weight:600;">' + p.team + ' | ' + p.pos + ' | £' + p.price + 'm</div>'
            + '</td>'
            + '<td style="padding:10px 8px;text-align:center;color:#ffffff;font-family:\'Rajdhani\',sans-serif;font-size:0.9rem;font-weight:700;">' + (p.gw_points||0) + '</td>'
            + '<td style="padding:10px 8px;text-align:center;font-weight:900;color:#7dd8ff;font-family:\'Barlow Condensed\',sans-serif;font-size:0.95rem;">' + (p.total_points||0) + '</td>'
            + '<td style="padding:10px 8px;text-align:center;color:rgba(255,255,255,0.5);font-family:\'Rajdhani\',sans-serif;font-size:0.82rem;font-weight:700;">' + (p.ownership||'0.0') + '%</td>'
            + '</tr>';
    }
    body.innerHTML = html;
}

// ── Player Detail Modal ───────────────────────────────────────────────────────
window.showPDetail = function(id) {
    var p = window.allPlayers.find(function(x){return x.id===id;});
    if (!p) return;

    var fixtureHtml = '';
    if (p.fixtures && p.fixtures.length) {
        var fx = p.fixtures.slice(0,5);
        for (var i=0;i<fx.length;i++) {
            var f = fx[i];
            fixtureHtml += '<div style="flex:1;background:' + (f.bg||'rgba(255,255,255,0.07)') + ';color:' + (f.text||'#fff') + ';'
                + 'text-align:center;padding:7px 3px;border-radius:6px;font-family:\'Barlow Condensed\',sans-serif;font-size:0.75rem;font-weight:800;min-width:40px;">'
                + '<div>' + (f.opponent||'TBC') + '</div>'
                + '<div style="font-size:0.62rem;opacity:0.75;margin-top:2px;">' + (f.is_home?'H':'A') + '</div>'
                + '</div>';
        }
    } else {
        fixtureHtml = '<div style="color:rgba(255,255,255,0.35);font-family:\'Rajdhani\',sans-serif;font-size:0.8rem;">No fixtures</div>';
    }

    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;';
    modal.onclick = function(e) { if (e.target===modal) modal.remove(); };

    modal.innerHTML =
        '<div onclick="event.stopPropagation()" style="background:#1a0033;border-radius:24px 24px 0 0;width:100%;max-width:480px;border:1px solid rgba(80,190,255,0.2);max-height:85vh;overflow-y:auto;">'
        // Header
        + '<div style="background:linear-gradient(135deg,#3d195b,#1a0033);padding:20px;text-align:center;border-radius:24px 24px 0 0;">'
        + '<h3 style="margin:0 0 4px;font-size:1.2rem;color:#7dd8ff;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;letter-spacing:1px;">' + (p.full_name||p.name) + '</h3>'
        + '<div style="color:rgba(255,255,255,0.5);font-family:\'Rajdhani\',sans-serif;font-size:0.8rem;font-weight:700;letter-spacing:1px;">' + (p.team_full||p.team) + ' | ' + p.pos + '</div>'
        + '</div>'
        // Stats grid
        + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:rgba(255,255,255,0.06);margin:0 16px;border-radius:10px;overflow:hidden;">'
        + statBox('GOALS',   p.goals||0)
        + statBox('ASSISTS', p.assists||0)
        + statBox('CS',      p.clean_sheets||0)
        + statBox('BONUS',   p.bonus||0)
        + statBox('xG',      p.xg||0)
        + statBox('ICT',     p.ict||0)
        + '</div>'
        // Fixtures
        + '<div style="margin:12px 16px;background:rgba(80,190,255,0.06);padding:12px;border-radius:10px;border:1px solid rgba(80,190,255,0.2);">'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:#7dd8ff;margin-bottom:8px;letter-spacing:1px;">NEXT 5 FIXTURES</div>'
        + '<div style="display:flex;gap:5px;">' + fixtureHtml + '</div>'
        + '</div>'
        // Price / Own
        + '<div style="margin:0 16px;background:rgba(255,255,255,0.04);padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;font-family:\'Rajdhani\',sans-serif;font-size:0.88rem;font-weight:700;">'
        + '<span style="color:rgba(255,255,255,0.5);">Price: <b style="color:#fff;">£' + p.price + 'm</b></span>'
        + '<span style="color:rgba(255,255,255,0.5);">Own: <b style="color:#7dd8ff;">' + p.ownership + '%</b></span>'
        + '</div>'
        // Close
        + '<div style="padding:14px 16px;">'
        + '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:0.9rem;letter-spacing:1px;">✕ CLOSE</button>'
        + '</div>'
        + '</div>';

    document.body.appendChild(modal);
};

function statBox(label, val) {
    return '<div style="background:#0e0018;padding:12px 8px;text-align:center;">'
        + '<div style="font-size:0.56rem;color:rgba(255,255,255,0.35);letter-spacing:1px;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;margin-bottom:3px;">' + label + '</div>'
        + '<div style="font-size:1rem;color:#fff;font-weight:800;font-family:\'Barlow Condensed\',sans-serif;">' + val + '</div>'
        + '</div>';
}

// ── League Scout ──────────────────────────────────────────────────────────────
async function loadLeagueData() {
    var container = document.getElementById('scout-container');
    container.innerHTML =
        '<div style="display:flex;gap:8px;margin-bottom:12px;">'
        + '<button id="l-a" onclick="window.fetchL(\'League_A\')" style="flex:1;padding:6px 8px;border-radius:10px;border:2px solid rgba(251,191,36,0.5);background:rgba(251,191,36,0.13);color:#fbbf24;font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;transition:0.2s;">⭐ LEAGUE A</button>'
        + '<button id="l-b" onclick="window.fetchL(\'League_B\')" style="flex:1;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;transition:0.2s;">🥈 LEAGUE B</button>'
        + '</div>'
        + '<div id="l-root"></div>';
    window.fetchL('League_A');
}

window.fetchL = async function(key) {
    var root = document.getElementById('l-root');
    var btnA = document.getElementById('l-a');
    var btnB = document.getElementById('l-b');
    var isA  = key === 'League_A';

    if (btnA) {
        btnA.style.background  = isA  ? 'rgba(251,191,36,0.15)'  : 'rgba(255,255,255,0.04)';
        btnA.style.borderColor = isA  ? 'rgba(251,191,36,0.55)'  : 'rgba(255,255,255,0.1)';
        btnA.style.color       = isA  ? '#fbbf24' : 'rgba(255,255,255,0.35)';
    }
    if (btnB) {
        btnB.style.background  = !isA ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.04)';
        btnB.style.borderColor = !isA ? 'rgba(148,163,184,0.5)'  : 'rgba(255,255,255,0.1)';
        btnB.style.color       = !isA ? '#94a3b8' : 'rgba(255,255,255,0.35)';
    }

    root.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var hBg  = '#08001a';
    var snap = await db.collection('scout_' + key).orderBy('total_points','desc').get();
    var teams = [];
    snap.forEach(function(d){ teams.push(d.data()); });
    window.allLeagues = teams;

    root.innerHTML =
        '<div style="border-radius:12px;border:1px solid rgba(80,190,255,0.12);overflow:auto;max-height:calc(100vh - 300px);background:' + hBg + ';">'
        + '<table style="width:100%;border-collapse:collapse;">'
        + '<thead><tr style="background:' + hBg + ';position:sticky;top:0;z-index:3;">'
        + '<th style="padding:10px 12px;text-align:left;background:' + hBg + ';border-bottom:2px solid rgba(80,190,255,0.4);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:#7dd8ff;letter-spacing:1.5px;">MANAGER</span></th>'
        + '<th onclick="window.reSortL(\'gw\')" style="padding:10px 8px;text-align:center;cursor:pointer;background:' + hBg + ';border-bottom:2px solid rgba(255,255,255,0.1);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.4);">GW ▽</span></th>'
        + '<th onclick="window.reSortL(\'tot\')" style="padding:10px 8px;text-align:center;cursor:pointer;background:' + hBg + ';border-bottom:2px solid rgba(80,190,255,0.4);">'
        + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:#7dd8ff;">TOT ▽</span></th>'
        + '</tr></thead>'
        + '<tbody id="l-body"></tbody>'
        + '</table></div>';

    displayLeagueRows(teams);
};

function displayLeagueRows(data) {
    var body = document.getElementById('l-body');
    if (!body) return;
    var html = '';
    for (var i=0;i<data.length;i++) {
        var t   = data[i];
        var rBg = i%2===0 ? '#0b001e' : '#110025';
        html += '<tr onclick="window.showTPitch(\'' + t.entry_id + '\')" style="border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;background:' + rBg + ';">'
            + '<td style="padding:11px 12px;">'
            + '<div style="font-weight:900;font-size:0.9rem;color:#ffffff;font-family:\'Rajdhani\',sans-serif;">' + t.team_name + '</div>'
            + '<div style="font-size:0.65rem;color:rgba(255,255,255,0.38);font-family:\'Rajdhani\',sans-serif;font-weight:600;margin-top:2px;">' + t.manager + '</div>'
            + '</td>'
            + '<td style="padding:10px 8px;text-align:center;color:#fff;font-family:\'Rajdhani\',sans-serif;font-size:0.9rem;font-weight:700;">' + (t.gw_points||0) + '</td>'
            + '<td style="padding:10px 8px;text-align:center;font-weight:900;color:#7dd8ff;font-family:\'Barlow Condensed\',sans-serif;font-size:0.95rem;">' + (t.total_points||0) + '</td>'
            + '</tr>';
    }
    body.innerHTML = html;
}

window.reSortL = function(t) {
    var s = window.allLeagues.slice().sort(function(a,b){return t==='gw'?(b.gw_points||0)-(a.gw_points||0):(b.total_points||0)-(a.total_points||0);});
    displayLeagueRows(s);
};

// ── Team Pitch Modal ──────────────────────────────────────────────────────────
window.showTPitch = function(id) {
    var t = window.allLeagues.find(function(x){return x.entry_id==id;});
    if (!t) return;

    var lineup   = t.lineup || [];
    var starters = lineup.filter(function(p){return p.multiplier > 0;});
    var bench    = lineup.filter(function(p){return p.multiplier === 0;});
    var realVC   = starters.find(function(p){return p.is_vice_captain === true;});

    var modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.88);backdrop-filter:blur(8px);display:flex;align-items:flex-end;justify-content:center;';
    modal.onclick = function(e){ if(e.target===modal) modal.remove(); };

    var chipLabel = t.active_chip ? t.active_chip.toUpperCase() : 'NO CHIP';
    var chipBg    = t.active_chip ? 'rgba(196,160,255,0.2)' : 'rgba(255,255,255,0.06)';
    var chipColor = t.active_chip ? '#c4a0ff' : 'rgba(255,255,255,0.35)';
    var chipBdr   = t.active_chip ? 'rgba(196,160,255,0.4)' : 'rgba(255,255,255,0.1)';

    var pitchRows = [
        starters.filter(function(p){return p.pos==='FWD';}),
        starters.filter(function(p){return p.pos==='MID';}),
        starters.filter(function(p){return p.pos==='DEF';}),
        starters.filter(function(p){return p.pos==='GKP';})
    ];

    var pitchHtml = '';
    for (var ri=0;ri<pitchRows.length;ri++) {
        pitchHtml += '<div style="display:flex;justify-content:center;gap:6px;padding:4px 0;">'
            + renderPitchRow(pitchRows[ri], realVC)
            + '</div>';
    }

    var benchHtml = '';
    for (var bi=0;bi<bench.length;bi++) {
        var bp = bench[bi];
        var kitUrl = 'https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_' + (bp.team_code||0) + (bp.pos==='GKP'?'_1':'') + '-66.png';
        benchHtml += '<div style="text-align:center;flex:1;opacity:0.65;">'
            + '<img src="' + kitUrl + '" width="32" height="32" style="display:block;margin:0 auto;" onerror="this.style.opacity=\'0\'">'
            + '<div style="font-size:0.62rem;color:rgba(255,255,255,0.5);font-family:\'Rajdhani\',sans-serif;font-weight:700;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56px;">' + bp.name + '</div>'
            + '<div style="font-size:0.78rem;color:rgba(255,255,255,0.7);font-weight:900;font-family:\'Barlow Condensed\',sans-serif;">' + (bp.points||0) + '</div>'
            + '</div>';
    }

    modal.innerHTML =
        '<div onclick="event.stopPropagation()" style="background:#1a0033;border-radius:24px 24px 0 0;width:100%;max-width:480px;border:1px solid rgba(80,190,255,0.2);max-height:90vh;overflow-y:auto;">'
        // Header
        + '<div style="background:linear-gradient(135deg,#3d195b,#1a0033);padding:16px 20px;border-radius:24px 24px 0 0;display:flex;justify-content:space-between;align-items:center;">'
        + '<div>'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:1.1rem;color:#7dd8ff;">' + t.team_name + '</div>'
        + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:0.75rem;color:rgba(255,255,255,0.45);margin-top:2px;">'
        + 'Hit: <span style="color:#f87171;">-' + (t.transfer_cost||0) + '</span>'
        + ' &nbsp;|&nbsp; GW: <span style="color:#7dd8ff;">' + (t.gw_points||0) + '</span>'
        + '</div>'
        + '</div>'
        + '<div style="background:' + chipBg + ';color:' + chipColor + ';padding:5px 12px;border-radius:8px;font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:0.72rem;letter-spacing:1px;border:1px solid ' + chipBdr + ';">' + chipLabel + '</div>'
        + '</div>'
        // Pitch
        + '<div style="background:linear-gradient(180deg,#0a2e0a 0%,#051a05 100%);margin:12px 12px 0;border-radius:10px;padding:14px 6px;border:1px solid rgba(80,190,255,0.1);">'
        + pitchHtml
        + '</div>'
        // Bench
        + '<div style="margin:10px 12px;background:rgba(0,0,0,0.4);padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);">'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.6rem;color:rgba(255,255,255,0.3);letter-spacing:1px;margin-bottom:8px;text-align:center;">BENCH</div>'
        + '<div style="display:flex;justify-content:space-around;gap:4px;">' + benchHtml + '</div>'
        + '</div>'
        // Close
        + '<div style="padding:12px 16px;">'
        + '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:0.9rem;letter-spacing:1px;">✕ CLOSE</button>'
        + '</div>'
        + '</div>';

    document.body.appendChild(modal);
};

function renderPitchRow(arr, realVC) {
    var html = '';
    for (var i=0;i<arr.length;i++) {
        var p       = arr[i];
        var isC     = p.is_captain;
        var isVC    = realVC && p.id === realVC.id;
        var isTC    = isC && p.multiplier === 3;
        var score   = (p.points||0) * (p.multiplier||1);
        var kitUrl  = 'https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_' + (p.team_code||0) + (p.pos==='GKP'?'_1':'') + '-66.png';

        var badge = '';
        if (isTC)        badge = '<div style="position:absolute;top:-9px;right:0;background:#a78bfa;color:#fff;font-size:0.58rem;padding:1px 5px;border-radius:3px;font-weight:900;z-index:5;border:1px solid rgba(255,255,255,0.3);">TC</div>';
        else if (isC)    badge = '<div style="position:absolute;top:-9px;right:0;background:#fbbf24;color:#000;font-size:0.58rem;padding:1px 5px;border-radius:3px;font-weight:900;z-index:5;">C</div>';
        else if (isVC)   badge = '<div style="position:absolute;top:-9px;right:0;background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:0.58rem;padding:1px 5px;border-radius:3px;font-weight:900;z-index:5;border:1px solid rgba(255,255,255,0.2);">V</div>';

        // Score color
        var sColor = score >= 10 ? '#fbbf24' : score >= 6 ? '#7dd8ff' : '#ffffff';

        html += '<div style="text-align:center;width:68px;position:relative;">'
            + '<div style="position:relative;margin-bottom:3px;">'
            + badge
            + '<img src="' + kitUrl + '" width="42" height="42" style="display:block;margin:0 auto;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));" onerror="this.style.opacity=\'0\'">'
            + '</div>'
            + '<div style="background:rgba(0,0,0,0.88);color:#fff;font-size:0.6rem;padding:2px 4px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-family:\'Rajdhani\',sans-serif;font-weight:700;">' + p.name + '</div>'
            + '<div style="font-size:0.82rem;color:' + sColor + ';font-weight:900;font-family:\'Barlow Condensed\',sans-serif;">' + score + '</div>'
            + '</div>';
    }
    return html;
}
