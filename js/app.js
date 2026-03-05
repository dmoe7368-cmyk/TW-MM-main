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
    const main = document.getElementById('main-root');
    if (!main) return;

    switch (tabId) {
        case 'home':
            window.renderHome();
            break;
        case 'leagues':
            typeof window.renderLeagues === 'function'
                ? window.renderLeagues()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Standings Loading...</p></div>`);
            break;
        case 'scout':
            if      (typeof window.renderScoutHub === 'function') window.renderScoutHub();
            else if (typeof window.renderScout    === 'function') window.renderScout();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Scouts Loading...</p></div>`;
            break;
        case 'live':
            typeof window.renderLiveHub === 'function'
                ? window.renderLiveHub()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Live Hub Loading...</p></div>`);
            break;
        case 'community':
            typeof window.renderCommunity === 'function'
                ? window.renderCommunity()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Community Loading...</p></div>`);
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
