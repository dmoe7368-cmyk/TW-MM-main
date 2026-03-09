/**
 * tournament.js — TW MM Tournament
 * Purple/Cyan Theme — v12
 */

function renderPointCell(pts, hit, chip) {
    let tags = '';
    if (hit && hit > 0)
        tags += `<div style="color:#f87171;font-size:0.58rem;font-weight:700;margin-top:1px;">-${hit}</div>`;
    if (chip === '3xc')
        tags += `<div style="background:#facc15;color:#000;font-size:0.5rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>`;
    else if (chip === 'bboost')
        tags += `<div style="background:#a78bfa;color:#000;font-size:0.5rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>`;
    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:38px;">
        <span style="color:#ffffff;font-weight:700;font-size:0.85rem;">${pts || 0}</span>${tags}
    </div>`;
}

function rowBg(i)    { return i % 2 === 0 ? '#0d0020' : '#120028'; }
function stickyL(i)  { return i % 2 === 0 ? '#0d0020' : '#120028'; }
function stickyR(i)  { return i % 2 === 0 ? '#100022' : '#14002c'; }

function rankColor(pos) {
    if (pos === 1) return '#fbbf24';
    if (pos === 2) return '#94a3b8';
    if (pos === 3) return '#c4a0ff';
    return '#ffffff';
}

window.renderLeagues = window.renderTournament = function () {
    const main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    main.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:12px 10px;">

            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span style="font-size:1.1rem;">🏆</span>
                <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;
                              color:#7dd8ff;letter-spacing:2px;">LEAGUE STANDINGS</span>
            </div>

            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <button id="btn-divA" onclick="window.filterDivision('Division A')"
                    style="flex:1;padding:6px 8px;border-radius:10px;border:2px solid rgba(251,191,36,0.5);
                           background:rgba(251,191,36,0.12);color:#fbbf24;
                           font-family:'Barlow Condensed',sans-serif;font-weight:800;
                           font-size:0.68rem;letter-spacing:1px;cursor:pointer;
                           display:flex;align-items:center;justify-content:center;gap:5px;transition:0.2s;">
                    ⭐ DIVISION A
                </button>
                <button id="btn-divB" onclick="window.filterDivision('Division B')"
                    style="flex:1;padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);
                           background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);
                           font-family:'Barlow Condensed',sans-serif;font-weight:800;
                           font-size:0.68rem;letter-spacing:1px;cursor:pointer;
                           display:flex;align-items:center;justify-content:center;gap:5px;transition:0.2s;">
                    🥈 DIVISION B
                </button>
            </div>

            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                <div style="background:rgba(80,190,255,0.08);border:1px solid rgba(80,190,255,0.25);
                             border-radius:8px;padding:5px 12px;">
                    <span id="gw-label" style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
                                                font-size:0.72rem;color:#7dd8ff;letter-spacing:1px;">GAMEWEEK —</span>
                </div>
                <div style="flex:1;height:1px;background:rgba(255,255,255,0.07);"></div>
            </div>

            <div id="league-content" style="overflow-x:auto;overflow-y:auto;
                 max-height:calc(100vh - 240px);border-radius:14px;
                 border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </div>
    `;
    setTimeout(() => window.filterDivision('Division A'), 50);
};

window.filterDivision = function (divName) {
    const content = document.getElementById('league-content');
    const btnA    = document.getElementById('btn-divA');
    const btnB    = document.getElementById('btn-divB');
    if (!content) return;

    const isDivA = divName === 'Division A';

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

    content.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    db.collection('tw_mm_tournament')
        .where('division', '==', divName)
        .get()
        .then(snapshot => {
            if (!snapshot || snapshot.empty) {
                content.innerHTML = `<div style="text-align:center;padding:50px;color:rgba(255,255,255,0.3);
                    font-family:'Rajdhani',sans-serif;font-size:0.9rem;">⚠️ No data for ${divName}</div>`;
                return;
            }

            let players = [];
            snapshot.forEach(doc => players.push(doc.data()));
            players.sort((a, b) => (b.total_net || 0) - (a.total_net || 0));

            const sample = players[0] || {};
            const weeks  = [];
            for (let w = 1; w <= 38; w++) {
                if (sample[`gw_${w}_pts`] !== undefined) weeks.push(w);
            }
            const gwCols = weeks.length ? weeks : [29, 30, 31, 32, 33, 34, 35];

            const gwLabel = document.getElementById('gw-label');
            if (gwLabel && gwCols.length)
                gwLabel.textContent = `GW ${gwCols[0]} — GW ${gwCols[gwCols.length - 1]}`;

            const hdrAccent = isDivA ? '#fbbf24' : '#94a3b8';
            const hdrBorder = isDivA ? 'rgba(251,191,36,0.35)' : 'rgba(148,163,184,0.3)';
            const headerBg  = 'rgba(8,0,20,0.97)';

            let html = `
            <table style="width:100%;border-collapse:collapse;min-width:${140 + gwCols.length * 46}px;">
                <thead>
                    <tr style="background:${headerBg};position:sticky;top:0;z-index:4;">
                        <th style="padding:9px 10px;text-align:left;
                                   position:sticky;left:0;top:0;z-index:5;
                                   background:${headerBg};
                                   border-right:1px solid rgba(255,255,255,0.06);
                                   border-bottom:2px solid ${hdrAccent};min-width:145px;">
                            <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;
                                          font-weight:800;color:${hdrAccent};letter-spacing:1.5px;">TEAM / MANAGER</span>
                        </th>
                        ${gwCols.map(w => `
                        <th style="padding:9px 4px;text-align:center;background:${headerBg};
                                   min-width:44px;border-bottom:2px solid ${hdrBorder};">
                            <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;
                                          font-weight:700;color:rgba(255,255,255,0.38);">W${w}</span>
                        </th>`).join('')}
                        <th style="padding:9px 7px;text-align:center;
                                   position:sticky;right:0;top:0;z-index:5;
                                   background:${headerBg};min-width:50px;
                                   border-left:1px solid rgba(255,255,255,0.06);
                                   border-bottom:2px solid ${hdrAccent};">
                            <span style="font-family:'Barlow Condensed',sans-serif;font-size:0.7rem;
                                          font-weight:800;color:${hdrAccent};">TOT</span>
                        </th>
                    </tr>
                </thead>
                <tbody>`;

            players.forEach((p, i) => {
                const pos    = i + 1;
                const rBg    = rowBg(i);
                const nColor = rankColor(pos);
                const lBorder = pos === 1 ? 'border-left:3px solid #fbbf24;'
                              : pos === 2 ? 'border-left:3px solid #94a3b8;'
                              : pos === 3 ? 'border-left:3px solid #c4a0ff;'
                              : 'border-left:3px solid transparent;';

                html += `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.045);background:${rBg};">
                    <td style="padding:9px 10px;text-align:left;position:sticky;left:0;z-index:2;
                               background:${stickyL(i)};${lBorder}
                               border-right:1px solid rgba(255,255,255,0.08);
                               min-width:145px;max-width:145px;overflow:hidden;">
                        <div style="font-weight:800;color:${nColor};font-family:'Rajdhani',sans-serif;
                                    font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">
                            ${pos}. ${p.team || 'Unknown'}
                        </div>
                        <div style="font-size:0.63rem;color:rgba(255,255,255,0.38);font-family:'Rajdhani',sans-serif;
                                    margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${p.name || 'Manager'}
                        </div>
                    </td>
                    ${gwCols.map(w => `
                    <td style="padding:5px 3px;text-align:center;background:${rBg};">
                        ${renderPointCell(p[`gw_${w}_pts`], p[`gw_${w}_hit`], p[`gw_${w}_chip`])}
                    </td>`).join('')}
                    <td style="padding:9px 7px;text-align:center;font-weight:900;
                               color:${nColor};font-size:0.95rem;
                               position:sticky;right:0;z-index:2;
                               background:${stickyR(i)};
                               border-left:1px solid rgba(255,255,255,0.08);
                               font-family:'Barlow Condensed',sans-serif;
                               box-shadow:-2px 0 10px rgba(0,0,0,0.5);">
                        ${p.total_net || 0}
                    </td>
                </tr>`;
            });

            html += `</tbody></table>`;
            content.innerHTML = html;
        })
        .catch(err => {
            content.innerHTML = `<div style="text-align:center;padding:40px;color:#f87171;
                font-family:'Rajdhani',sans-serif;font-size:0.9rem;">❌ ${err.message}</div>`;
        });
};
