/**
 * community.js — TW MM Tournament
 * Community Posts + DM Chat System
 * Green Theme Version
 */

let currentManagerName = "User";

// ── Render Community ──────────────────────────────────────────────────────────
window.renderCommunity = async function() {
    const main = document.getElementById('main-root');
    const user = auth.currentUser;

    if (user) {
        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists) {
                currentManagerName = doc.data().manager_name || doc.data().facebook_name || "User";
            }
        } catch(e) { console.error(e); }
    }

    const initial = currentManagerName.charAt(0).toUpperCase();

    main.innerHTML = `
        <div style="max-width:600px; margin:0 auto; padding:16px 14px 30px;">

            <div class="section-title">🤝 Community Hub</div>

            ${user ? `
            <!-- Post Box -->
            <div class="glow-card" style="margin-bottom:20px;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    <div class="initial-box">${initial}</div>
                    <div>
                        <div style="font-family:'Rajdhani',sans-serif; font-weight:700;
                                    font-size:0.95rem; color:var(--text);">${currentManagerName}</div>
                        <div style="display:flex; align-items:center; gap:5px; margin-top:2px;">
                            <span style="width:6px; height:6px; background:var(--green);
                                         border-radius:50%; display:inline-block;
                                         box-shadow:0 0 6px var(--green);"></span>
                            <span style="font-family:'Share Tech Mono',monospace;
                                         font-size:0.55rem; color:var(--green); letter-spacing:1px;">ONLINE</span>
                        </div>
                    </div>
                </div>
                <textarea id="postInput"
                    style="width:100%; background:#000; color:var(--text);
                           border:1px solid var(--border); padding:12px;
                           border-radius:10px; height:80px; resize:none;
                           box-sizing:border-box; font-family:'Barlow Condensed',sans-serif;
                           font-size:0.95rem; outline:none; transition:border 0.2s;"
                    placeholder="ဘာပြောချင်လဲဗျာ..."
                    onfocus="this.style.borderColor='rgba(0,255,136,0.4)'"
                    onblur="this.style.borderColor='var(--border)'"></textarea>
                <button onclick="savePost()" class="post-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                         style="display:inline; vertical-align:middle; margin-right:6px;">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    POST တင်မယ်
                </button>
            </div>
            ` : `
            <!-- Login prompt -->
            <div class="glow-card" style="text-align:center; padding:28px 16px; margin-bottom:20px;">
                <div style="color:var(--dim); margin-bottom:12px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                </div>
                <p style="font-family:'Rajdhani',sans-serif; font-weight:700;
                           font-size:0.95rem; color:var(--text); margin-bottom:14px;">
                    Post တင်ဖို့ Login ဝင်ပါ
                </p>
                <button onclick="window.renderAuthUI()" class="primary-btn"
                    style="max-width:180px; margin:0 auto;">LOGIN</button>
            </div>
            `}

            <!-- Posts List -->
            <div id="posts-list">
                <div class="loading"><div class="spinner"></div></div>
            </div>

        </div>
        <div id="modal-holder"></div>
    `;

    loadPosts();
};

// ── Save Post ─────────────────────────────────────────────────────────────────
function savePost() {
    const input = document.getElementById('postInput');
    const text  = input?.value.trim();
    const user  = auth.currentUser;

    if (!text) return window.showToast("စာအရင်ရေးပါဦး", "error");
    if (!user) return window.showToast("Login အရင်ဝင်ပါ", "error");

    const btn = document.querySelector('.post-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

    db.collection("tw_posts").add({
        name:      currentManagerName,
        uid:       user.uid,
        message:   text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        if (input) input.value = "";
        if (btn)   { btn.disabled = false; btn.style.opacity = '1'; }
    }).catch(e => {
        window.showToast(e.message, "error");
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    });
}

// ── Load Posts ────────────────────────────────────────────────────────────────
function loadPosts() {
    db.collection("tw_posts")
        .orderBy("timestamp", "desc")
        .limit(50)
        .onSnapshot(snapshot => {
            const list = document.getElementById('posts-list');
            if (!list) return;

            if (snapshot.empty) {
                list.innerHTML = `
                    <div class="glow-card" style="text-align:center; padding:30px; color:var(--dim);">
                        <p style="font-family:'Share Tech Mono',monospace; font-size:0.7rem;
                                   letter-spacing:1px;">Post များ မရှိသေးပါ — အရင်ဆုံး တင်လိုက်ပါ!</p>
                    </div>`;
                return;
            }

            const myUid = auth.currentUser?.uid;

            list.innerHTML = snapshot.docs.map(doc => {
                const p       = doc.data();
                const docId   = doc.id;
                const name    = p.name || "User";
                const initial = name.charAt(0).toUpperCase();
                const isMe    = p.uid === myUid;
                const time    = p.timestamp
                    ? new Date(p.timestamp.seconds * 1000)
                        .toLocaleString('en-GB', { day:'numeric', month:'short',
                                                   hour:'2-digit', minute:'2-digit' })
                    : 'Just now';

                return `
                <div class="post-card" id="post-${docId}">
                    <!-- Author Row -->
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                        <div class="initial-box"
                             onclick="${isMe ? '' : `openChat('${p.uid}','${name}')`}"
                             style="cursor:${isMe ? 'default' : 'pointer'}">
                            ${initial}
                        </div>
                        <div style="flex:1;">
                            <div style="font-family:'Rajdhani',sans-serif; font-weight:700;
                                         font-size:0.95rem; color:var(--green);
                                         cursor:${isMe ? 'default' : 'pointer'};"
                                 onclick="${isMe ? '' : `openChat('${p.uid}','${name}')`}">
                                ${name} ${isMe ? '<span style="font-size:0.6rem; color:var(--dim); font-family:\'Share Tech Mono\',monospace; letter-spacing:1px;"> YOU</span>' : ''}
                            </div>
                            <div style="font-family:'Share Tech Mono',monospace;
                                         font-size:0.58rem; color:var(--dim); margin-top:2px;">
                                ${time}
                            </div>
                        </div>
                        ${isMe ? `
                        <button onclick="deletePost('${docId}')"
                            style="background:transparent; border:none; cursor:pointer;
                                   color:var(--dim); padding:4px; border-radius:6px;"
                            title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                            </svg>
                        </button>` : ''}
                    </div>

                    <!-- Message -->
                    <div style="font-size:0.95rem; line-height:1.6; color:var(--text);
                                 white-space:pre-wrap; word-break:break-word;">
                        ${escapeHtml(p.message)}
                    </div>

                    <!-- Actions -->
                    <div style="margin-top:12px; display:flex; gap:16px;
                                 border-top:1px solid var(--border); padding-top:10px;">
                        <button onclick="likePost('${docId}', this)"
                            style="background:transparent; border:none; cursor:pointer;
                                   color:var(--dim); font-family:'Rajdhani',sans-serif;
                                   font-weight:600; font-size:0.85rem; display:flex;
                                   align-items:center; gap:5px; padding:0;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Like ${p.likes ? `<span style="color:var(--green)">${p.likes}</span>` : ''}
                        </button>
                        ${!isMe ? `
                        <button onclick="openChat('${p.uid}','${name}')"
                            style="background:transparent; border:none; cursor:pointer;
                                   color:var(--dim); font-family:'Rajdhani',sans-serif;
                                   font-weight:600; font-size:0.85rem; display:flex;
                                   align-items:center; gap:5px; padding:0;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                            Message
                        </button>` : ''}
                    </div>
                </div>`;
            }).join('');
        });
}

// ── Like Post ─────────────────────────────────────────────────────────────────
function likePost(docId, btn) {
    if (!auth.currentUser) return window.showToast("Login ဝင်ပါ", "error");
    btn.style.color = 'var(--green)';
    db.collection("tw_posts").doc(docId).update({
        likes: firebase.firestore.FieldValue.increment(1)
    });
}

// ── Delete Post ───────────────────────────────────────────────────────────────
function deletePost(docId) {
    if (!auth.currentUser) return;
    if (!confirm("Post ဖျက်မှာ သေချာပါသလား?")) return;
    db.collection("tw_posts").doc(docId).delete()
        .then(() => window.showToast("Post ဖျက်ပြီးပါပြီ", "success"))
        .catch(e => window.showToast(e.message, "error"));
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── DM Chat ───────────────────────────────────────────────────────────────────
function openChat(targetUid, targetName) {
    const user = auth.currentUser;
    if (!user)                      return window.showToast("Login ဝင်ပါ", "error");
    if (targetUid === "no-id")      return window.showToast("User ID မရှိပါ", "error");
    if (user.uid === targetUid)     return window.showToast("ဒါ သင့် Profile ပါ", "error");

    const name = targetName || "User";
    const holder = document.getElementById('modal-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.85);
                     backdrop-filter:blur(8px); z-index:3500;"
             onclick="closeChat()"></div>
        <div style="position:fixed; bottom:calc(var(--nav-h) + 10px); left:50%;
                     transform:translateX(-50%); width:92%; max-width:420px;
                     background:var(--card); border:1px solid rgba(0,255,136,0.25);
                     border-radius:18px; z-index:3501; overflow:hidden;
                     box-shadow:0 0 40px rgba(0,0,0,0.8);">

            <!-- Chat Header -->
            <div style="display:flex; justify-content:space-between; align-items:center;
                         padding:14px 16px; border-bottom:1px solid var(--border);
                         background:var(--card2);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="initial-box" style="width:34px; height:34px; font-size:14px;">
                        ${name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style="font-family:'Rajdhani',sans-serif; font-weight:700;
                                     font-size:1rem; color:var(--green);">${name}</div>
                        <div style="font-family:'Share Tech Mono',monospace; font-size:0.55rem;
                                     color:var(--dim); letter-spacing:1px;">DIRECT MESSAGE</div>
                    </div>
                </div>
                <button onclick="closeChat()"
                    style="background:rgba(255,77,77,0.1); border:1px solid rgba(255,77,77,0.2);
                           border-radius:8px; width:32px; height:32px; cursor:pointer;
                           color:#ff6b6b; font-size:1rem; display:flex;
                           align-items:center; justify-content:center;">✕</button>
            </div>

            <!-- Messages -->
            <div id="chat-box"
                style="height:240px; overflow-y:auto; padding:14px;
                        display:flex; flex-direction:column; gap:8px;
                        background:#000;">
                <p style="color:var(--border); text-align:center;
                           font-family:'Share Tech Mono',monospace;
                           font-size:0.62rem; letter-spacing:1px; margin:auto;">
                    💌 စာတိုလေး ပို့လိုက်ပါ
                </p>
            </div>

            <!-- Input Row -->
            <div style="display:flex; gap:8px; padding:12px;
                         border-top:1px solid var(--border); background:var(--card2);">
                <input type="text" id="mInput"
                    style="flex:1; background:#000; color:var(--text);
                           border:1px solid var(--border); padding:10px 14px;
                           border-radius:10px; outline:none; font-size:0.9rem;
                           font-family:'Barlow Condensed',sans-serif;"
                    placeholder="စာရေးရန်..."
                    onfocus="this.style.borderColor='rgba(0,255,136,0.4)'"
                    onblur="this.style.borderColor='var(--border)'"
                    onkeydown="if(event.key==='Enter') sendMsg('${targetUid}')">
                <button onclick="sendMsg('${targetUid}')"
                    style="background:var(--green); border:none; border-radius:10px;
                           width:42px; height:42px; cursor:pointer; display:flex;
                           align-items:center; justify-content:center; flex-shrink:0;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#000" stroke-width="2.5" stroke-linecap="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    listenMsgs(targetUid);
    setTimeout(() => document.getElementById('mInput')?.focus(), 100);
}

function sendMsg(targetUid) {
    const input = document.getElementById('mInput');
    const text  = input?.value.trim();
    if (!text || !auth.currentUser) return;

    input.value = "";
    db.collection("tw_messages").add({
        sender:    auth.currentUser.uid,
        receiver:  targetUid,
        text:      text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(e => window.showToast(e.message, "error"));
}

function listenMsgs(targetUid) {
    const myUid = auth.currentUser.uid;
    db.collection("tw_messages")
        .orderBy("timestamp", "asc")
        .onSnapshot(snap => {
            const chatBox = document.getElementById('chat-box');
            if (!chatBox) return;

            const msgs = snap.docs.filter(doc => {
                const d = doc.data();
                return (d.sender === myUid   && d.receiver === targetUid) ||
                       (d.sender === targetUid && d.receiver === myUid);
            });

            if (!msgs.length) return;

            chatBox.innerHTML = msgs.map(doc => {
                const m    = doc.data();
                const isMe = m.sender === myUid;
                const time = m.timestamp
                    ? new Date(m.timestamp.seconds * 1000)
                        .toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
                    : '';
                return `
                <div style="align-self:${isMe ? 'flex-end' : 'flex-start'};
                             max-width:80%; display:flex; flex-direction:column;
                             align-items:${isMe ? 'flex-end' : 'flex-start'}; gap:3px;">
                    <div style="background:${isMe ? 'var(--green)' : 'var(--card2)'};
                                 color:${isMe ? '#000' : 'var(--text)'};
                                 padding:8px 12px; border-radius:${isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
                                 font-size:0.9rem; font-family:'Barlow Condensed',sans-serif;
                                 line-height:1.4; word-break:break-word;">
                        ${escapeHtml(m.text)}
                    </div>
                    <div style="font-family:'Share Tech Mono',monospace; font-size:0.5rem;
                                 color:var(--dim);">${time}</div>
                </div>`;
            }).join('');

            chatBox.scrollTop = chatBox.scrollHeight;
        });
}

function closeChat() {
    const h = document.getElementById('modal-holder');
    if (h) h.innerHTML = '';
}
