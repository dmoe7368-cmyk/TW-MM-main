/**
 * tournament.js — TW MM Tournament  v13
 */

function renderPointCell(pts, hit, chip) {
    let tags = '';
    if (hit && hit > 0)
        tags += '<div style="color:#f87171;font-size:0.58rem;font-weight:700;margin-top:1px;">-' + hit + '</div>';
    if (chip === '3xc')
        tags += '<div style="background:#facc15;color:#000;font-size:0.5rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>';
    else if (chip === 'bboost')
        tags += '<div style="background:#a78bfa;color:#000;font-size:0.5rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>';
    return '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:38px;">'
         + '<span style="color:#ffffff;font-weight:700;font-size:0.85rem;">' + (pts || 0) + '</span>' + tags
         + '</div>';
}

function rankColor(pos) {
    if (pos === 1) return '#fbbf24';
    if (pos === 2) return '#94a3b8';
    if (pos === 3) return '#c4a0ff';
    return '#ffffff';
}

window.renderLeagues = window.renderTournament = function () {
    var main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    main.innerHTML =
        '<div style="max-width:600px;margin:0 auto;padding:12px 10px;">' +

        // Header
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
        '<span style="font-size:1.1rem;">🏆</span>' +
        '<span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:1rem;color:#7dd8ff;letter-spacing:2px;">LEAGUE STANDINGS</span>' +
        '</div>' +

        // Division tabs
        '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<button id="btn-divA" onclick="window.filterDivision(\'Division A\')" style="flex:1;padding:6px 8px;border-radius:10px;border:2px solid rgba(251,191,36,0.55);background:rgba(251,191,36,0.13);color:#fbbf24;font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:0.2s;">⭐ DIVISION A</button>' +
        '<button id="btn-divB" onclick="window.filterDivision(\'Division B\')" style="flex:1;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.68rem;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:0.2s;">🥈 DIVISION B</button>' +
        '</div>' +

        // GW badge
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
        '<div style="background:rgba(80,190,255,0.08);border:1px solid rgba(80,190,255,0.25);border-radius:8px;padding:5px 12px;">' +
        '<span id="gw-label" style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:0.72rem;color:#7dd8ff;letter-spacing:1px;">GAMEWEEK —</span>' +
        '</div>' +
        '<div style="flex:1;height:1px;background:rgba(255,255,255,0.07);"></div>' +
        '</div>' +

        // Table container
        '<div id="league-content" style="overflow-x:auto;overflow-y:auto;max-height:calc(100vh - 240px);border-radius:14px;border:1px solid rgba(80,190,255,0.12);background:#080015;">' +
        '<div class="loading"><div class="spinner"></div></div>' +
        '</div>' +
        '</div>';

    setTimeout(function() { window.filterDivision('Division A'); }, 50);
};

window.filterDivision = function (divName) {
    var content = document.getElementById('league-content');
    var btnA    = document.getElementById('btn-divA');
    var btnB    = document.getElementById('btn-divB');
    if (!content) return;

    var isDivA = divName === 'Division A';

    if (btnA) {
        btnA.style.background  = isDivA ? 'rgba(251,191,36,0.15)'  : 'rgba(255,255,255,0.04)';
        btnA.style.borderColor = isDivA ? 'rgba(251,191,36,0.55)'  : 'rgba(255,255,255,0.1)';
        btnA.style.color       = isDivA ? '#fbbf24' : 'rgba(255,255,255,0.35)';
    }
    if (btnB) {
        btnB.style.background  = !isDivA ? 'rgba(148,163,184,0.15)' : 'rgba(255,255,255,0.04)';
        btnB.style.borderColor = !isDivA ? 'rgba(148,163,184,0.5)'  : 'rgba(255,255,255,0.1)';
        btnB.style.color       = !isDivA ? '#94a3b8' : 'rgba(255,255,255,0.35)';
    }

    content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    var hdrAccent = isDivA ? '#fbbf24' : '#94a3b8';
    var hdrBorder = isDivA ? 'rgba(251,191,36,0.35)' : 'rgba(148,163,184,0.3)';
    var headerBg  = '#08001a';

    db.collection('tw_mm_tournament')
        .where('division', '==', divName)
        .get()
        .then(function(snapshot) {
            if (!snapshot || snapshot.empty) {
                content.innerHTML = '<div style="text-align:center;padding:50px;color:rgba(255,255,255,0.3);font-family:\'Rajdhani\',sans-serif;font-size:0.9rem;">⚠️ No data for ' + divName + '</div>';
                return;
            }

            var players = [];
            snapshot.forEach(function(doc) { players.push(doc.data()); });
            players.sort(function(a, b) { return (b.total_net || 0) - (a.total_net || 0); });

            var sample = players[0] || {};
            var weeks  = [];
            for (var w = 1; w <= 38; w++) {
                if (sample['gw_' + w + '_pts'] !== undefined) weeks.push(w);
            }
            var gwCols = weeks.length ? weeks : [29, 30, 31, 32, 33, 34, 35];

            var gwLabel = document.getElementById('gw-label');
            if (gwLabel && gwCols.length)
                gwLabel.textContent = 'GW ' + gwCols[0] + ' — GW ' + gwCols[gwCols.length - 1];

            // Build table
            var html = '<table style="width:100%;border-collapse:collapse;min-width:' + (140 + gwCols.length * 46) + 'px;">';

            // THEAD
            html += '<thead><tr style="background:' + headerBg + ';position:sticky;top:0;z-index:4;">';
            html += '<th style="padding:9px 10px;text-align:left;position:sticky;left:0;top:0;z-index:5;background:' + headerBg + ';border-right:1px solid rgba(255,255,255,0.07);border-bottom:2px solid ' + hdrAccent + ';min-width:145px;">';
            html += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:' + hdrAccent + ';letter-spacing:1.5px;">TEAM / MANAGER</span></th>';
            for (var wi = 0; wi < gwCols.length; wi++) {
                html += '<th style="padding:9px 4px;text-align:center;background:' + headerBg + ';min-width:44px;border-bottom:2px solid ' + hdrBorder + ';">';
                html += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:700;color:rgba(255,255,255,0.38);">W' + gwCols[wi] + '</span></th>';
            }
            html += '<th style="padding:9px 7px;text-align:center;position:sticky;right:0;top:0;z-index:5;background:' + headerBg + ';min-width:50px;border-left:1px solid rgba(255,255,255,0.07);border-bottom:2px solid ' + hdrAccent + ';">';
            html += '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.7rem;font-weight:800;color:' + hdrAccent + ';">TOT</span></th>';
            html += '</tr></thead><tbody>';

            // ROWS
            for (var i = 0; i < players.length; i++) {
                var p      = players[i];
                var pos    = i + 1;
                var rBg    = i % 2 === 0 ? '#0b001e' : '#110025';
                var stL    = i % 2 === 0 ? '#0b001e' : '#110025';
                var stR    = i % 2 === 0 ? '#0e0024' : '#14002c';
                var nColor = rankColor(pos);
                var lBdr   = pos === 1 ? 'border-left:3px solid #fbbf24;'
                           : pos === 2 ? 'border-left:3px solid #94a3b8;'
                           : pos === 3 ? 'border-left:3px solid #c4a0ff;'
                           : 'border-left:3px solid transparent;';

                html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);background:' + rBg + ';">';

                // Sticky left — team
                html += '<td style="padding:9px 10px;text-align:left;position:sticky;left:0;z-index:2;background:' + stL + ';' + lBdr + 'border-right:1px solid rgba(255,255,255,0.07);min-width:145px;max-width:145px;overflow:hidden;">';
                html += '<div style="font-weight:800;color:' + nColor + ';font-family:\'Rajdhani\',sans-serif;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">' + pos + '. ' + (p.team || 'Unknown') + '</div>';
                html += '<div style="font-size:0.63rem;color:rgba(255,255,255,0.38);font-family:\'Rajdhani\',sans-serif;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (p.name || 'Manager') + '</div>';
                html += '</td>';

                // GW point cells
                for (var wj = 0; wj < gwCols.length; wj++) {
                    var gw = gwCols[wj];
                    html += '<td style="padding:5px 3px;text-align:center;background:' + rBg + ';">';
                    html += renderPointCell(p['gw_' + gw + '_pts'], p['gw_' + gw + '_hit'], p['gw_' + gw + '_chip']);
                    html += '</td>';
                }

                // Sticky right — total
                html += '<td style="padding:9px 7px;text-align:center;font-weight:900;color:' + nColor + ';font-size:0.95rem;position:sticky;right:0;z-index:2;background:' + stR + ';border-left:1px solid rgba(255,255,255,0.07);font-family:\'Barlow Condensed\',sans-serif;box-shadow:-3px 0 12px rgba(0,0,0,0.8);">';
                html += (p.total_net || 0) + '</td>';

                html += '</tr>';
            }

            html += '</tbody></table>';
            content.innerHTML = html;
        })
        .catch(function(err) {
            content.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171;font-family:\'Rajdhani\',sans-serif;font-size:0.9rem;">❌ ' + err.message + '</div>';
        });
};
