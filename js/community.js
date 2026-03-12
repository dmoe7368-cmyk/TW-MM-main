/**
 * community.js — TW MM Tournament v14
 * Features: Text, Photo upload, Voice record/playback, Reply, Reactions
 */

var _replyTo       = null;
var _communityName = '';
var _communityUid  = '';
var _mediaRecorder = null;
var _audioChunks   = [];
var _isRecording   = false;

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
                display:flex;flex-direction:column;gap:6px;"></div>

            <!-- Reply Banner -->
            <div id="reply-banner" style="display:none;flex-shrink:0;
                padding:6px 14px;background:rgba(80,190,255,0.08);
                border-top:1px solid rgba(80,190,255,0.2);
                display:none;align-items:center;justify-content:space-between;">
                <div style="font-size:0.72rem;color:#7dd8ff;">
                    <span style="opacity:0.6;">↩ Replying to </span>
                    <span id="reply-name" style="font-weight:700;"></span>
                </div>
                <button onclick="cancelReply()" style="background:none;border:none;
                    color:rgba(255,255,255,0.4);cursor:pointer;font-size:1rem;">✕</button>
            </div>

            <!-- Input Bar -->
            <div id="comm-input-bar" style="flex-shrink:0;
                background:rgba(8,0,20,0.98);border-top:1px solid rgba(255,255,255,0.08);
                padding:8px 10px;">
                ${user ? `
                <!-- Media toolbar -->
                <div id="media-toolbar" style="display:flex;gap:8px;margin-bottom:6px;">
                    <!-- Photo button -->
                    <label style="width:34px;height:34px;border-radius:10px;
                        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        <input type="file" accept="image/*" id="photo-input"
                            style="display:none;" onchange="handlePhotoSelect(event)">
                    </label>
                    <!-- Voice button -->
                    <button id="voice-btn" onclick="toggleVoiceRecord()"
                        style="width:34px;height:34px;border-radius:10px;
                        background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </button>
                    <!-- Photo preview -->
                    <div id="photo-preview" style="display:none;align-items:center;gap:6px;
                        background:rgba(80,190,255,0.08);border-radius:10px;padding:4px 10px;
                        border:1px solid rgba(80,190,255,0.2);flex:1;">
                        <span style="font-size:0.72rem;color:#7dd8ff;" id="photo-name"></span>
                        <button onclick="clearPhoto()" style="background:none;border:none;
                            color:rgba(255,255,255,0.4);cursor:pointer;margin-left:auto;">✕</button>
                    </div>
                    <!-- Recording indicator -->
                    <div id="rec-indicator" style="display:none;align-items:center;gap:8px;
                        background:rgba(248,113,113,0.1);border-radius:10px;padding:4px 12px;
                        border:1px solid rgba(248,113,113,0.3);flex:1;">
                        <div style="width:8px;height:8px;border-radius:50%;background:#f87171;
                            animation:pulse 1s infinite;"></div>
                        <span style="font-size:0.72rem;color:#f87171;" id="rec-timer">0:00</span>
                        <button onclick="cancelVoice()" style="background:none;border:none;
                            color:rgba(255,255,255,0.4);cursor:pointer;margin-left:auto;">✕</button>
                    </div>
                </div>

                <!-- Text input row -->
                <div style="display:flex;align-items:flex-end;gap:8px;">
                    <div style="width:30px;height:30px;border-radius:50%;flex-shrink:0;
                        background:rgba(80,190,255,0.12);border:1.5px solid rgba(80,190,255,0.28);
                        display:flex;align-items:center;justify-content:center;
                        font-family:'Rajdhani',sans-serif;font-weight:900;
                        font-size:0.85rem;color:#7dd8ff;">${init}</div>
                    <textarea id="postInput" rows="1"
                        style="flex:1;background:rgba(255,255,255,0.07);color:#ffffff;
                               border:1px solid rgba(255,255,255,0.12);padding:9px 14px;
                               border-radius:20px;resize:none;max-height:90px;
                               font-family:'Barlow Condensed',sans-serif;font-size:0.95rem;
                               outline:none;transition:border 0.2s;line-height:1.4;overflow-y:auto;"
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
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
}

// ── Photo ─────────────────────────────────────────────────────
var _selectedPhoto = null;

window.handlePhotoSelect = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    _selectedPhoto = file;
    const prev = document.getElementById('photo-preview');
    const name = document.getElementById('photo-name');
    if (prev) prev.style.display = 'flex';
    if (name) name.textContent = '📷 ' + file.name.substring(0, 20);
};

window.clearPhoto = function() {
    _selectedPhoto = null;
    const prev  = document.getElementById('photo-preview');
    const input = document.getElementById('photo-input');
    if (prev)  prev.style.display = 'none';
    if (input) input.value = '';
};

async function compressPhoto(file) {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            // Max width = screen width * 2 (retina) — max 1200px
            const maxW   = Math.min(window.innerWidth * 2, 1200);
            const scale  = img.width > maxW ? maxW / img.width : 1;
            const canvas = document.createElement('canvas');
            canvas.width  = Math.round(img.width  * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.75);
        };
        img.src = url;
    });
}

async function uploadPhoto(file) {
    const user       = auth.currentUser;
    const compressed = await compressPhoto(file);
    const path = `community/${user.uid}/${Date.now()}.jpg`;
    const ref  = firebase.storage().ref(path);
    await ref.put(compressed, { contentType: 'image/jpeg' });
    return await ref.getDownloadURL();
}

// ── Voice ─────────────────────────────────────────────────────
var _recInterval = null;
var _recSeconds  = 0;
var _audioBlob   = null;

window.toggleVoiceRecord = async function() {
    if (_isRecording) {
        // Stop
        _mediaRecorder && _mediaRecorder.stop();
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        _audioChunks  = [];
        _mediaRecorder = new MediaRecorder(stream);
        _isRecording   = true;
        _recSeconds    = 0;

        // UI
        const btn = document.getElementById('voice-btn');
        const rec = document.getElementById('rec-indicator');
        if (btn) btn.style.background = 'rgba(248,113,113,0.2)';
        if (rec) rec.style.display = 'flex';

        _recInterval = setInterval(() => {
            _recSeconds++;
            const t = document.getElementById('rec-timer');
            if (t) t.textContent = Math.floor(_recSeconds/60) + ':' + String(_recSeconds%60).padStart(2,'0');
            if (_recSeconds >= 120) window.toggleVoiceRecord(); // 2min max
        }, 1000);

        _mediaRecorder.ondataavailable = e => _audioChunks.push(e.data);
        _mediaRecorder.onstop = async () => {
            _isRecording = false;
            clearInterval(_recInterval);
            stream.getTracks().forEach(t => t.stop());

            const btn = document.getElementById('voice-btn');
            const rec = document.getElementById('rec-indicator');
            if (btn) btn.style.background = 'rgba(255,255,255,0.06)';
            if (rec) rec.style.display = 'none';

            _audioBlob = new Blob(_audioChunks, { type: 'audio/webm' });
            // Auto send
            await sendVoiceMsg(_audioBlob, _recSeconds);
            _audioBlob = null;
        };

        _mediaRecorder.start();
    } catch(e) {
        window.showToast('Microphone access မရဘူး', 'error');
    }
};

window.cancelVoice = function() {
    if (_mediaRecorder && _isRecording) {
        _mediaRecorder.stop();
        _audioBlob = null;
    }
    _isRecording = false;
    clearInterval(_recInterval);
    const btn = document.getElementById('voice-btn');
    const rec = document.getElementById('rec-indicator');
    if (btn) btn.style.background = 'rgba(255,255,255,0.06)';
    if (rec) rec.style.display = 'none';
};

async function uploadVoice(blob) {
    const user = auth.currentUser;
    const path = `community/voice/${user.uid}_${Date.now()}.webm`;
    const ref  = firebase.storage().ref(path);
    await ref.put(blob);
    return await ref.getDownloadURL();
}

async function sendVoiceMsg(blob, duration) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        window.showToast('Sending voice...', 'info');
        const url = await uploadVoice(blob);
        const data = {
            name:      _communityName,
            uid:       user.uid,
            message:   '',
            audioUrl:  url,
            audioDur:  duration,
            reactions: {},
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (_replyTo) {
            data.replyToId   = _replyTo.docId;
            data.replyToName = _replyTo.name;
            data.replyToText = _replyTo.text;
        }
        await db.collection('tw_posts').add(data);
        cancelReply();
    } catch(e) {
        window.showToast('Voice send မရဘူး: ' + e.message, 'error');
    }
}

// ── Save Post (text + optional photo) ─────────────────────────
window.savePost = async function() {
    const input = document.getElementById('postInput');
    const text  = input?.value.trim();
    const user  = auth.currentUser;
    if (!text && !_selectedPhoto) return;
    if (!user) return window.showToast('Login အရင်ဝင်ပါ', 'error');

    const btn = document.querySelector('#comm-input-bar button[onclick="savePost()"]');
    if (btn) btn.disabled = true;

    try {
        let imageUrl = null;
        if (_selectedPhoto) {
            window.showToast('Uploading photo...', 'info');
            imageUrl = await uploadPhoto(_selectedPhoto);
            clearPhoto();
        }

        const data = {
            name:      _communityName,
            uid:       user.uid,
            message:   text || '',
            reactions: {},
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (imageUrl) data.imageUrl = imageUrl;
        if (_replyTo) {
            data.replyToId   = _replyTo.docId;
            data.replyToName = _replyTo.name;
            data.replyToText = _replyTo.text;
        }

        if (input) { input.value = ''; input.style.height = 'auto'; }
        cancelReply();
        await db.collection('tw_posts').add(data);
    } catch(e) {
        window.showToast(e.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
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
              const p      = doc.data();
              const docId  = doc.id;
              const isMe   = p.uid === myUid;
              const reax   = p.reactions || {};
              const time   = p.timestamp
                  ? new Date(p.timestamp.seconds * 1000)
                      .toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})
                  : '';

              // Reply quote
              const replyHtml = p.replyToId ? `
                  <div style="background:rgba(255,255,255,0.06);border-left:2px solid #7dd8ff;
                      border-radius:6px;padding:5px 10px;margin-bottom:6px;
                      font-size:0.72rem;color:rgba(255,255,255,0.5);">
                      <span style="color:#7dd8ff;font-weight:700;">${escHtml(p.replyToName)}</span>
                      <div style="margin-top:2px;">${escHtml((p.replyToText||'').substring(0,60))}${(p.replyToText||'').length>60?'…':''}</div>
                  </div>` : '';

              // Media
              let mediaHtml = '';
              if (p.imageUrl) {
                  mediaHtml = `
                      <div style="margin-bottom:6px;">
                          <img src="${escAttr(p.imageUrl)}"
                              style="max-width:220px;max-height:200px;border-radius:10px;
                                     object-fit:cover;display:block;cursor:pointer;"
                              onclick="window.open('${escAttr(p.imageUrl)}','_blank')">
                      </div>`;
              } else if (p.audioUrl) {
                  const dur = p.audioDur || 0;
                  const durStr = Math.floor(dur/60) + ':' + String(dur%60).padStart(2,'0');
                  mediaHtml = `
                      <div style="display:flex;align-items:center;gap:10px;
                          background:rgba(255,255,255,0.06);border-radius:12px;
                          padding:10px 14px;min-width:180px;margin-bottom:4px;">
                          <button onclick="playAudio('${escAttr(p.audioUrl)}','${docId}')"
                              style="width:32px;height:32px;border-radius:50%;
                                     background:#7dd8ff;border:none;cursor:pointer;
                                     display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                              <svg id="play-icon-${docId}" width="12" height="12" viewBox="0 0 24 24" fill="#000">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                          </button>
                          <div style="flex:1;">
                              <div style="font-size:0.72rem;color:rgba(255,255,255,0.6);">🎤 Voice</div>
                              <div style="font-size:0.65rem;color:rgba(255,255,255,0.35);">${durStr}</div>
                          </div>
                      </div>`;
              }

              // Text
              const textHtml = p.message ? `
                  <div style="font-size:0.9rem;color:rgba(255,255,255,0.92);
                      line-height:1.5;word-break:break-word;">${escHtml(p.message)}</div>` : '';

              // Reactions
              const reaxHtml = `
                  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">
                      ${EMOJIS.map(e => {
                          const arr   = reax[e] || [];
                          const count = arr.length;
                          const mine  = arr.includes(myUid);
                          return count > 0
                              ? `<button onclick="toggleReaction('${docId}','${e}')"
                                  style="background:${mine ? 'rgba(80,190,255,0.15)' : 'rgba(255,255,255,0.06)'};
                                  border:1px solid ${mine ? 'rgba(80,190,255,0.4)' : 'rgba(255,255,255,0.1)'};
                                  border-radius:20px;padding:2px 8px;cursor:pointer;
                                  font-size:0.75rem;color:#fff;">${e} ${count}</button>`
                              : '';
                      }).join('')}
                      <button onclick="showEmojiPicker('${docId}')"
                          style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
                          border-radius:20px;padding:2px 8px;cursor:pointer;font-size:0.75rem;color:rgba(255,255,255,0.3);">＋</button>
                  </div>`;

              return `
                  <div style="display:flex;flex-direction:column;
                      align-items:${isMe ? 'flex-end' : 'flex-start'};">
                      ${!isMe ? `<div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
                          font-size:0.72rem;color:#7dd8ff;margin-bottom:3px;
                          padding-left:4px;">${escHtml(p.name)}</div>` : ''}
                      <div style="max-width:78%;background:${isMe ? 'rgba(80,190,255,0.12)' : 'rgba(255,255,255,0.06)'};
                          border:1px solid ${isMe ? 'rgba(80,190,255,0.2)' : 'rgba(255,255,255,0.08)'};
                          border-radius:${isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px'};
                          padding:10px 12px;position:relative;">
                          ${replyHtml}
                          ${mediaHtml}
                          ${textHtml}
                          <div style="display:flex;align-items:center;justify-content:flex-end;
                              gap:8px;margin-top:4px;">
                              <span style="font-size:0.58rem;color:rgba(255,255,255,0.25);">${time}</span>
                              <button onclick="setReply('${docId}','${escAttr(p.name)}','${escAttr(p.message||'🎤')}')"
                                  style="background:none;border:none;cursor:pointer;
                                  font-size:0.65rem;color:rgba(255,255,255,0.25);padding:0;">↩</button>
                              ${isMe ? `<button onclick="deletePost('${docId}','${escAttr(p.audioUrl||'')}','${escAttr(p.imageUrl||'')}')"
                                  style="background:none;border:none;cursor:pointer;
                                  font-size:0.65rem;color:rgba(248,113,113,0.4);padding:0;">🗑</button>` : ''}
                          </div>
                      </div>
                      ${reaxHtml}
                  </div>`;
          }).join('');

          if (wasAtBottom) list.scrollTop = list.scrollHeight;
      });
}

// ── Delete Post ──────────────────────────────────────────────
window.deletePost = async function(docId, audioUrl, imageUrl) {
    if (!confirm('Message ဖျက်မှာ သေချာလား?')) return;
    try {
        // Storage file ပါ ဖျက်
        if (audioUrl) {
            try { await firebase.storage().refFromURL(audioUrl).delete(); } catch(e) {}
        }
        if (imageUrl) {
            try { await firebase.storage().refFromURL(imageUrl).delete(); } catch(e) {}
        }
        await db.collection('tw_posts').doc(docId).delete();
        window.showToast('ဖျက်ပြီးပါပြီ', 'success');
    } catch(e) {
        window.showToast('ဖျက်မရဘူး: ' + e.message, 'error');
    }
};

// ── Emoji Picker ──────────────────────────────────────────────
window.showEmojiPicker = function(docId) {
    const EMOJIS = ['👍','❤️','😂','😮','🔥','🏆'];
    const existing = document.getElementById('emoji-picker');
    if (existing) existing.remove();

    const picker = document.createElement('div');
    picker.id = 'emoji-picker';
    picker.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%);
        background:#1a0030;border:1px solid rgba(255,255,255,0.15);border-radius:16px;
        padding:12px;display:flex;gap:10px;z-index:999;
        box-shadow:0 8px 32px rgba(0,0,0,0.5);`;
    picker.innerHTML = EMOJIS.map(e =>
        `<button onclick="toggleReaction('${docId}','${e}');document.getElementById('emoji-picker').remove();"
            style="background:none;border:none;cursor:pointer;font-size:1.4rem;">${e}</button>`
    ).join('') + `<button onclick="this.parentElement.remove()"
        style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);font-size:1rem;">✕</button>`;

    document.body.appendChild(picker);
    setTimeout(() => picker.remove(), 5000);
};

// ── Audio Playback ────────────────────────────────────────────
var _currentAudio = null;

window.playAudio = function(url, docId) {
    if (_currentAudio) {
        _currentAudio.pause();
        _currentAudio = null;
    }
    const audio = new Audio(url);
    _currentAudio = audio;

    const icon = document.getElementById('play-icon-' + docId);
    if (icon) icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

    audio.onended = () => {
        if (icon) icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        _currentAudio = null;
    };
    audio.play().catch(e => window.showToast('Playback error', 'error'));
};
