/**
 * tournament.js — TW MM Tournament
 * Green Theme Version
 */

function renderPointCell(pts, hit, chip) {
    let tags = '';
    if (hit && hit > 0) {
        tags += `<div style="color:#ff4d4d;font-size:0.55rem;font-weight:700;margin-top:1px;">-${hit}</div>`;
    }
    if (chip === '3xc') {
        tags += `<div style="background:#e1ff00;color:#000;font-size:0.45rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>`;
    } else if (chip === 'bboost') {
        tags += `<div style="background:#00ffcc;color:#000;font-size:0.45rem;padding:1px 4px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>`;
    }
    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:38px;">
        <span style="color:#e8ffe8;font-weight:600;font-size:0.82rem;">${pts || 0}</span>${tags}
    </div>`;
}

window.renderLeagues = function() {
    const mainRoot = document.getElementById('main-root');
    if (!mainRoot) return;

    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 12px;">

            <!-- Header -->
            <div class="section-title">🏆 League Standings</div>

            <!-- Division Toggle -->
            <div style="display:flex;background:#000;padding:4px;border-radius:40px;
                        margin-bottom:18px;border:1px solid var(--border);">
                <button id="btn-divA" onclick="window.filterDivision('Division A')"
                    style="flex:1;padding:11px;border:none;border-radius:40px;font-weight:800;
                           cursor:pointer;transition:0.2s;background:var(--green);color:#000;
                           font-family:'Rajdhani',sans-serif;font-size:0.8rem;letter-spacing:1px;">
                    ⭐ DIVISION A
                </button>
                <button id="btn-divB" onclick="window.filterDivision('Division B')"
                    style="flex:1;padding:11px;border:none;border-radius:40px;font-weight:800;
                           cursor:pointer;transition:0.2s;background:transparent;color:var(--dim);
                           font-family:'Rajdhani',sans-serif;font-size:0.8rem;letter-spacing:1px;">
                    🥈 DIVISION B
                </button>
            </div>

            <!-- Current GW badge -->
            <div id="gw-badge" style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
                <div style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);
                             border-radius:8px;padding:6px 14px;display:flex;align-items:center;gap:6px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span id="gw-label" style="font-family:'Share Tech Mono',monospace;font-size:0.62rem;
                                                color:var(--green);letter-spacing:1px;">GAMEWEEK —</span>
                </div>
                <div style="flex:1;height:1px;background:var(--border);"></div>
            </div>

            <!-- Table -->
            <div id="league-content" style="overflow-x:auto;border-radius:14px;
                 border:1px solid var(--border);background:var(--card);">
                <div class="loading"><div class="spinner"></div></div>
            </div>
        </div>
    `;
    setTimeout(() => window.filterDivision('Division A'), 50);
};

window.filterDivision = function(divName) {
    const content = document.getElementById('league-content');
    const btnA    = document.getElementById('btn-divA');
    const btnB    = document.getElementById('btn-divB');
    if (!content) return;

    const isDivA = divName === 'Division A';

    btnA.style.background = isDivA ? 'var(--green)' : 'transparent';
    btnA.style.color      = isDivA ? '#000' : 'var(--dim)';
    btnB.style.background = !isDivA ? 'var(--green)' : 'transparent';
    btnB.style.color      = !isDivA ? '#000' : 'var(--dim)';

    db.collection("tw_mm_tournament")
      .where("division", "==", divName)
      .onSnapshot(snapshot => {
        if (!snapshot || snapshot.empty) {
            content.innerHTML = `<div style="text-align:center;padding:50px;color:var(--dim);
                font-family:'Share Tech Mono',monospace;font-size:0.7rem;">NO DATA FOUND</div>`;
            return;
        }

        let players = [];
        snapshot.forEach(doc => players.push(doc.data()));
        players.sort((a,b) => (b.total_net||0) - (a.total_net||0));

        // GW columns — detect from data
        const gwKeys = [];
        const sample = players[0] || {};
        for (let w = 1; w <= 38; w++) {
            if (sample[`gw_${w}_pts`] !== undefined) gwKeys.push(w);
        }
        // fallback hardcoded if no dynamic keys
        const weeks = gwKeys.length ? gwKeys : [23,24,25,26,27,28,29];

        // Update GW badge
        const gwLabel = document.getElementById('gw-label');
        if (gwLabel && weeks.length) gwLabel.textContent = `GW ${weeks[0]} — GW ${weeks[weeks.length-1]}`;

        const thColor = 'var(--green)';

        let html = `<table style="width:100%;border-collapse:collapse;font-size:0.75rem;min-width:${140 + weeks.length*60}px;">
            <thead>
                <tr style="background:var(--card2);">
                    <th style="padding:13px 12px;text-align:left;position:sticky;left:0;
                               background:var(--card2);z-index:3;border-right:1px solid var(--border);
                               border-bottom:2px solid var(--green);min-width:130px;
                               font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                               color:var(--green);letter-spacing:1px;">TEAM / MANAGER</th>
                    ${weeks.map(w => `
                    <th style="padding:10px 6px;text-align:center;border-bottom:2px solid var(--border);
                               font-family:'Share Tech Mono',monospace;font-size:0.58rem;
                               color:var(--dim);letter-spacing:1px;white-space:nowrap;">W${w}</th>`).join('')}
                    <th style="padding:10px 8px;text-align:center;border-bottom:2px solid var(--green);
                               background:rgba(0,255,136,0.08);font-family:'Share Tech Mono',monospace;
                               font-size:0.6rem;color:var(--green);letter-spacing:1px;">TOTAL</th>
                </tr>
            </thead>
            <tbody>`;

        players.forEach((p, i) => {
            const pos      = i + 1;
            const isTop3   = pos <= 3;
            const medals   = ['🥇','🥈','🥉'];
            const rowBg    = i % 2 === 0 ? 'var(--card)' : 'var(--card2)';
            const nameColor = isTop3 ? 'var(--green)' : 'var(--text)';

            html += `<tr style="border-bottom:1px solid var(--border);background:${rowBg};">
                <td style="padding:11px 12px;text-align:left;position:sticky;left:0;
                           background:${rowBg};z-index:2;border-right:1px solid var(--border);min-width:130px;">
                    <div style="font-weight:800;color:${nameColor};font-family:'Rajdhani',sans-serif;font-size:0.9rem;">
                        ${isTop3 ? medals[i] : pos+'.'} ${p.team||'Unknown'}
                    </div>
                    <div style="font-size:0.6rem;color:var(--dim);font-family:'Share Tech Mono',monospace;
                                text-transform:uppercase;margin-top:3px;letter-spacing:0.5px;">
                        ${p.name||'Manager'}
                    </div>
                </td>
                ${weeks.map(w => `
                <td style="padding:6px 4px;text-align:center;">${renderPointCell(p[`gw_${w}_pts`], p[`gw_${w}_hit`], p[`gw_${w}_chip`])}</td>`).join('')}
                <td style="padding:10px 8px;text-align:center;font-weight:900;color:var(--green);
                           background:rgba(0,255,136,0.05);font-size:0.95rem;
                           border-left:1px solid var(--border);font-family:'Rajdhani',sans-serif;">
                    ${p.total_net||0}
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        content.innerHTML = html;
    });
};
