/**
 * community.js — TW MM Tournament
 * Group Chat Style · Reply · Reactions · Delete
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

    main.innerHTML = `
        <div style="display:flex;flex-direction:column;height:calc(100vh - var(--nav-h) - 56px);">

            <!-- Group Header -->
            <div style="flex-shrink:0;background:#111;border-bottom:1px solid #222;
                         padding:12px 16px;display:flex;align-items:center;gap:12px;">
                <div style="width:42px;height:42px;border-radius:50%;
                             background:linear-gradient(135deg,#003d1a,#001a0a);
                             border:2px solid var(--green);
                             display:flex;align-items:center;justify-content:center;
                             font-size:1.3rem;">⚽</div>
                <div style="flex:1;">
                    <div style="font-family:'Rajdhani',sans-serif;font-weight:900;
                                 font-size:1rem;color:var(--green);letter-spacing:1px;">
                        TW MM GROUP
                    </div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:0.72rem;
                                 color:#666;font-weight:600;">Community Chat</div>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="width:7px;height:7px;background:var(--green);border-radius:50%;
                                  box-shadow:0 0 6px var(--green);display:inline-block;"></span>
                    <span style="font-family:'Rajdhani',sans-serif;font-size:0.72rem;
                                  color:var(--green);font-weight:700;">LIVE</span>
                </div>
            </div>

            <!-- Reply Banner -->
            <div id="reply-banner"
                 style="display:none;flex-shrink:0;
                        background:rgba(0,255,136,0.06);
                        border-bottom:1px solid rgba(0,255,136,0.15);
                        padding:8px 16px;align-items:center;gap:8px;">
                <div style="flex:1;border-left:3px solid var(--green);padding-left:8px;">
                    <div id="reply-to-name" style="font-family:'Rajdhani',sans-serif;
                         font-size:0.7rem;color:var(--green);font-weight:700;"></div>
                    <div id="reply-to-text" style="font-family:'Rajdhani',sans-serif;
                         font-size:0.8rem;color:#999;white-space:nowrap;overflow:hidden;
                         text-overflow:ellipsis;max-width:260px;"></div>
                </div>
                <button onclick="cancelReply()"
                    style="background:none;border:none;color:#666;
                           cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
            </div>

            <!-- Messages -->
            <div id="posts-list"
                style="flex:1;overflow-y:auto;padding:12px 14px;
                        display:flex;flex-direction:column;gap:10px;">
                <div class="loading"><div class="spinner"></div></div>
            </div>

            <!-- Input -->
            ${user ? `
            <div style="flex-shrink:0;background:#111;border-top:1px solid #222;
                         padding:10px 12px;display:flex;align-items:flex-end;gap:8px;">
                <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;
                             background:rgba(0,255,136,0.1);border:1.5px solid rgba(0,255,136,0.3);
                             display:flex;align-items:center;justify-content:center;
                             font-family:'Rajdhani',sans-serif;font-weight:900;
                             font-size:0.9rem;color:var(--green);">${init}</div>
                <textarea id="postInput" rows="1"
                    style="flex:1;background:#1a1a1a;color:var(--text);
                           border:1px solid #333;padding:10px 14px;
                           border-radius:20px;resize:none;max-height:100px;
                           font-family:'Barlow Condensed',sans-serif;font-size:0.95rem;
                           outline:none;transition:border 0.2s;line-height:1.4;overflow-y:auto;"
                    placeholder="Message..."
                    onfocus="this.style.borderColor='rgba(0,255,136,0.35)'"
                    onblur="this.style.borderColor='#333'"
                    oninput="autoResize(this)"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();savePost();}"></textarea>
                <button onclick="savePost()"
                    style="flex-shrink:0;width:40px;height:40px;border-radius:50%;
                           background:var(--green);border:none;cursor:pointer;
                           display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="#000" stroke-width="2.5" stroke-linecap="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>
            ` : `
            <div style="flex-shrink:0;background:#111;border-top:1px solid #222;
                         padding:14px;text-align:center;">
                <button onclick="window.renderAuthUI()" class="primary-btn"
                    style="max-width:200px;margin:0 auto;">LOGIN to Chat</button>
            </div>
            `}
        </div>

        <div id="modal-holder"></div>
        <div id="reaction-picker"
             style="display:none;position:fixed;z-index:5000;background:#1a1a1a;
                    border:1px solid #333;border-radius:12px;padding:8px 12px;
                    gap:6px;box-shadow:0 8px 24px rgba(0,0,0,0.7);">
        </div>
    `;

    loadPosts();
};

// ── Auto resize textarea ───────────────────────────────────────────────────────
window.autoResize = function(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
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
    }
    document.getElementById('postInput')?.focus();
};

window.cancelReply = function() {
    _replyTo = null;
    const banner = document.getElementById('reply-banner');
    if (banner) banner.style.display = 'none';
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
                  <div style="text-align:center;padding:40px 0;color:#444;">
                      <div style="font-size:2.5rem;margin-bottom:8px;">💬</div>
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.95rem;
                                   font-weight:700;">အရင်ဆုံး Message တင်လိုက်ပါ!</div>
                  </div>`;
              return;
          }

          const myUid  = _communityUid;
          const EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];

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
                  const iMine = myUid && users.includes(myUid);
                  return `<span onclick="toggleReaction('${docId}','${e}')"
                      style="background:${iMine?'rgba(0,255,136,0.15)':'#222'};
                             border:1px solid ${iMine?'rgba(0,255,136,0.4)':'#333'};
                             border-radius:20px;padding:2px 8px;font-size:0.78rem;
                             cursor:pointer;user-select:none;">${e} ${users.length}</span>`;
              }).join('');

              // Reply preview
              const replyHtml = p.replyToName ? `
                  <div style="border-left:3px solid rgba(0,255,136,0.5);
                               padding:4px 10px;margin-bottom:6px;
                               background:rgba(0,0,0,0.3);border-radius:0 6px 6px 0;">
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.7rem;
                                   color:var(--green);font-weight:700;">
                          ${escHtml(p.replyToName)}
                      </div>
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:#666;
                                   white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                                   max-width:220px;">
                          ${escHtml(p.replyToText||'')}
                      </div>
                  </div>` : '';

              const actionRow = `
                  <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;
                               margin-top:4px;${isMe?'justify-content:flex-end':''}">
                      ${reactionHtml}
                      <button onclick="showReactionPicker('${docId}',event)"
                          style="background:#1a1a1a;border:1px solid #333;border-radius:20px;
                                 padding:1px 7px;cursor:pointer;font-size:0.78rem;color:#666;
                                 line-height:1.6;">+ 😊</button>
                      <button onclick="setReply('${docId}','${p.name}','${escAttr(p.message)}')"
                          style="background:none;border:none;cursor:pointer;color:#555;
                                 font-family:'Rajdhani',sans-serif;font-size:0.75rem;
                                 font-weight:700;padding:0;">↩ Reply</button>
                      ${isMe ? `
                      <button onclick="deletePost('${docId}')"
                          style="background:none;border:none;cursor:pointer;color:#444;padding:0;">
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
                       style="display:flex;flex-direction:column;align-items:flex-end;gap:1px;">
                      <div style="font-family:'Rajdhani',sans-serif;font-size:0.68rem;
                                   color:#444;margin-right:6px;">${time}</div>
                      <div style="max-width:80%;">
                          ${replyHtml}
                          <div style="background:var(--green);color:#000;padding:10px 14px;
                                       border-radius:18px 4px 18px 18px;font-size:0.92rem;
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
                      <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;
                                   background:#1a1a1a;border:1.5px solid #2a2a2a;
                                   display:flex;align-items:center;justify-content:center;
                                   font-family:'Rajdhani',sans-serif;font-weight:900;
                                   font-size:0.85rem;color:var(--green);">${init}</div>
                      <div style="max-width:80%;">
                          <div style="font-family:'Rajdhani',sans-serif;font-size:0.72rem;
                                       color:var(--green);font-weight:700;margin-bottom:3px;">
                              ${escHtml(p.name)} <span style="color:#444;font-weight:600;">· ${time}</span>
                          </div>
                          ${replyHtml}
                          <div style="background:#1e1e1e;color:var(--text);padding:10px 14px;
                                       border-radius:4px 18px 18px 18px;font-size:0.92rem;
                                       font-family:'Barlow Condensed',sans-serif;
                                       line-height:1.5;word-break:break-word;
                                       border:1px solid #2a2a2a;">
                              ${escHtml(p.message)}
                          </div>
                          ${actionRow}
                      </div>
                  </div>`;
              }
          }).join('');

          // Scroll to bottom only if near bottom
          const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
          if (atBottom) list.scrollTop = list.scrollHeight;
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
               style="font-size:1.4rem;cursor:pointer;padding:3px 5px;
                      border-radius:8px;user-select:none;"
               onmouseover="this.style.background='#333'"
               onmouseout="this.style.background=''">${e}</span>`
    ).join('');

    const rect = event.target.getBoundingClientRect();
    picker.style.left = Math.min(rect.left, window.innerWidth-230) + 'px';
    picker.style.top  = (rect.top - 65) + 'px';

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

// ── Delete Post ───────────────────────────────────────────────────────────────
window.deletePost = function(docId) {
    if (!_communityUid) return;
    if (!confirm("Post ဖျက်မှာ သေချာပါသလား?")) return;
    db.collection("tw_posts").doc(docId).delete()
      .then(() => window.showToast("ဖျက်ပြီးပါပြီ ✅","success"))
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
