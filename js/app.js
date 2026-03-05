/**
 * app.js — Tab Navigation & App Init
 * TW MM Tournament
 */

window.currentTab = '';

window.showTab = function(tabId) {
    console.log("Tab:", tabId);

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const btn = document.getElementById('btn-' + tabId);
    if (btn) btn.classList.add('active');

    window.currentTab = tabId;
    const main = document.getElementById('main-root');
    if (!main) return;

    switch(tabId) {
        case 'home':
            // retry ၃ ကြိမ် — script load အချိန်ပေးရန်
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
                    } else if (tries >= 10) {
                        clearInterval(retry);
                        main.innerHTML = `<div class="loading"><p style="color:var(--danger)">home.js load မရဘူး — refresh လုပ်ပါ</p></div>`;
                    }
                }, 300);
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

// App Start — scripts အကုန်ပြီးမှ fire ဖြစ်အောင်
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        console.log("Auth ready:", user ? user.uid : 'none');
        window.showTab('home');
    });
});
