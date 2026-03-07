/**
 * tournament.js — TW MM Tournament
 * Green Theme — Clear Typography Version
 */

function renderPointCell(pts, hit, chip) {
    let tags = '';
    if (hit && hit > 0)   tags += `<div style="color:#ff4d4d;font-size:0.65rem;font-weight:700;margin-top:1px;">-${hit}</div>`;
    if (chip==='3xc')      tags += `<div style="background:#e1ff00;color:#000;font-size:0.55rem;padding:1px 5px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>`;
    else if(chip==='bboost') tags += `<div style="background:#00ffcc;color:#000;font-size:0.55rem;padding:1px 5px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>`;
    return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:40px;">
        <span style="color:#e8ffe8;font-weight:700;font-size:0.9rem;">${pts||0}</span>${tags}
    </div>`;
}

window.renderLeagues = function() {
    const mainRoot = document.getElementById('main-root');
    if (!mainRoot) return;

    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 12px;">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                <span style="font-size:1.3rem;">🏆</span>
                <span style="font-family:'Rajdhani',sans-serif;font-weight:900;font-size:1.3rem;
                              color:var(--green);letter-spacing:1px;">LEAGUE STANDINGS</span>
            </div>

            <!-- Division Toggle -->
            <div style="display:flex;background:#000;padding:4px;border-radius:40px;
                        margin-bottom:16px;border:1px solid var(--border);">
                <button id="btn-divA" onclick="window.filterDivision('Division A')"
                    style="flex:1;padding:12px;border:none;border-radius:40px;font-weight:900;
                           cursor:pointer;transition:0.2s;background:var(--green);color:#000;
                           font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
                    ⭐ DIVISION A
                </button>
                <button id="btn-divB" onclick="window.filterDivision('Division B')"
                    style="flex:1;padding:12px;border:none;border-radius:40px;font-weight:900;
                           cursor:pointer;transition:0.2s;background:transparent;color:var(--dim);
                           font-family:'Rajdhani',sans-serif;font-size:0.95rem;letter-spacing:1px;">
                    🥈 DIVISION B
                </button>
            </div>

            <!-- GW Badge -->
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                <div style="background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.25);
                             border-radius:8px;padding:7px 14px;display:flex;align-items:center;gap:7px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span id="gw-label" style="font-family:'Rajdhani',sans-serif;font-weight:700;
                                                font-size:0.9rem;color:var(--green);letter-spacing:1px;">
                        GAMEWEEK —
                    </span>
                </div>
                <div style="flex:1;height:1px;background:var(--border);"></div>
            </div>

            <!-- Table -->
            <div id="league-content" style="overflow-x:auto;overflow-y:auto;
                 max-height:calc(100vh - 260px);
                 border-radius:14px;border:1px solid var(--border);background:var(--card);">
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

    // onSnapshot အစား .get() သုံးမယ် — mobile browser မှာ onSnapshot timeout ဖြစ်တတ်တယ်
    db.collection("tw_mm_tournament")
      .where("division","==",divName)
      .get()
      .then(snapshot => {
        if (!snapshot || snapshot.empty) {
            content.innerHTML = `<div style="text-align:center;padding:50px;color:var(--dim);
                font-family:'Rajdhani',sans-serif;font-size:1rem;">⚠️ NO DATA — division: "${divName}"</div>`;
            return;
        }

        let players = [];
        snapshot.forEach(doc => players.push(doc.data()));
        players.sort((a,b) => (b.total_net||0) - (a.total_net||0));

        // Detect GW columns from data
        const sample = players[0] || {};
        const weeks  = [];
        for (let w = 1; w <= 38; w++) {
            if (sample[`gw_${w}_pts`] !== undefined) weeks.push(w);
        }
        const gwCols = weeks.length ? weeks : [23,24,25,26,27,28,29];

        // Update GW badge
        const gwLabel = document.getElementById('gw-label');
        if (gwLabel && gwCols.length)
            gwLabel.textContent = `GW ${gwCols[0]} — GW ${gwCols[gwCols.length-1]}`;

        const medals = ['🥇','🥈','🥉'];

        let html = `
        <table style="width:100%;border-collapse:collapse;min-width:${160 + gwCols.length*52}px;">
            <thead>
                <tr style="background:#0c1a0e;position:sticky;top:0;z-index:4;">
                    <th style="padding:10px 12px;text-align:left;
                               position:sticky;left:0;top:0;
                               background:#0c1a0e;z-index:5;
                               border-right:1px solid rgba(0,255,136,0.1);
                               border-bottom:2px solid var(--green);min-width:160px;">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.82rem;
                                      font-weight:900;color:var(--green);letter-spacing:1px;">TEAM / MANAGER</span>
                    </th>
                    ${gwCols.map(w => `
                    <th style="padding:10px 6px;text-align:center;
                               background:#0c1a0e;
                               border-bottom:2px solid rgba(0,255,136,0.12);min-width:48px;">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;
                                      font-weight:700;color:var(--dim);">W${w}</span>
                    </th>`).join('')}
                    <th style="padding:10px 10px;text-align:center;
                               position:sticky;right:0;top:0;
                               background:#0c1a0e;z-index:5;
                               border-left:1px solid rgba(0,255,136,0.15);
                               border-bottom:2px solid var(--green);min-width:58px;">
                        <span style="font-family:'Rajdhani',sans-serif;font-size:0.82rem;
                                      font-weight:900;color:var(--green);">TOT</span>
                    </th>
                </tr>
            </thead>
            <tbody>`;

        players.forEach((p, i) => {
            const pos     = i + 1;
            const isTop3  = pos <= 3;
            const rowBg   = i%2===0 ? '#0a150c' : '#0d1a0f';
            const nameCls = isTop3  ? 'var(--green)' : 'var(--text)';

            html += `
            <tr style="border-bottom:1px solid var(--border);background:${rowBg};">
                <td style="padding:10px 12px;text-align:left;position:sticky;left:0;
                           background:${rowBg};z-index:2;
                           border-right:1px solid rgba(0,255,136,0.1);
                           min-width:160px;max-width:160px;overflow:hidden;">
                    <div style="font-weight:900;color:${nameCls};font-family:'Rajdhani',sans-serif;
                                font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;">
                        ${isTop3 ? medals[i]+' ' : pos+'. '}${p.team||'Unknown'}
                    </div>
                    <div style="font-size:0.7rem;color:var(--dim);font-family:'Rajdhani',sans-serif;
                                font-weight:600;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${p.name||'Manager'}
                    </div>
                </td>
                ${gwCols.map(w => `
                <td style="padding:8px 4px;text-align:center;background:${rowBg};">
                    ${renderPointCell(p[`gw_${w}_pts`], p[`gw_${w}_hit`], p[`gw_${w}_chip`])}
                </td>`).join('')}
                <td style="padding:10px 8px;text-align:center;font-weight:900;color:var(--green);
                           position:sticky;right:0;background:${rowBg === '#0a150c' ? '#0d1f10' : '#0f2212'};
                           z-index:2;font-size:1rem;
                           border-left:1px solid rgba(0,255,136,0.15);font-family:'Rajdhani',sans-serif;
                           box-shadow:-2px 0 8px rgba(0,0,0,0.4);">
                    ${p.total_net||0}
                </td>
            </tr>`;
        });

        html += `</tbody></table>`;
        content.innerHTML = html;
      })
      .catch(err => {
        content.innerHTML = `<div style="text-align:center;padding:40px;color:#ff4d4d;
            font-family:'Rajdhani',sans-serif;font-size:0.9rem;">
            ❌ Error: ${err.message}</div>`;
      });
};
