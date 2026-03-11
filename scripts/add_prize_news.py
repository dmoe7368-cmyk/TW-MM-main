"""
add_prize_news.py — TW MM Tournament
Prize announcement news ကို tw_news မှာ ထည့်သည်
Manual run တစ်ခါပဲ လုပ်ရမယ်
"""

import os, json, firebase_admin
from firebase_admin import credentials, firestore

def init_firebase():
    if not firebase_admin._apps:
        sa = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if sa:
            cred = credentials.Certificate(json.loads(sa))
        else:
            import pathlib
            cred = credentials.Certificate(pathlib.Path(__file__).parent / 'serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()

# HTML body — news card မှာ rich layout ပြမယ်
body_html = """
<div style="display:flex;flex-direction:column;gap:10px;">

  <!-- Weekly -->
  <div style="background:linear-gradient(135deg,rgba(80,190,255,0.08),rgba(80,190,255,0.03));border:1px solid rgba(80,190,255,0.25);border-radius:12px;padding:12px 14px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:0.95rem;color:#7dd8ff;letter-spacing:1px;margin-bottom:8px;">📅 TW WEEKLY — GW30</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="color:rgba(255,255,255,0.6);font-size:0.78rem;">🥇 Winner</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;color:#fbbf24;">15,000 ကျပ်</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:rgba(255,255,255,0.6);font-size:0.78rem;">🥈 Runner Up</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;color:rgba(255,255,255,0.75);">10,000 ကျပ်</span>
    </div>
  </div>

  <!-- Cup -->
  <div style="background:linear-gradient(135deg,rgba(196,160,255,0.08),rgba(196,160,255,0.03));border:1px solid rgba(196,160,255,0.25);border-radius:12px;padding:12px 14px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:0.95rem;color:#c4a0ff;letter-spacing:1px;margin-bottom:8px;">🏆 TW FPL CUP — Season 13</div>
    <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);margin-bottom:8px;">Division A + B</div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:rgba(255,255,255,0.6);font-size:0.78rem;">🥇 Winner</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;color:#fbbf24;">30,000 ကျပ်</span>
    </div>
  </div>

  <!-- FA Cup -->
  <div style="background:linear-gradient(135deg,rgba(251,191,36,0.08),rgba(251,191,36,0.03));border:1px solid rgba(251,191,36,0.25);border-radius:12px;padding:12px 14px;">
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:0.95rem;color:#fbbf24;letter-spacing:1px;margin-bottom:8px;">⚽ TW FA CUP</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="color:rgba(255,255,255,0.6);font-size:0.78rem;">🥇 Winner</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;color:#fbbf24;">40,000 ကျပ်</span>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:rgba(255,255,255,0.6);font-size:0.78rem;">🥈 Runner Up</span>
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:1rem;color:rgba(255,255,255,0.75);">20,000 ကျပ်</span>
    </div>
  </div>

</div>
"""

prize_doc = {
    "title":      "🏆 TW MM Tournament ဆုကြေးများ",
    "body":       body_html,
    "body_type":  "html",
    "type":       "announcement",
    "author":     "Admin TW MM",
    "gw_id":      30,
    "finished":   False,
    "source":     "admin",
    "created_at": firestore.SERVER_TIMESTAMP,
}

db.collection("tw_news").document("prize_announcement").set(prize_doc)
print("✅ Prize news saved!")
