/**
 * auth.js — TW MM Tournament
 */

const provider = new firebase.auth.GoogleAuthProvider();
const authRoot  = document.getElementById('auth-root');

// Auth form ပြနေချိန် home render မ override ဖြစ်ရန် flag
window._showingAuthForm = false;

// ── Toast ─────────────────────────────────────────────────────────────────────
window.showToast = (message, type = "info") => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-alert ${type}`;

    let icon = "🔔";
    if (type === "success") icon = "✅";
    if (type === "error")   icon = "❌";
    if (type === "gold")    icon = "🏆";

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

// ── Auth State Observer ───────────────────────────────────────────────────────
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        window._showingAuthForm = false;
        try {
            const userDoc   = await db.collection("users").doc(user.uid).get();
            let managerName = user.displayName ? user.displayName.split(' ')[0] : "Manager";
            const coins     = userDoc.exists ? (userDoc.data().coins ?? 0) : 0;

            if (userDoc.exists) {
                const data  = userDoc.data();
                managerName = data.manager_name || managerName;
                updateProfileModal(data);
            }

            authRoot.innerHTML = `
                <div class="header-combined-pill" onclick="window.openProfile()">
                    <span class="hcp-coin">🪙 <span id="header-coins">${coins}</span></span>
                    <span class="hcp-divider"></span>
                    <span class="hcp-name">⚽ ${managerName}</span>
                </div>
            `;
        } catch (e) {
            console.error("Profile load error:", e);
        }
    } else {
        // Logged out — LOGIN button
        authRoot.innerHTML = `
            <button onclick="window.renderAuthUI()"
                style="background:transparent; border:1px solid var(--cyan);
                       color:var(--cyan); padding:6px 16px; border-radius:20px;
                       font-family:'Rajdhani',sans-serif; font-weight:700;
                       font-size:0.8rem; cursor:pointer; letter-spacing:1px;">
                LOGIN
            </button>
        `;
    }

    // auth ပြောင်းတာနဲ့ header ကိုပဲ update လုပ် — tab render ကို app.js က handle လုပ်မယ်
    // Home tab ဆိုရင်တော့ fee status ပြောင်းသွားနိုင်လို့ re-render လုပ်မယ်
    if (window.currentTab === 'home' && typeof window.renderHome === 'function') {
        window.renderHome();
    }
});

// ── Render Auth Form (Full Screen Modal) ─────────────────────────────────────
window.renderAuthUI = function() {
    window._showingAuthForm = true;

    // main-root မကွယ်ဘဲ modal ထပ်ပေါ်မယ်
    // existing auth-modal ရှိရင် မထပ်ဖွင့်
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 4000;
        background: rgba(8,0,20,0.95);
        backdrop-filter: blur(16px);
        display: flex; align-items: flex-start;
        justify-content: center;
        overflow-y: auto;
        animation: fadeIn 0.25s ease;
        padding-bottom: 80px;
    `;

    modal.innerHTML = `
        <div class="auth-form-container" style="width:100%;">

            <!-- Logo -->
            <div style="text-align:center; margin-bottom:28px;">
                <div style="width:56px; height:56px;
                            background:linear-gradient(135deg,#00ff88,#00aa55);
                            border-radius:16px; display:flex; align-items:center;
                            justify-content:center; font-size:1.6rem;
                            margin:0 auto 12px;
                            box-shadow:0 0 24px rgba(0,255,136,0.35);">⚽</div>
                <h2 style="font-family:'Rajdhani',sans-serif; font-size:1.4rem;
                           font-weight:700; color:var(--green); letter-spacing:1px;
                           margin-bottom:4px;">TW MM TOURNAMENT</h2>
                <p style="font-family:'Share Tech Mono',monospace; font-size:0.6rem;
                          color:var(--dim); letter-spacing:2px;">SIGN IN TO CONTINUE</p>
            </div>

            <!-- Tab Toggle -->
            <div style="display:flex; background:#000; padding:4px; border-radius:40px;
                        margin-bottom:24px; border:1px solid var(--border);">
                <button id="tab-login" onclick="window.toggleAuthTab('login')"
                    style="flex:1; padding:10px; border-radius:40px; border:none;
                           background:var(--green); color:#000;
                           font-family:'Rajdhani',sans-serif; font-weight:700;
                           font-size:0.85rem; cursor:pointer; letter-spacing:1px; transition:0.2s;">
                    LOGIN
                </button>
                <button id="tab-signup" onclick="window.toggleAuthTab('signup')"
                    style="flex:1; padding:10px; border-radius:40px; border:none;
                           background:transparent; color:var(--dim);
                           font-family:'Rajdhani',sans-serif; font-weight:700;
                           font-size:0.85rem; cursor:pointer; letter-spacing:1px; transition:0.2s;">
                    SIGN UP
                </button>
            </div>

            <!-- Login Form -->
            <div id="form-login">
                <input type="email"    id="email" class="auth-input" placeholder="Email Address">
                <input type="password" id="pass"  class="auth-input" placeholder="Password">
                <button onclick="window.handleLogin()" class="primary-btn" style="margin-top:4px;">
                    LOG IN
                </button>
                <div style="display:flex; align-items:center; gap:12px; margin:18px 0;">
                    <div style="flex:1; height:1px; background:var(--border);"></div>
                    <span style="font-family:'Share Tech Mono',monospace; font-size:0.6rem; color:var(--dim);">OR</span>
                    <div style="flex:1; height:1px; background:var(--border);"></div>
                </div>
                <button onclick="window.loginWithGoogle()" class="primary-btn"
                    style="background:#fff; color:#000; display:flex;
                           align-items:center; justify-content:center; gap:10px;">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    GOOGLE LOGIN
                </button>
            </div>

            <!-- Sign Up Form -->
            <div id="form-signup" style="display:none;">
                <input type="text"     id="reg-manager" class="auth-input" placeholder="Manager Name (နာမည်)">
                <input type="text"     id="reg-team"    class="auth-input" placeholder="FPL Team Name">
                <input type="text"     id="reg-fb"      class="auth-input" placeholder="Facebook Name / Link">
                <input type="email"    id="reg-email"   class="auth-input" placeholder="Email Address">
                <input type="password" id="reg-pass"    class="auth-input" placeholder="Password (အနည်းဆုံး ၆ လုံး)">
                <button onclick="window.handleSignUp()" class="primary-btn" style="margin-top:4px;">
                    CREATE ACCOUNT
                </button>
            </div>

            <!-- Close -->
            <button onclick="window.closeAuthModal()"
                style="width:100%; margin-top:14px; padding:12px; border-radius:10px;
                       border:1px solid var(--border); background:transparent;
                       color:var(--dim); font-family:'Rajdhani',sans-serif;
                       font-weight:600; font-size:0.85rem; cursor:pointer; letter-spacing:1px;">
                ✕ CLOSE
            </button>

        </div>
    `;

    document.body.appendChild(modal);
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.2s';
        setTimeout(() => modal.remove(), 200);
    }
    window._showingAuthForm = false;
};

// ── Tab Toggle ────────────────────────────────────────────────────────────────
window.toggleAuthTab = (type) => {
    const isLogin = type === 'login';
    document.getElementById('form-login').style.display  = isLogin ? 'block' : 'none';
    document.getElementById('form-signup').style.display = isLogin ? 'none'  : 'block';

    const tl = document.getElementById('tab-login');
    const ts = document.getElementById('tab-signup');
    tl.style.background = isLogin ? 'var(--green)' : 'transparent';
    tl.style.color       = isLogin ? '#000' : 'var(--dim)';
    ts.style.background  = isLogin ? 'transparent' : 'var(--green)';
    ts.style.color        = isLogin ? 'var(--dim)' : '#000';
};

// ── Sign Up ───────────────────────────────────────────────────────────────────
window.handleSignUp = async () => {
    const manager = document.getElementById('reg-manager')?.value.trim();
    const team    = document.getElementById('reg-team')?.value.trim();
    const fb      = document.getElementById('reg-fb')?.value.trim();
    const email   = document.getElementById('reg-email')?.value.trim();
    const pass    = document.getElementById('reg-pass')?.value;

    if (!manager) return window.showToast("Manager Name ထည့်ပါ", "error");
    if (!team)    return window.showToast("FPL Team Name ထည့်ပါ", "error");
    if (!email)   return window.showToast("Email ထည့်ပါ", "error");
    if (!pass || pass.length < 6) return window.showToast("Password အနည်းဆုံး ၆ လုံး ထည့်ပါ", "error");

    try {
        const res = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        await db.collection("users").doc(res.user.uid).set({
            uid:           res.user.uid,
            manager_name:  manager,
            team_name:     team,
            facebook_name: fb || '',
            email:         email,
            coins:         0,
            week_paid:     false,
            cup_paid:      false,
            role:          'member',
            joined_at:     firebase.firestore.FieldValue.serverTimestamp(),
        });
        window.showToast("Account ဖန်တီးပြီးပါပြီ! ✅", "success");
        window.closeAuthModal();
        setTimeout(() => location.reload(), 1200);
    } catch (e) {
        const msg = e.code === 'auth/email-already-in-use' ? 'Email ရှိပြီးသားပါ' :
                    e.code === 'auth/invalid-email'        ? 'Email မှားနေသည်'    : e.message;
        window.showToast(msg, "error");
    }
};

// ── Login ─────────────────────────────────────────────────────────────────────
window.handleLogin = () => {
    const email = document.getElementById('email')?.value.trim();
    const pass  = document.getElementById('pass')?.value;
    if (!email || !pass) return window.showToast("Email နှင့် Password ထည့်ပါ", "error");

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
            window.showToast("Welcome Back! ⚽", "success");
            window.closeAuthModal();
            setTimeout(() => location.reload(), 800);
        })
        .catch(() => window.showToast("Email သို့မဟုတ် Password မှားနေသည်", "error"));
};

window.loginWithGoogle = () => {
    firebase.auth().signInWithPopup(provider)
        .then(() => {
            window.showToast("Google Login Success! ✅", "success");
            window.closeAuthModal();
            setTimeout(() => location.reload(), 800);
        })
        .catch(e => console.error(e));
};

window.handleLogout = () => {
    if (confirm("Logout ထွက်မှာ သေချာပါသလား?")) {
        firebase.auth().signOut().then(() => {
            window.closeProfile();
            window._showingAuthForm = false;
            location.reload();
        });
    }
};

// ── Profile Modal ─────────────────────────────────────────────────────────────
function updateProfileModal(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('prof-manager', data.manager_name  || '-');
    set('prof-team',    data.team_name     || '-');
    set('prof-fb',      data.facebook_name || '-');
    set('prof-coins',   (data.coins ?? 0) + ' 🪙');
    set('prof-week',    data.week_paid ? '✅ Paid' : '❌ Unpaid');
    set('prof-cup',     data.cup_paid  ? '✅ Paid' : '❌ Unpaid');
}

window.openProfile = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'flex';
};

window.closeProfile = () => {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = 'none';
};
