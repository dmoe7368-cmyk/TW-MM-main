/**
 * app.js — Tab Navigation & App Init
 * TW MM Tournament
 */

window.currentTab = '';

window.showTab = function(tabId) {
    console.log("showTab:", tabId);

    // Active nav
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    window.currentTab = tabId;
    const main = document.getElementById('main-root');
    if (!main) return;

    switch(tabId) {
        case 'home':
            if (typeof window.renderHome === 'function') {
                window.renderHome();
            } else {
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Loading...</p></div>`;
                let tries = 0;
                const retry = setInterval(() => {
                    tries++;
                    if (typeof window.renderHome === 'function') {
                        clearInterval(retry);
                        window.renderHome();
                    } else if (tries >= 20) {
                        clearInterval(retry);
                        main.innerHTML = `<div class="loading"><p style="color:var(--danger);">home.js load မရဘူး — refresh လုပ်ပါ</p></div>`;
                    }
                }, 200);
            }
            break;

        case 'leagues':
            if (typeof window.renderLeagues === 'function') window.renderLeagues();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Standings Loading...</p></div>`;
            break;

        case 'scout':
            if (typeof window.renderScoutHub === 'function') window.renderScoutHub();
            else if (typeof window.renderScout === 'function') window.renderScout();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Scouts Loading...</p></div>`;
            break;

        case 'live':
            if (typeof window.renderLiveHub === 'function') window.renderLiveHub();
            else main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Live Hub Loading...</p></div>`;
            break;

        case 'community':
            if (typeof window.renderCommunity === 'function') window.renderCommunity();
            break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── App Start ─────────────────────────────────────────
// auth.js မှာ onAuthStateChanged ရှိပြီးသား
// ဒီနေရာမှာ window.onload မှာ home ကို တစ်ကြိမ်တည်း ခေါ်မယ်
window.addEventListener('load', () => {
    console.log("All scripts loaded ✅");
    window.showTab('home');
});
