/**
 * live-hub.js — TW FA Cup Bracket
 * Green Theme — No Stage Tabs, Clear Typography
 */

function renderPlayoffScore(pts, hit, chip) {
    let tags = '';
    if (hit>0) tags += `<span style="color:#ff4d4d;font-size:0.7rem;font-weight:700;margin-left:5px;">(-${hit})</span>`;
    let chipTag = '';
    if (chip==='3xc')       chipTag=`<div style="background:#e1ff00;color:#000;font-size:0.6rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>`;
    else if(chip==='bboost') chipTag=`<div style="background:#00ffcc;color:#000;font-size:0.6rem;padding:1px 6px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>`;
    return `<div style="display:flex;flex-direction:column;align-items:flex-end;">
        <div style="display:flex;align-items:center;">
            <span style="font-weight:900;color:var(--green);font-family:'Rajdhani',sans-serif;font-size:1.3rem;">${pts??'—'}</span>${tags}
        </div>${chipTag}
    </div>`;
}

window.renderLiveHub = function() {
    const mainRoot = document.getElementById('main-root');
    if (!mainRoot) return;

    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;
                    height:calc(100vh - var(--nav-h) - 60px);padding:12px 12px 0;">

            <!-- Compact Header -->
            <div style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;
                         padding:12px 16px;margin-bottom:12px;
                         background:var(--card);border-radius:14px;
                         border:1px solid rgba(0,255,136,0.15);">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.4rem;">🏟️</span>
                    <div>
                        <div style="font-family:'Rajdhani',sans-serif;font-weight:900;
                                    font-size:1.2rem;color:var(--green);letter-spacing:2px;
                                    line-height:1.1;">TW FA CUP</div>
                        <div style="font-family:'Rajdhani',sans-serif;font-size:0.7rem;
                                    font-weight:700;color:var(--dim);letter-spacing:1.5px;">
                            KNOCKOUT BRACKET
                        </div>
                    </div>
                </div>
                <!-- GW Badge -->
                <div style="display:flex;align-items:center;gap:7px;
                      background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.25);
                      border-radius:20px;padding:6px 12px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="var(--green)" stroke-width="2.5" stroke-linecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span id="fa-week-label" style="font-family:'Rajdhani',sans-serif;font-weight:800;
                           font-size:0.85rem;color:var(--green);letter-spacing:1px;">GW —</span>
                </div>
            </div>

            <!-- Scrollable Bracket -->
            <div id="playoff-bracket-container"
                 style="flex:1;overflow-y:auto;padding-bottom:16px;
                        display:flex;flex-direction:column;gap:22px;">
            </div>
        </div>
    `;
    loadFACupBracket();
};

function loadFACupBracket() {
    const container = document.getElementById('playoff-bracket-container');
    if (!container) return;

    db.collection("tw_fa_playoff").onSnapshot(snapshot => {
        let matches = [];
        snapshot.forEach(doc => matches.push(doc.data()));

        // GW from data
        const gws = matches.map(m=>m.gw).filter(Boolean);
        if (gws.length) {
            const el = document.getElementById('fa-week-label');
            if (el) el.textContent = `GAMEWEEK ${gws[0]}`;
        }

        const stages = [
            { key:'R16',   label:'ROUND OF 16',   count:8, color:'var(--dim)' },
            { key:'QF',    label:'QUARTER-FINALS', count:4, color:'#bbb' },
            { key:'SF',    label:'SEMI-FINALS',    count:2, color:'var(--green)' },
            { key:'Final', label:'🏆 GRAND FINAL', count:1, color:'var(--green)' },
        ];

        let html = '';
        stages.forEach(stage => {
            const stageMatches = matches.filter(m=>m.match_id&&m.match_id.includes(stage.key));
            const isFinal = stage.key==='Final';

            html += `
            <div>
                <!-- Stage Label -->
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                    <div style="height:1px;flex:1;background:linear-gradient(to right,transparent,var(--border));"></div>
                    <span style="font-family:'Rajdhani',sans-serif;font-size:${isFinal?'1rem':'0.85rem'};
                                  font-weight:900;letter-spacing:2px;color:${stage.color};white-space:nowrap;">
                        ${stage.label}
                    </span>
                    <div style="height:1px;flex:1;background:linear-gradient(to left,transparent,var(--border));"></div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
            `;

            for (let i=1; i<=stage.count; i++) {
                const matchId = `${stage.key}_${i.toString().padStart(2,'0')}`;
                const m       = stageMatches.find(x=>x.match_id===matchId)||{};
                const isLive  = m.status==='live';
                const isDone  = m.status==='done';
                const homeWon = isDone && m.winner===m.home_name && m.home_name;
                const awayWon = isDone && m.winner===m.away_name && m.away_name;

                const borderColor = isLive
                    ? 'rgba(255,77,77,0.6)'
                    : isFinal ? 'rgba(0,255,136,0.35)' : 'var(--border)';
                const cardBg = isFinal
                    ? 'linear-gradient(135deg,rgba(0,255,136,0.06),var(--card))'
                    : 'var(--card)';

                html += `
                <div style="background:${cardBg};border:1px solid ${borderColor};
                             border-radius:14px;padding:15px;position:relative;overflow:hidden;">

                    ${isLive?`<div style="position:absolute;top:0;left:14px;background:#ff4d4d;color:#fff;
                        font-family:'Rajdhani',sans-serif;font-size:0.7rem;font-weight:900;
                        padding:3px 10px;border-radius:0 0 8px 8px;letter-spacing:1px;">● LIVE</div>`:'' }
                    ${isFinal?`<div style="position:absolute;top:0;right:14px;background:var(--green);color:#000;
                        font-family:'Rajdhani',sans-serif;font-size:0.7rem;font-weight:900;
                        padding:3px 10px;border-radius:0 0 8px 8px;letter-spacing:1px;">FINAL</div>`:'' }

                    <!-- Match label -->
                    <div style="font-family:'Rajdhani',sans-serif;font-size:0.75rem;font-weight:700;
                                 color:var(--border);letter-spacing:1px;margin-bottom:12px;
                                 ${isLive||isFinal?'margin-top:14px;':''}">
                        MATCH ${i}
                    </div>

                    <div style="display:flex;flex-direction:column;gap:11px;">

                        <!-- Home Team -->
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:7px;">
                                ${homeWon?`<span style="color:var(--green);font-size:0.85rem;font-weight:900;">✓</span>`:''}
                                <span style="font-family:'Rajdhani',sans-serif;font-size:1rem;
                                              font-weight:${homeWon?900:700};
                                              color:${homeWon?'var(--green)':m.home_name?'var(--text)':'var(--dim)'};">
                                    ${m.home_name||'TBD'}
                                </span>
                            </div>
                            ${m.home_pts!==undefined
                                ? renderPlayoffScore(m.home_pts,m.home_hit||0,m.home_chip)
                                : `<span style="color:var(--border);font-family:'Rajdhani',sans-serif;font-size:1rem;">—</span>`}
                        </div>

                        <div style="height:1px;background:var(--border);"></div>

                        <!-- Away Team -->
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:7px;">
                                ${awayWon?`<span style="color:var(--green);font-size:0.85rem;font-weight:900;">✓</span>`:''}
                                <span style="font-family:'Rajdhani',sans-serif;font-size:1rem;
                                              font-weight:${awayWon?900:700};
                                              color:${awayWon?'var(--green)':m.away_name?'var(--text)':'var(--dim)'};">
                                    ${m.away_name||'TBD'}
                                </span>
                            </div>
                            ${m.away_pts!==undefined
                                ? renderPlayoffScore(m.away_pts,m.away_hit||0,m.away_chip)
                                : `<span style="color:var(--border);font-family:'Rajdhani',sans-serif;font-size:1rem;">—</span>`}
                        </div>
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        });

        container.innerHTML = html;
    });
}
