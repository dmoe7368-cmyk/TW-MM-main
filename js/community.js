/**
 * community.js — TW MM Tournament
 * Group Chat · Fixed Header+Input · Scroll Messages · Toast Confirm
 */

let _communityName = "User";
let _communityUid  = null;

// ── Render ────────────────────────────────────────────────────────────────────
window.renderCommunity = async function() {
    const main = document.getElementById('main-root');
    const user = auth.currentUser;
    _communityUid = user?.uid || null;

    if (user) {
        try {
            const doc = await db.collection("users").doc(user.uid).get();
            if (doc.exists)
                _communityName = doc.data().manager_name || doc.data().facebook_name || "User";
        } catch(e) {}
    }

    const init = _communityName.charAt(0).toUpperCase();

    // Use position:fixed for header & input so messages area scrolls freely
    main.innerHTML = `
        <div id="comm-wrap" style="position:relative;">

            <!-- ① Fixed Group Header -->
            <div id="comm-header"
                 style="position:fixed;top:56px;left:0;right:0;z-index:200;
                        background:rgba(8,0,20,0.98);border-bottom:1px solid rgba(255,255,255,0.08);
                        padding:11px 16px;display:flex;align-items:center;gap:12px;
                        max-width:100%;">
                <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;
                             background:linear-gradient(135deg,#003d1a,#001a0a);
                             border:2px solid #7dd8ff;
                             display:flex;align-items:center;justify-content:center;
                             font-size:1.2rem;">⚽</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-family:'Rajdhani',sans-serif;font-weight:900;
                                 font-size:1rem;color:#7dd8ff;letter-spacing:1px;">
                        TW MM GROUP
                    </div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:0.7rem;
                                 color:rgba(255,255,255,0.4);font-weight:600;">Community Chat</div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                    <span style="width:7px;height:7px;background:#7dd8ff;
                                  border-radius:50%;display:inline-block;
                                  box-shadow:0 0 6px #7dd8ff;
                                  animation:pulse-dot 1.8s ease-in-out infinite;"></span>
                    <span style="font-family:'Rajdhani',sans-serif;font-size:0.72rem;
                                  color:#7dd8ff;font-weight:800;letter-spacing:1px;">LIVE</span>
                </div>
            </div>

            <!-- ② Reply Banner (fixed, just below header) -->
            <div id="reply-banner"
                 style="display:none;position:fixed;top:112px;left:0;right:0;z-index:199;
                        background:rgba(0,20,10,0.95);
                        border-bottom:1px solid rgba(80,190,255,0.2);
                        padding:7px 16px;align-items:center;gap:8px;
                        backdrop-filter:blur(8px);">
                <div style="flex:1;border-left:3px solid #7dd8ff;padding-left:8px;">
                    <div id="reply-to-name" style="font-family:'Rajdhani',sans-serif;
                         font-size:0.7rem;color:#7dd8ff;font-weight:800;"></div>
                    <div id="reply-to-text" style="font-family:'Rajdhani',sans-serif;
                         font-size:0.8rem;color:rgba(255,255,255,0.38);white-space:nowrap;overflow:hidden;
                         text-overflow:ellipsis;max-width:270px;"></div>
                </div>
                <button onclick="cancelReply()"
                    style="background:rgba(80,190,255,0.06);border:1px solid rgba(80,190,255,0.2);
                           border-radius:50%;width:26px;height:26px;color:rgba(255,255,255,0.5);
                           cursor:pointer;font-size:0.9rem;display:flex;
                           align-items:center;justify-content:center;flex-shrink:0;">✕</button>
            </div>

            <!-- ③ Scrollable Messages -->
            <div id="posts-list"
                 style="padding:8px 14px 16px;
                        display:flex;flex-direction:column;gap:10px;
                        /* top/bottom padding handled via margin-top/padding-bottom dynamically */">
                <div class="loading"><div class="spinner"></div></div>
            </div>

            <!-- ④ Fixed Input Bar -->
            <div id="comm-input-bar"
                 style="position:fixed;bottom:var(--nav-h);left:0;right:0;z-index:200;
                        background:rgba(8,0,20,0.98);border-top:1px solid rgba(255,255,255,0.08);
                        padding:8px 12px;max-width:100%;">
                ${user ? `
                <div style="display:flex;align-items:flex-end;gap:8px;">
                    <div style="width:30px;height:30px;border-radius:50%;flex-shrink:0;
                                 background:rgba(80,190,255,0.12);
                                 border:1.5px solid rgba(80,190,255,0.28);
                                 display:flex;align-items:center;justify-content:center;
                                 font-family:'Rajdhani',sans-serif;font-weight:900;
                                 font-size:0.85rem;color:#7dd8ff;">${init}</div>
                    <textarea id="postInput" rows="1"
                        style="flex:1;background:rgba(255,255,255,0.07);color:#ffffff;
                               border:1px solid rgba(255,255,255,0.12);padding:9px 14px;
                               border-radius:20px;resize:none;max-height:90px;
                               font-family:'Barlow Condensed',sans-serif;font-size:0.95rem;
                               outline:none;transition:border 0.2s;line-height:1.4;
                               overflow-y:auto;"
                        placeholder="Message..."
                        onfocus="this.style.borderColor='rgba(80,190,255,0.5)'"
                        onblur="this.style.borderColor='rgba(255,255,255,0.12)'"
                        oninput="autoResize(this)"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();savePost();}"></textarea>
                    <button onclick="savePost()"
                        style="flex-shrink:0;width:38px;height:38px;border-radius:50%;
                               background:#7dd8ff;border:none;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;
                               box-shadow:0 2px 10px rgba(80,190,255,0.28);">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                             stroke="#000" stroke-width="2.5" stroke-linecap="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
                ` : `
                <button onclick="window.renderAuthUI()" class="primary-btn"
                    style="width:100%;max-width:280px;margin:0 auto;display:block;">
                    LOGIN to Chat
                </button>
                `}
            </div>
        </div>

        <div id="modal-holder"></div>
        <div id="reaction-picker"
             style="display:none;position:fixed;z-index:5000;background:#1e1e1e;
                    border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:10px 14px;
                    gap:8px;box-shadow:0 8px 28px rgba(0,0,0,0.8);align-items:center;">
        </div>

        <style>
            @keyframes pulse-dot {
                0%,100% { opacity:1; transform:scale(1); }
                50%      { opacity:0.5; transform:scale(0.7); }
            }
        </style>
    `;

    // Calculate and apply dynamic spacing
    _updateCommLayout();
    loadPosts();
};

// ── Dynamic layout spacing ─────────────────────────────────────────────────────
function _updateCommLayout() {
    // Wait for DOM
    requestAnimationFrame(() => {
        const header  = document.getElementById('comm-header');
        const inputBar = document.getElementById('comm-input-bar');
        const list    = document.getElementById('posts-list');
        if (!header || !inputBar || !list) return;

        const hH = header.offsetHeight;   // ~62px
        const iH = inputBar.offsetHeight; // ~56px
        const navH = 68;

        list.style.marginTop    = (hH + 56) + 'px'; // 56 = app-header height
        list.style.paddingBottom = (iH + navH + 16) + 'px';
    });
}

// ── Auto resize textarea ───────────────────────────────────────────────────────
window.autoResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
    _updateCommLayout();
};

// ── Reply ─────────────────────────────────────────────────────────────────────
let _replyTo = null;

window.setReply = function(docId, name, text) {
    _replyTo = { docId, name, text };
    const banner = document.getElementById('reply-banner');
    if (banner) {
        banner.style.display = 'flex';
        document.getElementById('reply-to-name').textContent = '↩ ' + name;
        document.getElementById('reply-to-text').textContent = text;
        _updateCommLayout();
    }
    document.getElementById('postInput')?.focus();
};

window.cancelReply = function() {
    _replyTo = null;
    const banner = document.getElementById('reply-banner');
    if (banner) banner.style.display = 'none';
    _updateCommLayout();
};

// ── Save Post ─────────────────────────────────────────────────────────────────
window.savePost = function() {
    const input = document.getElementById('postInput');
    const text  = input?.value.trim();
    const user  = auth.currentUser;
    if (!text) return;
    if (!user) return window.showToast("Login အရင်ဝင်ပါ","error");

    const data = {
        name:      _communityName,
        uid:       user.uid,
        message:   text,
        reactions: {},
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (_replyTo) {
        data.replyToId   = _replyTo.docId;
        data.replyToName = _replyTo.name;
        data.replyToText = _replyTo.text;
    }

    input.value = '';
    input.style.height = 'auto';
    cancelReply();

    db.collection("tw_posts").add(data)
      .catch(e => window.showToast(e.message,"error"));
};

// ── Load Posts ────────────────────────────────────────────────────────────────
function loadPosts() {
    db.collection("tw_posts")
      .orderBy("timestamp","asc")
      .limit(80)
      .onSnapshot(snapshot => {
          const list = document.getElementById('posts-list');
          if (!list) return;

          if (snapshot.empty) {
              list.innerHTML = `
                  <div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.2);">
                      <div style="font-size:2.5rem;margin-bottom:10px;">💬</div>
                      <div style="font-family:'Rajdhani',sans-serif;font-size:1rem;
                                   font-weight:700;color:rgba(255,255,255,0.2);">
                          အရင်ဆုံး Message တင်လိုက်ပါ!
                      </div>
                  </div>`;
              return;
          }

          const myUid  = _communityUid;
          const EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];

          const wasAtBottom = (() => {
              const l = document.getElementById('posts-list');
              if (!l) return true;
              return l.scrollHeight - l.scrollTop - l.clientHeight < 140;
          })();

          list.innerHTML = snapshot.docs.map(doc => {
              const p     = doc.data();
              const docId = doc.id;
              const isMe  = p.uid === myUid;
              const init  = (p.name||'?').charAt(0).toUpperCase();
              const time  = p.timestamp
                  ? new Date(p.timestamp.seconds*1000)
                      .toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
                  : '';

              // Reactions
              const reactions = p.reactions || {};
              const reactionHtml = EMOJIS.map(e => {
                  const users = reactions[e] || [];
                  if (!users.length) return '';
                  const mine = myUid && users.includes(myUid);
                  return `<span onclick="toggleReaction('${docId}','${e}')"
                      style="background:${mine?'rgba(80,190,255,0.15)':'#1e1e1e'};
                             border:1px solid ${mine?'rgba(80,190,255,0.4)':'#2a2a2a'};
                             border-radius:20px;padding:2px 8px;font-size:0.78rem;
                             cursor:pointer;user-select:none;transition:0.15s;">${e} ${users.length}</span>`;
              }).join('');

              // Reply preview
              const replyHtml = p.replyToName ? `
                  <div style="border-left:3px solid rgba(80,190,255,0.5);padding:4px 10px;
                               margin-bottom:6px;background:rgba(0,0,0,0.4);
                               border-radius:0 6px 6px 0;">
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.68rem;
                                   color:#7dd8ff;font-weight:800;">
                          ${escHtml(p.replyToName)}
                      </div>
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.78rem;
                                   color:rgba(255,255,255,0.35);white-space:nowrap;overflow:hidden;
                                   text-overflow:ellipsis;max-width:200px;">
                          ${escHtml(p.replyToText||'')}
                      </div>
                  </div>` : '';

              const actionRow = `
                  <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;
                               margin-top:5px;${isMe?'justify-content:flex-end':''}">
                      ${reactionHtml}
                      <button onclick="showReactionPicker('${docId}',event)"
                          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                                 border-radius:20px;padding:2px 8px;cursor:pointer;
                                 font-size:0.75rem;color:rgba(255,255,255,0.35);line-height:1.6;">+ 😊</button>
                      <button onclick="setReply('${docId}','${escAttr(p.name)}','${escAttr(p.message)}')"
                          style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4);
                                 font-family:'Rajdhani',sans-serif;font-size:0.75rem;
                                 font-weight:800;padding:0 2px;">↩ Reply</button>
                      ${isMe ? `
                      <button onclick="deletePost('${docId}')"
                          style="background:none;border:none;cursor:pointer;
                                 color:rgba(255,255,255,0.2);padding:0 2px;">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                               stroke="currentColor" stroke-width="2" stroke-linecap="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                      </button>` : ''}
                  </div>`;

              if (isMe) {
                  return `
                  <div id="post-${docId}"
                       style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.65rem;
                                   color:rgba(255,255,255,0.28);margin-right:4px;">${time}</div>
                      <div style="max-width:80%;">
                          ${replyHtml}
                          <div style="background:linear-gradient(135deg,rgba(80,190,255,0.28),rgba(120,70,220,0.32));color:#ffffff;padding:10px 14px;
                                       border-radius:18px 4px 18px 18px;border:1px solid rgba(80,190,255,0.35);font-size:0.92rem;
                                       font-family:'Barlow Condensed',sans-serif;
                                       line-height:1.5;word-break:break-word;">
                              ${escHtml(p.message)}
                          </div>
                      </div>
                      ${actionRow}
                  </div>`;
              } else {
                  return `
                  <div id="post-${docId}" style="display:flex;align-items:flex-start;gap:8px;">
                      <div style="width:30px;height:30px;border-radius:50%;flex-shrink:0;
                                   background:rgba(80,190,255,0.15);border:1.5px solid rgba(80,190,255,0.3);
                                   display:flex;align-items:center;justify-content:center;
                                   font-family:'Rajdhani',sans-serif;font-weight:900;
                                   font-size:0.82rem;color:#7dd8ff;">${init}</div>
                      <div style="max-width:80%;">
                          <div style="font-family:'Rajdhani',sans-serif;font-size:0.7rem;
                                       color:#7dd8ff;font-weight:800;margin-bottom:3px;">
                              ${escHtml(p.name)}
                              <span style="color:rgba(255,255,255,0.3);font-weight:600;">· ${time}</span>
                          </div>
                          ${replyHtml}
                          <div style="background:rgba(255,255,255,0.07);color:#ffffff;padding:10px 14px;
                                       border-radius:4px 18px 18px 18px;font-size:0.92rem;
                                       font-family:'Barlow Condensed',sans-serif;
                                       line-height:1.5;word-break:break-word;
                                       border:1px solid #242424;">
                              ${escHtml(p.message)}
                          </div>
                          ${actionRow}
                      </div>
                  </div>`;
              }
          }).join('');

          if (wasAtBottom) {
              setTimeout(() => {
                  const l = document.getElementById('posts-list');
                  if (l) l.scrollTop = l.scrollHeight;
              }, 50);
          }
      });
}

// ── Reaction Picker ───────────────────────────────────────────────────────────
const _EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];

window.showReactionPicker = function(docId, event) {
    if (!_communityUid) return window.showToast("Login ဝင်ပါ","error");
    event.stopPropagation();
    const picker = document.getElementById('reaction-picker');
    if (!picker) return;

    picker.style.display = 'flex';
    picker.innerHTML = _EMOJIS.map(e =>
        `<span onclick="toggleReaction('${docId}','${e}');hidePicker();"
               style="font-size:1.5rem;cursor:pointer;padding:3px 5px;
                      border-radius:8px;user-select:none;transition:0.12s;"
               onmouseover="this.style.background='rgba(255,255,255,0.1)'"
               onmouseout="this.style.background=''">${e}</span>`
    ).join('');

    const rect = event.target.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - 250);
    const top  = rect.top - 68;
    picker.style.left = left + 'px';
    picker.style.top  = top + 'px';

    setTimeout(() => document.addEventListener('click', hidePicker, {once:true}), 10);
};

window.hidePicker = function() {
    const p = document.getElementById('reaction-picker');
    if (p) p.style.display = 'none';
};

window.toggleReaction = function(docId, emoji) {
    if (!_communityUid) return window.showToast("Login ဝင်ပါ","error");
    const ref = db.collection("tw_posts").doc(docId);
    ref.get().then(snap => {
        if (!snap.exists) return;
        const reactions = snap.data().reactions || {};
        const users = reactions[emoji] || [];
        reactions[emoji] = users.includes(_communityUid)
            ? users.filter(u => u !== _communityUid)
            : [...users, _communityUid];
        ref.update({ reactions });
    });
};

// ── Delete Post — Toast Confirm (no browser alert) ────────────────────────────
window.deletePost = function(docId) {
    if (!_communityUid) return;

    // Custom toast confirm — no browser alert
    const holder = document.getElementById('modal-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);
                     backdrop-filter:blur(6px);z-index:4000;
                     display:flex;align-items:flex-end;justify-content:center;
                     padding-bottom:calc(var(--nav-h) + 16px);"
             onclick="this.parentElement.innerHTML=''">
            <div onclick="event.stopPropagation()"
                 style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                        border-radius:18px 18px 14px 14px;
                        width:92%;max-width:380px;overflow:hidden;
                        box-shadow:0 -4px 30px rgba(0,0,0,0.6);">
                <div style="padding:18px 20px 14px;text-align:center;
                             border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="font-size:1.8rem;margin-bottom:8px;">🗑️</div>
                    <div style="font-family:'Rajdhani',sans-serif;font-weight:900;
                                 font-size:1rem;color:var(--text);">Post ဖျက်မှာလား?</div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;
                                 color:rgba(255,255,255,0.4);margin-top:4px;">ဖျက်ပြီးရင် ပြန်မရနိုင်ပါ</div>
                </div>
                <div style="display:flex;">
                    <button onclick="document.getElementById('modal-holder').innerHTML=''"
                        style="flex:1;padding:16px;background:none;border:none;
                               border-right:1px solid rgba(255,255,255,0.08);cursor:pointer;
                               font-family:'Rajdhani',sans-serif;font-weight:800;
                               font-size:0.95rem;color:rgba(255,255,255,0.5);">Cancel</button>
                    <button onclick="_confirmDelete('${docId}')"
                        style="flex:1;padding:16px;background:none;border:none;
                               cursor:pointer;font-family:'Rajdhani',sans-serif;
                               font-weight:900;font-size:0.95rem;color:#ff4d4d;">
                        Delete
                    </button>
                </div>
            </div>
        </div>`;
};

window._confirmDelete = function(docId) {
    document.getElementById('modal-holder').innerHTML = '';
    db.collection("tw_posts").doc(docId).delete()
      .then(() => window.showToast("Post ဖျက်ပြီးပါပြီ ✅","success"))
      .catch(e => window.showToast(e.message,"error"));
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str||'')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(str) {
    return String(str||'').replace(/'/g,"\\'").substring(0,80);
}
