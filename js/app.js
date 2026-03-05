/**
 * app.js — Tab Navigation & App Init
 * TW MM Tournament
 * 
 * LOAD ORDER: config → app → auth → home → register-fee → ...
 */

window.currentTab = '';
window._appReady  = false;

// ── Tab Switch ────────────────────────────────────────
window.showTab = function(tabId) {
    // Auth form ပြနေချိန် tab switch မလုပ်
    if (window._showingAuthForm) return;

    console.log("showTab:", tabId);

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    window.currentTab = tabId;
    const main = document.getElementById('main-root');
    if (!main) return;

    switch (tabId) {
        case 'home':
            if (typeof window.renderHome === 'function') {
                window.renderHome();
            } else {
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading...</p></div>`;
                let t = 0;
                const r = setInterval(() => {
                    if (typeof window.renderHome === 'function') { clearInterval(r); window.renderHome(); }
                    else if (++t >= 20) { clearInterval(r); main.innerHTML = `<div class="loading"><p style="color:var(--danger)">home.js မရဘူး — refresh လုပ်ပါ</p></div>`; }
                }, 200);
            }
            break;
        case 'leagues':
            typeof window.renderLeagues === 'function' ? window.renderLeagues()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Standings Loading...</p></div>`);
            break;
        case 'scout':
            if      (typeof window.renderScoutHub === 'function') window.renderScoutHub();
            else if (typeof window.renderScout    === 'function') window.renderScout();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Scouts Loading...</p></div>`;
            break;
        case 'live':
            typeof window.renderLiveHub === 'function' ? window.renderLiveHub()
                : (main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Live Hub Loading...</p></div>`);
            break;
        case 'community':
            if (typeof window.renderCommunity === 'function') window.renderCommunity();
            break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── App Start ─────────────────────────────────────────
// Scripts တွေ synchronous load ဖြစ်တာကြောင့်
// ဒီ script ရောက်တဲ့အချိန် DOM + Firebase ရှိပြီးဖြစ်တယ်
// setTimeout(0) နဲ့ current call stack ကြေပြီးမှ run မယ်
setTimeout(() => {
    console.log("App init ✅");
    window._appReady = true;
    window.showTab('home');
}, 0);
