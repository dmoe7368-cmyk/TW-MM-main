/**
 * live-hub.js — TW FA Cup Bracket  v13
 * Purple/Cyan Theme
 */

function renderPlayoffScore(pts, hit, chip) {
    // chip badge
    var chipTag = '';
    if (chip === '3xc')
        chipTag = '<div style="background:#facc15;color:#000;font-size:0.55rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>';
    else if (chip === 'bboost')
        chipTag = '<div style="background:#a78bfa;color:#000;font-size:0.55rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>';
    else if (chip === 'freehit')
        chipTag = '<div style="background:#7dd8ff;color:#000;font-size:0.55rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">FH</div>';
    else if (chip === 'wildcard')
        chipTag = '<div style="background:#c4a0ff;color:#000;font-size:0.55rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">WC</div>';

    // hit badge
    var hitTag = hit > 0
        ? '<span style="color:#f87171;font-size:0.65rem;font-weight:700;margin-left:4px;">-' + hit + '</span>'
        : '';

    return '<div style="display:flex;flex-direction:column;align-items:flex-end;">'
        + '<div style="display:flex;align-items:center;">'
        + '<span style="font-weight:900;color:#7dd8ff;font-family:\'Barlow Condensed\',sans-serif;font-size:1.3rem;">'
        + (pts !== undefined && pts !== null ? pts : '—') + '</span>'
        + hitTag
        + '</div>'
        + chipTag
        + '</div>';
}

// Tiebreak row helper
function renderTiebreak(m) {
    if (m.home_pts === undefined || m.away_pts === undefined) return '';
    if (m.home_pts !== m.away_pts) return '';

    // pts တူမှ tiebreak ပြ
    var rows = '';

    function tbRow(icon, label, hVal, aVal) {
        var hv = hVal || 0, av = aVal || 0;
        var result = hv > av ? '← Home' : hv < av ? 'Away →' : 'TIE';
        var rColor = hv > av ? '#7dd8ff' : hv < av ? '#c4a0ff' : '#fbbf24';
        return '<div style="display:flex;justify-content:space-between;align-items:center;'
            + 'padding:5px 10px;border-radius:7px;background:rgba(255,255,255,0.04);margin-bottom:4px;">'
            + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.72rem;'
            + 'color:rgba(255,255,255,0.5);font-weight:700;">' + icon + ' ' + label + '</span>'
            + '<div style="display:flex;align-items:center;gap:10px;">'
            + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.85rem;'
            + 'font-weight:900;color:#7dd8ff;">' + hv + '</span>'
            + '<span style="font-size:0.6rem;color:rgba(255,255,255,0.25);">vs</span>'
            + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.85rem;'
            + 'font-weight:900;color:#c4a0ff;">' + av + '</span>'
            + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.72rem;'
            + 'font-weight:900;color:' + rColor + ';min-width:44px;text-align:right;">' + result + '</span>'
            + '</div></div>';
    }

    rows += tbRow('👑', 'CAP',  m.home_cap_pts,  m.away_cap_pts);

    // cap ပဲ တူရင် vcap ပြ
    if ((m.home_cap_pts || 0) === (m.away_cap_pts || 0)) {
        rows += tbRow('🥈', 'VCAP', m.home_vcap_pts, m.away_vcap_pts);

        // vcap လဲ တူရင် GK ပြ
        if ((m.home_vcap_pts || 0) === (m.away_vcap_pts || 0)) {
            rows += tbRow('🥅', 'GK',   m.home_gk_pts,  m.away_gk_pts);
        }
    }

    return '<div style="margin-top:8px;padding:8px;border-radius:9px;'
        + 'border:1px solid rgba(251,191,36,0.25);background:rgba(251,191,36,0.04);">'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.6rem;'
        + 'color:#fbbf24;letter-spacing:2px;font-weight:900;margin-bottom:6px;">⚖️ TIEBREAKER</div>'
        + rows
        + '</div>';
}

window.renderLiveHub = window.renderMatches = function() {
    var main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    main.innerHTML =
        '<div style="max-width:600px;margin:0 auto;padding:12px 10px;">'

        // Header card
        + '<div style="display:flex;align-items:center;justify-content:space-between;'
        + 'padding:12px 16px;margin-bottom:12px;'
        + 'background:rgba(255,255,255,0.04);border-radius:14px;'
        + 'border:1px solid rgba(80,190,255,0.15);">'

        + '<div style="display:flex;align-items:center;gap:10px;">'
        + '<span style="font-size:1.3rem;">🏟️</span>'
        + '<div>'
        + '<div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:1.1rem;color:#7dd8ff;letter-spacing:2px;line-height:1.1;">TW FA CUP</div>'
        + '<div style="font-family:\'Rajdhani\',sans-serif;font-size:0.62rem;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;">KNOCKOUT BRACKET</div>'
        + '</div>'
        + '</div>'

        // GW badge
        + '<div style="background:rgba(80,190,255,0.08);border:1px solid rgba(80,190,255,0.28);border-radius:20px;padding:5px 12px;">'
        + '<span id="fa-week-label" style="font-family:\'Barlow Condensed\',sans-serif;font-weight:800;font-size:0.75rem;color:#7dd8ff;letter-spacing:1px;">GW —</span>'
        + '</div>'
        + '</div>'

        // Bracket container
        + '<div id="playoff-bracket-container" style="display:flex;flex-direction:column;gap:20px;padding-bottom:20px;">'
        + '<div class="loading"><div class="spinner"></div></div>'
        + '</div>'
        + '</div>';

    loadFACupBracket();
};

function loadFACupBracket() {
    var container = document.getElementById('playoff-bracket-container');
    if (!container) return;

    db.collection('tw_fa_playoff').onSnapshot(function(snapshot) {
        var matches = [];
        snapshot.forEach(function(doc) { matches.push(doc.data()); });

        // Auto GW from data
        var gws = matches.map(function(m){return m.gw;}).filter(Boolean);
        if (gws.length) {
            var el = document.getElementById('fa-week-label');
            if (el) el.textContent = 'GW ' + gws[0];
        }

        var stages = [
            { key:'R16',   label:'ROUND OF 16',    count:8, accent:'rgba(255,255,255,0.25)' },
            { key:'QF',    label:'QUARTER-FINALS',  count:4, accent:'rgba(255,255,255,0.45)' },
            { key:'SF',    label:'SEMI-FINALS',     count:2, accent:'#7dd8ff' },
            { key:'Final', label:'🏆 GRAND FINAL',  count:1, accent:'#fbbf24' },
        ];

        var html = '';

        for (var si = 0; si < stages.length; si++) {
            var stage = stages[si];
            var stageMatches = matches.filter(function(m){ return m.match_id && m.match_id.indexOf(stage.key) === 0; });
            var isFinal = stage.key === 'Final';

            // Stage divider
            html += '<div>'
                + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
                + '<div style="height:1px;flex:1;background:linear-gradient(to right,transparent,rgba(255,255,255,0.08));"></div>'
                + '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:' + (isFinal ? '0.9rem' : '0.72rem') + ';font-weight:900;letter-spacing:2px;color:' + stage.accent + ';white-space:nowrap;">' + stage.label + '</span>'
                + '<div style="height:1px;flex:1;background:linear-gradient(to left,transparent,rgba(255,255,255,0.08));"></div>'
                + '</div>'
                + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">';

            for (var i = 1; i <= stage.count; i++) {
                var matchId  = stage.key + '_' + (i < 10 ? '0' + i : '' + i);
                var m        = stageMatches.find(function(x){ return x.match_id === matchId; }) || {};
                var isLive   = m.status === 'live';
                var isDone   = m.status === 'done';
                var homeWon  = isDone && m.winner && m.winner === m.home_name;
                var awayWon  = isDone && m.winner && m.winner === m.away_name;

                var cardBdr  = isLive  ? 'rgba(248,113,113,0.55)'
                             : isFinal ? 'rgba(251,191,36,0.35)'
                             : 'rgba(255,255,255,0.07)';
                var cardBg   = isFinal ? 'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(255,255,255,0.03))'
                             : 'rgba(255,255,255,0.03)';

                html += '<div style="background:' + cardBg + ';border:1px solid ' + cardBdr + ';border-radius:14px;padding:14px;position:relative;overflow:hidden;">';

                // LIVE tag
                if (isLive)
                    html += '<div style="position:absolute;top:0;left:12px;background:#f87171;color:#fff;font-family:\'Barlow Condensed\',sans-serif;font-size:0.65rem;font-weight:900;padding:3px 10px;border-radius:0 0 7px 7px;letter-spacing:1px;">● LIVE</div>';
                if (isFinal)
                    html += '<div style="position:absolute;top:0;right:12px;background:#fbbf24;color:#000;font-family:\'Barlow Condensed\',sans-serif;font-size:0.65rem;font-weight:900;padding:3px 10px;border-radius:0 0 7px 7px;letter-spacing:1px;">FINAL</div>';

                // Match label
                html += '<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:0.62rem;font-weight:800;color:rgba(255,255,255,0.3);letter-spacing:1.5px;margin-bottom:10px;' + (isLive || isFinal ? 'margin-top:12px;' : '') + '">MATCH ' + i + '</div>';

                // Home row
                html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + (homeWon ? '<span style="color:#7dd8ff;font-size:0.8rem;font-weight:900;">✓</span>' : '')
                    + '<span style="font-family:\'Rajdhani\',sans-serif;font-size:0.95rem;font-weight:' + (homeWon ? '900' : '700') + ';color:' + (homeWon ? '#7dd8ff' : (m.home_name ? '#ffffff' : 'rgba(255,255,255,0.3)')) + ';">'
                    + (m.home_name || 'TBD') + '</span>'
                    + '</div>'
                    + (m.home_pts !== undefined ? renderPlayoffScore(m.home_pts, m.home_hit || 0, m.home_chip)
                       : '<span style="color:rgba(255,255,255,0.2);font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;">0</span>')
                    + '</div>';

                // Divider
                html += '<div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:8px;"></div>';

                // Away row
                html += '<div style="display:flex;justify-content:space-between;align-items:center;">'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + (awayWon ? '<span style="color:#7dd8ff;font-size:0.8rem;font-weight:900;">✓</span>' : '')
                    + '<span style="font-family:\'Rajdhani\',sans-serif;font-size:0.95rem;font-weight:' + (awayWon ? '900' : '700') + ';color:' + (awayWon ? '#7dd8ff' : (m.away_name ? '#ffffff' : 'rgba(255,255,255,0.3)')) + ';">'
                    + (m.away_name || 'TBD') + '</span>'
                    + '</div>'
                    + (m.away_pts !== undefined ? renderPlayoffScore(m.away_pts, m.away_hit || 0, m.away_chip)
                       : '<span style="color:rgba(255,255,255,0.2);font-family:\'Barlow Condensed\',sans-serif;font-size:1rem;">0</span>')
                    + '</div>';

                // Tiebreak row
                if (m.home_pts !== undefined) html += renderTiebreak(m);

                html += '</div>'; // card
            }

            html += '</div></div>'; // grid + stage
        }

        container.innerHTML = html;
    });
}
