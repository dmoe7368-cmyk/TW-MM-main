/**
 * live-hub.js — TW FA Cup Bracket
 * Green Theme + Week Number Display
 */

function renderPlayoffScore(pts, hit, chip) {
    let tags = '';
    if (hit > 0) tags += `<span style="color:#ff4d4d;font-size:0.55rem;font-weight:700;margin-left:4px;">(-${hit})</span>`;
    let chipTag = '';
    if (chip==='3xc')     chipTag = `<div style="background:#e1ff00;color:#000;font-size:0.45rem;padding:1px 5px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">TC</div>`;
    else if (chip==='bboost') chipTag = `<div style="background:#00ffcc;color:#000;font-size:0.45rem;padding:1px 5px;border-radius:3px;font-weight:900;margin-top:2px;display:inline-block;">BB</div>`;

    return `<div style="display:flex;flex-direction:column;align-items:flex-end;">
        <div style="display:flex;align-items:center;">
            <span style="font-weight:900;color:var(--green);font-family:'Rajdhani',sans-serif;font-size:1.15rem;">
                ${pts ?? '—'}
            </span>${tags}
        </div>${chipTag}
    </div>`;
}

window.renderLiveHub = function() {
    const mainRoot = document.getElementById('main-root');
    if (!mainRoot) return;

    mainRoot.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:14px 12px 30px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:24px;padding:20px 16px;
                         background:var(--card);border-radius:16px;
                         border:1px solid rgba(0,255,136,0.15);position:relative;overflow:hidden;">
                <!-- bg glow -->
                <div style="position:absolute;inset:0;
                             background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(0,255,136,0.06) 0%,transparent 70%);
                             pointer-events:none;"></div>

                <div style="font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                             color:var(--dim);letter-spacing:3px;margin-bottom:8px;">TW MM TOURNAMENT</div>

                <h2 style="margin:0 0 6px;font-family:'Rajdhani',sans-serif;font-weight:900;
                            font-size:1.8rem;color:var(--green);letter-spacing:3px;">
                    🏟️ TW FA CUP
                </h2>

                <div style="font-family:'Share Tech Mono',monospace;font-size:0.58rem;
                             color:var(--dim);letter-spacing:2px;margin-bottom:14px;">
                    KNOCKOUT STAGE BRACKET
                </div>

                <!-- Week Number Badge -->
                <div id="fa-week-badge" style="display:inline-flex;align-items:center;gap:8px;
                      background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.25);
                      border-radius:20px;padding:7px 16px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                         stroke="var(--green)" stroke-width="2.5" stroke-linecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span id="fa-week-label" style="font-family:'Share Tech Mono',monospace;
                           font-size:0.65rem;color:var(--green);letter-spacing:1px;">
                        GAMEWEEK —
                    </span>
                </div>
            </div>

            <!-- Stage Tabs -->
            <div style="display:flex;gap:6px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px;">
                ${[
                    {key:'R16',  label:'R16'},
                    {key:'QF',   label:'QF'},
                    {key:'SF',   label:'SF'},
                    {key:'Final',label:'FINAL'}
                ].map((s,i) => `
                <button class="stage-tab" data-stage="${s.key}"
                    onclick="window.scrollToStage('${s.key}')"
                    style="flex:1;padding:9px 6px;border:1px solid ${i===3?'var(--green)':'var(--border)'};
                           border-radius:8px;background:${i===3?'rgba(0,255,136,0.1)':'var(--card)'};
                           color:${i===3?'var(--green)':'var(--dim)'};cursor:pointer;
                           font-family:'Share Tech Mono',monospace;font-size:0.6rem;
                           letter-spacing:1px;white-space:nowrap;flex-shrink:0;transition:0.15s;">
                    ${s.label}
                </button>`).join('')}
            </div>

            <!-- Bracket Container -->
            <div id="playoff-bracket-container" style="display:flex;flex-direction:column;gap:32px;"></div>

            <div style="text-align:center;padding:30px 0 10px;font-family:'Share Tech Mono',monospace;
                         font-size:0.5rem;color:var(--border);letter-spacing:2px;">
                POWERED BY TW MM TOURNAMENT
            </div>
        </div>
    `;

    loadFACupBracket();
};

window.scrollToStage = (key) => {
    const el = document.getElementById('stage-' + key);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function loadFACupBracket() {
    const container = document.getElementById('playoff-bracket-container');
    if (!container) return;

    db.collection("tw_fa_playoff").onSnapshot(snapshot => {
        let matches = [];
        snapshot.forEach(doc => matches.push(doc.data()));

        // Detect current GW from data
        const gwValues = matches.map(m => m.gw).filter(Boolean);
        if (gwValues.length) {
            const gw = gwValues[0];
            const label = document.getElementById('fa-week-label');
            if (label) label.textContent = `GAMEWEEK ${gw}`;
        }

        const stages = [
            { key:'R16',   label:'ROUND OF 16',    count:8, color:'var(--dim)' },
            { key:'QF',    label:'QUARTER-FINALS',  count:4, color:'#aaa' },
            { key:'SF',    label:'SEMI-FINALS',     count:2, color:'var(--green)' },
            { key:'Final', label:'🏆 GRAND FINAL',  count:1, color:'var(--green)' },
        ];

        let html = '';

        stages.forEach(stage => {
            const stageMatches = matches.filter(m => m.match_id && m.match_id.includes(stage.key));
            const isFinal = stage.key === 'Final';

            html += `
            <div id="stage-${stage.key}" style="scroll-margin-top:80px;">
                <!-- Stage Label -->
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                    <div style="height:1px;flex:1;background:linear-gradient(to right,transparent,var(--border));"></div>
                    <span style="font-family:'Share Tech Mono',monospace;font-size:${isFinal?'0.8rem':'0.65rem'};
                                  font-weight:900;letter-spacing:2px;color:${stage.color};white-space:nowrap;">
                        ${stage.label}
                    </span>
                    <div style="height:1px;flex:1;background:linear-gradient(to left,transparent,var(--border));"></div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px;">
            `;

            for (let i = 1; i <= stage.count; i++) {
                const matchId = `${stage.key}_${i.toString().padStart(2,'0')}`;
                const m       = stageMatches.find(x => x.match_id === matchId) || {};
                const isLive  = m.status === 'live';
                const isDone  = m.status === 'done';
                const homeWon = isDone && m.winner === m.home_name && m.home_name;
                const awayWon = isDone && m.winner === m.away_name && m.away_name;

                const borderColor = isLive
                    ? 'rgba(255,77,77,0.6)'
                    : isFinal
                        ? 'rgba(0,255,136,0.3)'
                        : 'var(--border)';
                const cardBg = isFinal
                    ? 'linear-gradient(135deg,rgba(0,255,136,0.06),var(--card))'
                    : 'var(--card)';

                html += `
                <div style="background:${cardBg};border:1px solid ${borderColor};
                             border-radius:14px;padding:14px;position:relative;overflow:hidden;">
                    ${isLive ? `
                    <div style="position:absolute;top:-1px;left:14px;background:#ff4d4d;color:#fff;
                                 font-size:0.48rem;padding:2px 8px;font-weight:900;border-radius:0 0 6px 6px;
                                 font-family:'Share Tech Mono',monospace;letter-spacing:1px;">● LIVE</div>` : ''}
                    ${isFinal ? `
                    <div style="position:absolute;top:-1px;right:14px;background:var(--green);color:#000;
                                 font-size:0.48rem;padding:2px 8px;font-weight:900;border-radius:0 0 6px 6px;
                                 font-family:'Share Tech Mono',monospace;letter-spacing:1px;">FINAL</div>` : ''}

                    <!-- Match number -->
                    <div style="font-family:'Share Tech Mono',monospace;font-size:0.5rem;
                                 color:var(--border);letter-spacing:1px;margin-bottom:10px;
                                 ${isLive||isFinal?'margin-top:10px;':''}">
                        MATCH ${i}
                    </div>

                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <!-- Home -->
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                ${homeWon?`<span style="color:var(--green);font-size:0.7rem;">✓</span>`:''}
                                <span style="font-size:0.88rem;font-weight:${homeWon?'900':'700'};
                                              color:${homeWon?'var(--green)':m.home_name?'var(--text)':'var(--dim)'};
                                              font-family:'Rajdhani',sans-serif;">
                                    ${m.home_name || 'TBD'}
                                </span>
                            </div>
                            ${m.home_pts !== undefined ? renderPlayoffScore(m.home_pts, m.home_hit||0, m.home_chip) : '<span style="color:var(--border);font-size:0.8rem;">—</span>'}
                        </div>

                        <div style="height:1px;background:var(--border);"></div>

                        <!-- Away -->
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                ${awayWon?`<span style="color:var(--green);font-size:0.7rem;">✓</span>`:''}
                                <span style="font-size:0.88rem;font-weight:${awayWon?'900':'700'};
                                              color:${awayWon?'var(--green)':m.away_name?'var(--text)':'var(--dim)'};
                                              font-family:'Rajdhani',sans-serif;">
                                    ${m.away_name || 'TBD'}
                                </span>
                            </div>
                            ${m.away_pts !== undefined ? renderPlayoffScore(m.away_pts, m.away_hit||0, m.away_chip) : '<span style="color:var(--border);font-size:0.8rem;">—</span>'}
                        </div>
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        });

        container.innerHTML = html;
    });
}
