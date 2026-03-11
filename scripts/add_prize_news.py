"""
add_prize_news.py — TW MM Tournament
Prize cards with photo background + gold/white typography
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

body_html = """
<div style="display:flex;flex-direction:column;gap:14px;">

  <!-- WEEKLY -->
  <div style="
    border-radius:16px;overflow:hidden;position:relative;
    background:url('assets/images/prize_weekly.jpg') center/cover no-repeat;
    min-height:140px;
  ">
    <div style="
      position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(0,20,60,0.82),rgba(8,0,20,0.88));
      border-radius:16px;
    "></div>
    <div style="position:relative;padding:16px 18px;">
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:0.65rem;letter-spacing:3px;color:rgba(125,216,255,0.7);
        text-transform:uppercase;margin-bottom:4px;
      ">📅 TW WEEKLY — GW30</div>
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:1.5rem;color:#fff;letter-spacing:1px;
        text-shadow:0 2px 12px rgba(0,0,0,0.6);margin-bottom:12px;
      ">ဆုကြေးများ</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;
          background:rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;
          border:1px solid rgba(255,255,255,0.1);">
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">🥇</span>
            <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
              font-size:0.95rem;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">WINNER</span>
          </span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
            font-size:1.2rem;color:#fbbf24;
            text-shadow:0 0 12px rgba(251,191,36,0.5);">15,000 ကျပ်</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;
          background:rgba(255,255,255,0.05);border-radius:10px;padding:10px 14px;
          border:1px solid rgba(255,255,255,0.08);">
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">🥈</span>
            <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
              font-size:0.95rem;color:rgba(255,255,255,0.7);letter-spacing:0.5px;">RUNNER UP</span>
          </span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
            font-size:1.2rem;color:rgba(255,255,255,0.75);">10,000 ကျပ်</span>
        </div>
      </div>
    </div>
  </div>

  <!-- FPL CUP -->
  <div style="
    border-radius:16px;overflow:hidden;position:relative;
    background:url('assets/images/prize_cup.jpg') center/cover no-repeat;
    min-height:150px;
  ">
    <div style="
      position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(40,0,80,0.82),rgba(8,0,20,0.88));
      border-radius:16px;
    "></div>
    <div style="position:relative;padding:16px 18px;">
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:0.65rem;letter-spacing:3px;color:rgba(196,160,255,0.7);
        text-transform:uppercase;margin-bottom:4px;
      ">🏆 TW FPL CUP — SEASON 13</div>
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:1.5rem;color:#fff;letter-spacing:1px;
        text-shadow:0 2px 12px rgba(0,0,0,0.6);margin-bottom:4px;
      ">Division A + B</div>
      <div style="font-size:0.7rem;color:rgba(255,255,255,0.35);margin-bottom:12px;">Combined Winner</div>
      <div style="display:flex;justify-content:space-between;align-items:center;
        background:rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;
        border:1px solid rgba(196,160,255,0.2);">
        <span style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:1.2rem;">🥇</span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
            font-size:0.95rem;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">WINNER</span>
        </span>
        <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
          font-size:1.2rem;color:#fbbf24;
          text-shadow:0 0 12px rgba(251,191,36,0.5);">30,000 ကျပ်</span>
      </div>
    </div>
  </div>

  <!-- TW FA CUP -->
  <div style="
    border-radius:16px;overflow:hidden;position:relative;
    background:url('assets/images/prize_fa.jpg') center/cover no-repeat;
    min-height:160px;
  ">
    <div style="
      position:absolute;inset:0;
      background:linear-gradient(135deg,rgba(40,20,0,0.82),rgba(8,0,20,0.88));
      border-radius:16px;
    "></div>
    <div style="position:relative;padding:16px 18px;">
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:0.65rem;letter-spacing:3px;color:rgba(251,191,36,0.7);
        text-transform:uppercase;margin-bottom:4px;
      ">⚽ TW FA CUP</div>
      <div style="
        font-family:'Barlow Condensed',sans-serif;font-weight:900;
        font-size:1.5rem;color:#fff;letter-spacing:1px;
        text-shadow:0 2px 12px rgba(0,0,0,0.6);margin-bottom:12px;
      ">ဆုကြေးများ</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;
          background:rgba(255,255,255,0.07);border-radius:10px;padding:10px 14px;
          border:1px solid rgba(251,191,36,0.2);">
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">🥇</span>
            <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
              font-size:0.95rem;color:rgba(255,255,255,0.9);letter-spacing:0.5px;">WINNER</span>
          </span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
            font-size:1.2rem;color:#fbbf24;
            text-shadow:0 0 12px rgba(251,191,36,0.5);">40,000 ကျပ်</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;
          background:rgba(255,255,255,0.05);border-radius:10px;padding:10px 14px;
          border:1px solid rgba(255,255,255,0.08);">
          <span style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:1.2rem;">🥈</span>
            <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;
              font-size:0.95rem;color:rgba(255,255,255,0.7);letter-spacing:0.5px;">RUNNER UP</span>
          </span>
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:900;
            font-size:1.2rem;color:rgba(255,255,255,0.75);">20,000 ကျပ်</span>
        </div>
      </div>
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
