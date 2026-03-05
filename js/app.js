/**
 * app.js — TW MM Tournament
 * MUST be loaded LAST — after all other scripts
 */

window.currentTab = '';

window.showTab = function(tabId) {
    if (window._showingAuthForm) return;

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

// app.js သည် နောက်ဆုံး load ဖြစ်တာကြောင့်
// ဒီနေရာ ရောက်တဲ့အချိန် scripts အကုန် ready ဖြစ်ပြီးဖြစ်တယ်
window.showTab('home');
