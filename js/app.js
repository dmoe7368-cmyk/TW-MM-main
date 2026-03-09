/**
 * app.js — TW MM Tournament
 * *** MUST BE LAST SCRIPT ***
 */

window.currentTab = '';

window.showTab = function(tabId) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    window.currentTab = tabId;
    const main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    switch (tabId) {
        case 'home':
            window.renderHome ? window.renderHome() :
                (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading...</p></div>`);
            break;
        // TW Table (tournament / standings)
        case 'tournament':
        case 'leagues':
            if      (typeof window.renderTournament === 'function') window.renderTournament();
            else if (typeof window.renderLeagues    === 'function') window.renderLeagues();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>TW Table Loading...</p></div>`;
            break;
        // Scout
        case 'scouts':
        case 'scout':
            if      (typeof window.renderScoutHub === 'function') window.renderScoutHub();
            else if (typeof window.renderScout    === 'function') window.renderScout();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Scout Loading...</p></div>`;
            break;
        // TW FA (live hub / matches)
        case 'livehub':
        case 'live':
            if      (typeof window.renderLiveHub  === 'function') window.renderLiveHub();
            else if (typeof window.renderMatches  === 'function') window.renderMatches();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>TW FA Loading...</p></div>`;
            break;
        // Message / Community
        case 'community':
            typeof window.renderCommunity === 'function'
                ? window.renderCommunity()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Message Loading...</p></div>`);
            break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── App Init ──────────────────────────────────────────────────────────────────
// app.js နောက်ဆုံး load ဆိုတော့ scripts အကုန် ready
// auth state ကို တစ်ကြိမ်တည်း ကြားပြီး home render လုပ်မယ်
firebase.auth().onAuthStateChanged(function(user) {
    // ဒီ listener က first fire မှာပဲ home render လုပ်မယ်
    if (!window._appStarted) {
        window._appStarted = true;
        window.showTab('home');
    }
});
