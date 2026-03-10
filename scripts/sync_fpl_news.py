"""
sync_fpl_news.py — TW MM Tournament
YAML auto run ရတယ်

Saves to Firebase tw_news:
  1. fpl_gw_{id}         — Current/Next GW info
  2. fpl_injuries_latest — Injury & availability
  3. scout_captain_gw{n} — Captain candidates
  4. scout_diff_gw{n}    — Differentials < 15% own
  5. scout_fixture_gw{n} — Fixture guide 3 GWs
"""

import os, json, requests, time
import firebase_admin
from firebase_admin import credentials, firestore

# ══════════════════════════════════════════
#  Firebase Init
# ══════════════════════════════════════════
def initialize_firebase():
    if not firebase_admin._apps:
        sa = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if sa:
            cred = credentials.Certificate(json.loads(sa))
        else:
            import pathlib
            cred = credentials.Certificate(pathlib.Path(__file__).parent / 'serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

db       = initialize_firebase()
news_ref = db.collection("tw_news")
HEADERS  = {"User-Agent": "Mozilla/5.0"}
FPL_API  = "https://fantasy.premierleague.com/api/"

# ══════════════════════════════════════════
#  Fetch bootstrap
# ══════════════════════════════════════════
SOURCES = [
    "https://raw.githubusercontent.com/vastaav/fantasy-premier-league/master/data/2024-25/bootstrap-static.json",
    "https://fplreview.com/fpl-helper/bootstrap/",
    f"{FPL_API}bootstrap-static/",
]

data = None
for url in SOURCES:
    try:
        print(f"Trying: {url[:60]}...")
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        data = r.json()
        if data.get("events"):
            print("✅ Bootstrap OK")
            break
        data = None
    except Exception as e:
        print(f"❌ {e}")

if not data:
    raise RuntimeError("FPL bootstrap sources အားလုံး မရဘူး")

# Fixtures
fixtures = []
try:
    r2 = requests.get(f"{FPL_API}fixtures/", headers=HEADERS, timeout=15)
    fixtures = r2.json()
    print(f"✅ Fixtures: {len(fixtures)}")
except Exception as e:
    print(f"⚠️  Fixtures failed: {e}")

# ══════════════════════════════════════════
#  Base data
# ══════════════════════════════════════════
elements      = data.get("elements", [])
teams         = data.get("teams", [])
events        = data.get("events", [])
team_map      = {t["id"]: t["short_name"] for t in teams}
team_name_map = {t["id"]: t["name"] for t in teams}
POS_MAP       = {1:"GKP", 2:"DEF", 3:"MID", 4:"FWD"}

current_gw = next((e for e in events if e.get("is_current")), None)
next_gw    = next((e for e in events if e.get("is_next")),    None)
gw_num     = (next_gw or current_gw or {}).get("id", 29)

print(f"Current GW: {current_gw['id'] if current_gw else 'None'}")
print(f"Next GW:    {next_gw['id']    if next_gw    else 'None'}")
print(f"Target GW:  {gw_num}")

# ══════════════════════════════════════════
#  Helper
# ══════════════════════════════════════════
def pname(p):
    return f"{p['first_name']} {p['second_name']}"

def ppos(p):
    return POS_MAP.get(p["element_type"], "?")

def team_fdr_map(gw):
    fdr = {}
    for f in fixtures:
        if f.get("event") == gw:
            h, a = f["team_h"], f["team_a"]
            fdr[h] = min(fdr.get(h, 5), f.get("team_h_difficulty", 3))
            fdr[a] = min(fdr.get(a, 5), f.get("team_a_difficulty", 3))
    return fdr

# ══════════════════════════════════════════
#  Section A — GW info (existing logic)
# ══════════════════════════════════════════
def build_gw_doc(event):
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
        "title":       title,
        "body":        "\n".join(body_lines),
        "type":        news_type,
        "author":      "FPL Official",
        "created_at":  firestore.SERVER_TIMESTAMP,
        "gw_id":       gw_id,
        "finished":    finished,
        "source":      "fpl_api",
    }

for event in [e for e in [current_gw, next_gw] if e]:
    doc_id = f"fpl_gw_{event['id']}"
    news_ref.document(doc_id).set(build_gw_doc(event), merge=True)
    print(f"✅ Saved: {doc_id}")

# ══════════════════════════════════════════
#  Section B — Injury Alert (existing + improved)
# ══════════════════════════════════════════
injured = [p for p in elements if p.get("news","").strip()]
injured.sort(key=lambda x: float(x.get("selected_by_percent", 0) or 0), reverse=True)

if injured:
    lines = [f"GW{gw_num} — Injury & Availability Update\n"]
    for p in injured[:18]:
        chance = p.get("chance_of_playing_next_round")
        own    = p.get("selected_by_percent", "0")
        flag   = "🔴" if chance == 0 else "🟠" if chance is not None and chance <= 50 else "⚠️"
        chance_str = f"{chance}%" if chance is not None else "Unknown"
        lines.append(
            f"{flag} {pname(p)} ({team_map.get(p['team'],'?')} | {ppos(p)} | £{p['now_cost']/10}m | {own}% own)\n"
            f"   {p['news']} [{chance_str}]"
        )
    news_ref.document("fpl_injuries_latest").set({
        "title":      "🏥 Player Injury & Availability",
        "body":       "\n".join(lines),
        "type":       "announcement",
        "author":     "FPL Official",
        "created_at": firestore.SERVER_TIMESTAMP,
        "gw_id":      gw_num,
        "finished":   False,
        "source":     "fpl_api",
    }, merge=True)
    print(f"✅ Injury: {len(injured)} players")

# ══════════════════════════════════════════
#  Section C — Captain Picks
# ══════════════════════════════════════════
fdr = team_fdr_map(gw_num)
candidates = []
for p in elements:
    if p.get("news"): continue
    form = float(p.get("form", 0) or 0)
    ict  = float(p.get("ict_index", 0) or 0)
    pts  = p.get("total_points", 0)
    d    = fdr.get(p["team"], 3)
    if form >= 5 and pts >= 60 and d <= 3:
        score = form * (4 - d) + (ict / 20)
        candidates.append({
            "name":  pname(p),
            "team":  team_map.get(p["team"], "?"),
            "pos":   ppos(p),
            "price": p["now_cost"] / 10,
            "form":  form,
            "pts":   pts,
            "own":   p.get("selected_by_percent", "0"),
            "ict":   round(ict, 1),
            "fdr":   d,
            "score": round(score, 2),
        })

candidates.sort(key=lambda x: x["score"], reverse=True)
medals = ["🥇","🥈","🥉","4️⃣","5️⃣","6️⃣"]
cap_lines = [f"GW{gw_num} Captain Candidates — Form × Fixture × ICT\n"]
for i, pl in enumerate(candidates[:6]):
    dot = "🟢" * (4 - pl["fdr"]) if pl["fdr"] <= 3 else "🔴"
    cap_lines.append(
        f"{medals[i]} {pl['name']} ({pl['team']} | {pl['pos']} | £{pl['price']}m)\n"
        f"   Form:{pl['form']} | Pts:{pl['pts']} | ICT:{pl['ict']} | Own:{pl['own']}% | FDR:{pl['fdr']} {dot}"
    )
if not candidates:
    cap_lines.append("No candidates found for this GW.")

news_ref.document(f"scout_captain_gw{gw_num}").set({
    "title":      f"🎖️ GW{gw_num} Captain Candidates",
    "body":       "\n".join(cap_lines),
    "type":       "weekly",
    "author":     "FPL Scout",
    "created_at": firestore.SERVER_TIMESTAMP,
    "gw_id":      gw_num,
    "finished":   False,
    "source":     "fpl_scout",
})
print(f"✅ Saved: scout_captain_gw{gw_num}")

# ══════════════════════════════════════════
#  Section D — Differentials
# ══════════════════════════════════════════
diffs = []
for p in elements:
    if p.get("news"): continue
    own  = float(p.get("selected_by_percent", 0) or 0)
    form = float(p.get("form", 0) or 0)
    pts  = p.get("total_points", 0)
    d    = fdr.get(p["team"], 3)
    if own < 15 and form >= 5 and pts >= 50 and d <= 3:
        diffs.append({
            "name":  pname(p),
            "team":  team_map.get(p["team"], "?"),
            "pos":   ppos(p),
            "price": p["now_cost"] / 10,
            "form":  form,
            "pts":   pts,
            "own":   own,
            "fdr":   d,
        })

diffs.sort(key=lambda x: (x["form"], -x["own"]), reverse=True)
diff_lines = [f"GW{gw_num} Differentials — High Form, Low Ownership (<15%)\n"]
for pl in diffs[:8]:
    fix_str = "🟢 Easy" if pl["fdr"] <= 2 else "🟡 Medium"
    diff_lines.append(
        f"💎 {pl['name']} ({pl['team']} | {pl['pos']} | £{pl['price']}m)\n"
        f"   Form:{pl['form']} | Pts:{pl['pts']} | Own:{pl['own']}% | Fixture:{fix_str}"
    )
if not diffs:
    diff_lines.append("No differentials found this GW.")

news_ref.document(f"scout_diff_gw{gw_num}").set({
    "title":      f"💎 GW{gw_num} Differentials (<15% own)",
    "body":       "\n".join(diff_lines),
    "type":       "weekly",
    "author":     "FPL Scout",
    "created_at": firestore.SERVER_TIMESTAMP,
    "gw_id":      gw_num,
    "finished":   False,
    "source":     "fpl_scout",
})
print(f"✅ Saved: scout_diff_gw{gw_num}")

# ══════════════════════════════════════════
#  Section E — Fixture Guide (3 GWs)
# ══════════════════════════════════════════
gw_range = [gw_num, gw_num+1, gw_num+2]
team_fixtures = {}
for f in fixtures:
    gw = f.get("event")
    if gw not in gw_range: continue
    h, a  = f["team_h"], f["team_a"]
    for tid, opp_id, d in [(h, a, f.get("team_h_difficulty",3)),
                            (a, h, f.get("team_a_difficulty",3))]:
        is_home = (tid == h)
        if tid not in team_fixtures: team_fixtures[tid] = {}
        team_fixtures[tid][gw] = (team_map.get(opp_id,"?"), d, is_home)

easy_teams = []
for tid, gws in team_fixtures.items():
    fdrs    = [v[1] for v in gws.values()]
    avg_fdr = sum(fdrs) / len(fdrs) if fdrs else 5
    nxt_fdr = gws.get(gw_num, (None,5,True))[1]
    if avg_fdr <= 2.5 and nxt_fdr <= 3:
        easy_teams.append((tid, avg_fdr, gws))

easy_teams.sort(key=lambda x: x[1])
fix_lines = [f"GW{gw_num}–{gw_num+2} Fixture Guide — Best Teams to Target\n"]
for tid, avg_fdr, gws in easy_teams[:8]:
    tname = team_name_map.get(tid, team_map.get(tid,"?"))
    parts = []
    for gw in gw_range:
        if gw in gws:
            opp, d, home = gws[gw]
            dot = "🟢" if d<=2 else "🟡" if d==3 else "🔴"
            parts.append(f"{dot}{opp}({'H' if home else 'A'})")
    kp = [
        p for p in elements
        if p["team"]==tid and float(p.get("form",0) or 0)>=4 and not p.get("news")
    ]
    kp.sort(key=lambda x: float(x.get("form",0) or 0), reverse=True)
    kp_str = ", ".join(f"{pname(p)}({ppos(p)} £{p['now_cost']/10}m)" for p in kp[:3]) or "—"
    fix_lines.append(
        f"🏟️  {tname} — Avg FDR:{avg_fdr:.1f}\n"
        f"   {' | '.join(parts)}\n"
        f"   Key: {kp_str}"
    )
if not easy_teams:
    fix_lines.append("No teams with easy fixture runs found.")

news_ref.document(f"scout_fixture_gw{gw_num}").set({
    "title":      f"📅 GW{gw_num}–{gw_num+2} Fixture Guide",
    "body":       "\n".join(fix_lines),
    "type":       "weekly",
    "author":     "FPL Scout",
    "created_at": firestore.SERVER_TIMESTAMP,
    "gw_id":      gw_num,
    "finished":   False,
    "source":     "fpl_scout",
})
print(f"✅ Saved: scout_fixture_gw{gw_num}")

# ══════════════════════════════════════════
#  Cleanup old GW docs (keep 5)
# ══════════════════════════════════════════
gw_docs = sorted(
    [d for d in news_ref.stream() if d.id.startswith("fpl_gw_")],
    key=lambda d: d.to_dict().get("gw_id", 0), reverse=True
)
for i, doc in enumerate(gw_docs):
    if i >= 5 and doc.to_dict().get("finished", False):
        doc.reference.delete()
        print(f"🗑️  Deleted: {doc.id}")

print("\n✨ sync_fpl_news.py complete!")
