/**
 * app.js — Tab Navigation & App Init
 * TW MM Tournament
 */

window.currentTab = '';

window.showTab = function(tabId) {
    console.log("Tab:", tabId);

    // Active nav highlight
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
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Home Loading...</p></div>`;
            }
            break;

        case 'leagues':
            if (typeof window.renderLeagues === 'function') {
                window.renderLeagues();
            } else {
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Standings Loading...</p></div>`;
            }
            break;

        case 'scout':
            if (typeof window.renderScoutHub === 'function') {
                window.renderScoutHub();
            } else if (typeof window.renderScout === 'function') {
                window.renderScout();
            } else {
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Scouts Loading...</p></div>`;
            }
            break;

        case 'live':
            if (typeof window.renderLiveHub === 'function') {
                window.renderLiveHub();
            } else {
                main.innerHTML = `<div class="loading"><div class="spinner"></div><p>Live Hub Loading...</p></div>`;
            }
            break;

        // community tab (old) — ဆက်သုံးနိုင်ရန်
        case 'community':
            if (typeof window.renderCommunity === 'function') {
                window.renderCommunity();
            }
            break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// App Start
firebase.auth().onAuthStateChanged((user) => {
    console.log("Auth ready, user:", user ? user.uid : 'none');
    window.showTab('home');
});

window.onload = () => {
    console.log("TW MM Tournament loaded ✅");
};
