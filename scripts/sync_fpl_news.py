"""
sync_fpl_news.py — FPL News Sync
GW အလိုက် tw_news collection ထဲ သိမ်းမယ်
"""

import os
import json
import time
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ── Firebase Init (working script pattern) ───────────────────────────────────
def initialize_firebase():
    if not firebase_admin._apps:
        service_account_info = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if service_account_info:
            cred = credentials.Certificate(json.loads(service_account_info))
        else:
            import pathlib
            cred = credentials.Certificate(
                pathlib.Path(__file__).parent / 'serviceAccountKey.json'
            )
        firebase_admin.initialize_app(cred)
    return firestore.client()

db       = initialize_firebase()
news_ref = db.collection("tw_news")

# ── FPL API Fetch (working script pattern — no extra headers) ─────────────────
FPL_API = "https://fantasy.premierleague.com/api/"

print("FPL API fetch လုပ်နေသည်...")
data = requests.get(f"{FPL_API}bootstrap-static/").json()
events = data.get("events", [])
print(f"Events loaded: {len(events)}")

# ── Current & Next GW ─────────────────────────────────────────────────────────
current_gw = next((e for e in events if e.get("is_current")), None)
next_gw    = next((e for e in events if e.get("is_next")),    None)

print(f"Current GW : {current_gw['id'] if current_gw else 'None'}")
print(f"Next GW    : {next_gw['id']    if next_gw    else 'None'}")

# ── Build doc ─────────────────────────────────────────────────────────────────
def build_doc(event):
    gw_id    = event["id"]
    gw_name  = event.get("name", f"Gameweek {gw_id}")
    deadline = event.get("deadline_time", "")[:16].replace("T", " ")
    finished = event.get("finished", False)
    avg      = event.get("average_entry_score", 0)
    highest  = event.get("highest_score", 0)
    chips    = event.get("chip_plays", [])
    chip_str = "  |  ".join(
        f"{c['chip_name'].upper()}: {c['num_played']:,}" for c in chips
    ) if chips else ""

    if finished:
        title      = f"🏅 {gw_name} — Final Results"
        body_lines = [f"Highest Score : {highest} pts"]
        if avg:      body_lines.append(f"Average Score : {avg} pts")
        if chip_str: body_lines.append(f"Chips Used    : {chip_str}")
        news_type  = "result"
    elif event.get("is_current"):
        title      = f"⚽ {gw_name} — Live Now"
        body_lines = [f"Deadline : {deadline} UTC"]
        if avg:      body_lines.append(f"Avg Score (so far) : {avg} pts")
        if chip_str: body_lines.append(f"Chips : {chip_str}")
        news_type  = "weekly"
    else:
        title      = f"📅 {gw_name} — Coming Up"
        body_lines = [f"Deadline : {deadline} UTC", "Team ပြင်ဆင်ဖို့ မမေ့ပါနဲ့! ✊"]
        news_type  = "weekly"

    return {
        "title"      : title,
        "body"       : "\n".join(body_lines),
        "type"       : news_type,
        "author"     : "FPL Official",
        "created_at" : firestore.SERVER_TIMESTAMP,
        "gw_id"      : gw_id,
        "finished"   : finished,
        "source"     : "fpl_api",
    }

# ── Save GW docs ──────────────────────────────────────────────────────────────
for event in [e for e in [current_gw, next_gw] if e]:
    doc_id = f"fpl_gw_{event['id']}"
    doc    = build_doc(event)
    news_ref.document(doc_id).set(doc, merge=True)
    print(f"✅ Saved : {doc_id} — {doc['title']}")

# ── Injury News ───────────────────────────────────────────────────────────────
injured = [p for p in data.get("elements", []) if len(p.get("news", "")) > 10]

if injured:
    lines = []
    for p in injured[:15]:
        chance = p.get("chance_of_playing_next_round")
        flag   = "🔴" if chance == 0 else "🟡" if chance and chance < 75 else "⚠️"
        name   = f"{p.get('first_name','')} {p.get('second_name','')}".strip()
        lines.append(f"{flag} {name}: {p['news']}")

    news_ref.document("fpl_injuries_latest").set({
        "title"      : "🏥 Player Injury & Availability",
        "body"       : "\n".join(lines),
        "type"       : "announcement",
        "author"     : "FPL Official",
        "created_at" : firestore.SERVER_TIMESTAMP,
        "gw_id"      : current_gw["id"] if current_gw else 0,
        "finished"   : False,
        "source"     : "fpl_api",
    }, merge=True)
    print(f"✅ Saved injury news — {len(injured)} players")

# ── Cleanup: latest 5 GW ထား၊ finished တွေ delete ───────────────────────────
print("\nCleanup...")
gw_docs = sorted(
    [d for d in news_ref.stream() if d.id.startswith("fpl_gw_")],
    key=lambda d: d.to_dict().get("gw_id", 0),
    reverse=True
)
KEEP = 5
for i, doc in enumerate(gw_docs):
    d        = doc.to_dict()
    gw_id    = d.get("gw_id", 0)
    finished = d.get("finished", False)
    if i >= KEEP and finished:
        doc.reference.delete()
        print(f"🗑️  Deleted : {doc.id} (GW{gw_id})")
    else:
        print(f"✅ Kept    : {doc.id} (GW{gw_id} · {'finished' if finished else 'active'})")

print("\n✨ FPL News sync complete!")
