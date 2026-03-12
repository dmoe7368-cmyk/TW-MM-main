/**
 * community.js — TW MM Tournament v14
 * Features: Text, Reply, Reactions, Delete
 */

var _replyTo       = null;
var _communityName = '';
var _communityUid  = '';

function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
    if (!s) return '';
    return String(s).replace(/'/g,'&#39;').replace(/"/g,'&quot;');
}

// ── Render ────────────────────────────────────────────────────
window.renderCommunity = function() {
    const main = document.getElementById('content-display') || document.getElementById('main-root');
    if (!main) return;

    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).get().then(d => {
            _communityName = d.exists ? (d.data().manager_name || user.displayName || 'Manager') : 'Manager';
            _communityUid  = user.uid;
        });
    }

    const init = _communityName ? _communityName.charAt(0).toUpperCase() : '?';

    main.innerHTML = `
        <div style="display:flex;flex-direction:column;height:calc(100vh - var(--nav-h));position:relative;">

            <!-- Header -->
            <div style="flex-shrink:0;padding:12px 14px 8px;background:rgba(8,0,20,0.98);
                border-bottom:1px solid rgba(255,255,255,0.07);position:sticky;top:0;z-index:100;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:10px;
                        background:rgba(80,190,255,0.12);border:1.5px solid rgba(80,190,255,0.3);
                        display:flex;align-items:center;justify-content:center;font-size:1.2rem;">💬</div>
                    <div>
                        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
                            font-size:1.1rem;color:#fff;letter-spacing:1px;">TW MM CHAT</div>
                        <div style="font-size:0.62rem;color:rgba(255,255,255,0.35);letter-spacing:1px;">COMMUNITY</div>
                    </div>
                </div>
            </div>

            <!-- Posts List -->
            <div id="posts-list" style="flex:1;overflow-y:auto;padding:10px 10px 8px;
                display:flex;flex-direction:column;gap:8px;"></div>

            <!-- Reply Banner -->
            <div id="reply-banner" style="display:none;flex-shrink:0;
                padding:6px 14px;background:rgba(80,190,255,0.08);
                border-top:1px solid rgba(80,190,255,0.2);
                align-items:center;justify-content:space-between;">
                <div style="font-size:0.75rem;color:#7dd8ff;">
                    <span style="opacity:0.6;">↩ Replying to </span>
                    <span id="reply-name" style="font-weight:700;"></span>
                </div>
                <button onclick="cancelReply()" style="background:none;border:none;
                    color:rgba(255,255,255,0.4);cursor:pointer;font-size:1rem;">✕</button>
            </div>

            <!-- Input Bar -->
            <div id="comm-input-bar" style="flex-shrink:0;
                background:rgba(8,0,20,0.98);border-top:1px solid rgba(255,255,255,0.08);
                padding:10px 12px;">
                ${user ? `
                <div style="display:flex;align-items:flex-end;gap:8px;">
                    <div style="width:32px;height:32px;border-radius:50%;flex-shrink:0;
                        background:rgba(80,190,255,0.12);border:1.5px solid rgba(80,190,255,0.28);
                        display:flex;align-items:center;justify-content:center;
                        font-family:'Rajdhani',sans-serif;font-weight:900;
                        font-size:0.9rem;color:#7dd8ff;">${init}</div>
                    <textarea id="postInput" rows="1"
                        style="flex:1;background:rgba(255,255,255,0.07);color:#ffffff;
                               border:1px solid rgba(255,255,255,0.12);padding:10px 14px;
                               border-radius:22px;resize:none;max-height:100px;
                               font-family:'Barlow Condensed',sans-serif;font-size:1rem;
                               outline:none;transition:border 0.2s;line-height:1.5;
                               overflow-y:auto;"
                        placeholder="Message..."
                        onfocus="this.style.borderColor='rgba(80,190,255,0.5)'"
                        onblur="this.style.borderColor='rgba(255,255,255,0.12)'"
                        oninput="autoResize(this)"
                        onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();savePost();}"></textarea>
                    <button onclick="savePost()"
                        style="flex-shrink:0;width:40px;height:40px;border-radius:50%;
                               background:#7dd8ff;border:none;cursor:pointer;
                               display:flex;align-items:center;justify-content:center;
                               box-shadow:0 2px 10px rgba(80,190,255,0.28);">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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
    `;

    loadPosts();
    _updateCommLayout();
};

function _updateCommLayout() {
    const list    = document.getElementById('posts-list');
    const inputBar = document.getElementById('comm-input-bar');
    const banner   = document.getElementById('reply-banner');
    if (!list || !inputBar) return;
    const iH = inputBar.offsetHeight;
    const bH = (banner && banner.style.display !== 'none') ? banner.offsetHeight : 0;
    list.style.paddingBottom = (iH + bH + 8) + 'px';
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

// ── Save Post ─────────────────────────────────────────────────
window.savePost = function() {
    const input = document.getElementById('postInput');
    const text  = input?.value.trim();
    const user  = auth.currentUser;
    if (!text) return;
    if (!user) return window.showToast('Login အရင်ဝင်ပါ', 'error');

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

    db.collection('tw_posts').add(data)
      .catch(e => window.showToast(e.message, 'error'));
};

// ── Delete Post ───────────────────────────────────────────────
window.deletePost = async function(docId) {
    if (!confirm('Message ဖျက်မှာ သေချာလား?')) return;
    try {
        await db.collection('tw_posts').doc(docId).delete();
        window.showToast('ဖျက်ပြီးပါပြီ', 'success');
    } catch(e) {
        window.showToast('ဖျက်မရဘူး: ' + e.message, 'error');
    }
};

// ── Reply ─────────────────────────────────────────────────────
window.setReply = function(docId, name, text) {
    _replyTo = { docId, name, text };
    const banner = document.getElementById('reply-banner');
    const rName  = document.getElementById('reply-name');
    if (banner) banner.style.display = 'flex';
    if (rName)  rName.textContent = name;
    _updateCommLayout();
    document.getElementById('postInput')?.focus();
};

window.cancelReply = function() {
    _replyTo = null;
    const banner = document.getElementById('reply-banner');
    if (banner) banner.style.display = 'none';
    _updateCommLayout();
};

// ── Reactions ─────────────────────────────────────────────────
window.toggleReaction = function(docId, emoji) {
    const user = auth.currentUser;
    if (!user) return window.showToast('Login အရင်ဝင်ပါ', 'error');
    const ref = db.collection('tw_posts').doc(docId);
    db.runTransaction(async tx => {
        const doc  = await tx.get(ref);
        const reax = doc.data().reactions || {};
        const arr  = reax[emoji] || [];
        const idx  = arr.indexOf(user.uid);
        if (idx > -1) arr.splice(idx, 1); else arr.push(user.uid);
        reax[emoji] = arr;
        tx.update(ref, { reactions: reax });
    });
};

window.showEmojiPicker = function(docId) {
    const EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];
    const existing = document.getElementById('emoji-picker');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.id = 'emoji-picker';
    picker.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
        background:#1a0030;border:1px solid rgba(255,255,255,0.15);border-radius:16px;
        padding:12px 16px;display:flex;gap:12px;z-index:999;
        box-shadow:0 8px 32px rgba(0,0,0,0.5);`;
    picker.innerHTML = EMOJIS.map(e =>
        `<button onclick="toggleReaction('${docId}','${e}');document.getElementById('emoji-picker').remove();"
            style="background:none;border:none;cursor:pointer;font-size:1.6rem;">${e}</button>`
    ).join('') + `<button onclick="this.parentElement.remove()"
        style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-size:1.1rem;">✕</button>`;

    document.body.appendChild(picker);
    setTimeout(() => { if (document.getElementById('emoji-picker')) picker.remove(); }, 5000);
};

// ── Load Posts ────────────────────────────────────────────────
function loadPosts() {
    db.collection('tw_posts')
      .orderBy('timestamp', 'asc')
      .limit(80)
      .onSnapshot(snapshot => {
          const list = document.getElementById('posts-list');
          if (!list) return;

          if (snapshot.empty) {
              list.innerHTML = `
                  <div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.2);">
                      <div style="font-size:2.5rem;margin-bottom:10px;">💬</div>
                      <div style="font-family:'Rajdhani',sans-serif;font-size:1rem;font-weight:700;">
                          အရင်ဆုံး Message တင်လိုက်ပါ!
                      </div>
                  </div>`;
              return;
          }

          const myUid  = _communityUid;
          const EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];
          const wasAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 140;

          list.innerHTML = snapshot.docs.map(doc => {
              const p     = doc.data();
              const docId = doc.id;
              const isMe  = p.uid === myUid;
              const reax  = p.reactions || {};
              const time  = p.timestamp
                  ? new Date(p.timestamp.seconds * 1000)
                      .toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})
                  : '';

              // Reply quote
              const replyHtml = p.replyToId ? `
                  <div style="background:rgba(255,255,255,0.06);border-left:3px solid #7dd8ff;
                      border-radius:6px;padding:6px 10px;margin-bottom:8px;">
                      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
                          font-size:0.78rem;color:#7dd8ff;">${escHtml(p.replyToName)}</div>
                      <div style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:2px;">
                          ${escHtml((p.replyToText||'').substring(0,60))}${(p.replyToText||'').length>60?'…':''}
                      </div>
                  </div>` : '';

              // Reactions
              const reaxBtns = EMOJIS.map(e => {
                  const arr   = reax[e] || [];
                  const count = arr.length;
                  const mine  = arr.includes(myUid);
                  return count > 0
                      ? `<button onclick="toggleReaction('${docId}','${e}')"
                          style="background:${mine ? 'rgba(80,190,255,0.15)' : 'rgba(255,255,255,0.06)'};
                          border:1px solid ${mine ? 'rgba(80,190,255,0.4)' : 'rgba(255,255,255,0.1)'};
                          border-radius:20px;padding:3px 9px;cursor:pointer;
                          font-size:0.82rem;color:#fff;">${e} ${count}</button>`
                      : '';
              }).join('');

              return `
                  <div style="display:flex;flex-direction:column;
                      align-items:${isMe ? 'flex-end' : 'flex-start'};">

                      <!-- Name (others only) -->
                      ${!isMe ? `
                      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
                          font-size:0.78rem;color:#7dd8ff;margin-bottom:3px;padding-left:4px;">
                          ${escHtml(p.name)}
                      </div>` : ''}

                      <!-- Bubble -->
                      <div style="max-width:82%;
                          background:${isMe ? 'rgba(80,190,255,0.12)' : 'rgba(255,255,255,0.07)'};
                          border:1px solid ${isMe ? 'rgba(80,190,255,0.22)' : 'rgba(255,255,255,0.1)'};
                          border-radius:${isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};
                          padding:10px 13px;">

                          ${replyHtml}

                          <!-- Message text -->
                          <div style="font-family:'Barlow Condensed',sans-serif;
                              font-size:1.05rem;font-weight:500;
                              color:rgba(255,255,255,0.95);
                              line-height:1.55;word-break:break-word;">
                              ${escHtml(p.message)}
                          </div>

                          <!-- Time + actions -->
                          <div style="display:flex;align-items:center;justify-content:flex-end;
                              gap:8px;margin-top:5px;">
                              <span style="font-size:0.65rem;color:rgba(255,255,255,0.28);">${time}</span>
                              <button onclick="setReply('${docId}','${escAttr(p.name)}','${escAttr(p.message)}')"
                                  style="background:none;border:none;cursor:pointer;
                                  font-size:0.7rem;color:rgba(255,255,255,0.28);padding:0;">↩</button>
                              ${isMe ? `
                              <button onclick="deletePost('${docId}')"
                                  style="background:none;border:none;cursor:pointer;
                                  font-size:0.7rem;color:rgba(248,113,113,0.4);padding:0;">🗑</button>` : ''}
                          </div>
                      </div>

                      <!-- Reactions row -->
                      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:5px;
                          ${isMe ? 'justify-content:flex-end;' : ''}">
                          ${reaxBtns}
                          <button onclick="showEmojiPicker('${docId}')"
                              style="background:rgba(255,255,255,0.04);
                              border:1px solid rgba(255,255,255,0.08);
                              border-radius:20px;padding:3px 9px;cursor:pointer;
                              font-size:0.82rem;color:rgba(255,255,255,0.3);">＋</button>
                      </div>
                  </div>`;
          }).join('');

          if (wasAtBottom) list.scrollTop = list.scrollHeight;
      });
}
