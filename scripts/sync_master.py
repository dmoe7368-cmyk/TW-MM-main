"""
sync_master.py — TW MM Tournament
Tournament Rules:
  - TC  : captain pts x2 ရေတွက် (x1 extra နုတ်)
  - BB  : bench pts နုတ် (bench player pts မရေတွက်)
  - Hit : -4/-8 နုတ်
  - FH/WC : ရမှတ်အပေါ် effect မရှိ
"""

import requests
import firebase_admin
from firebase_admin import credentials, firestore
import os, json, time

# ══════════════════════════════════════════
#  Firebase Init
# ══════════════════════════════════════════
def initialize_firebase():
    if not firebase_admin._apps:
        sa_info = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if sa_info:
            cred = credentials.Certificate(json.loads(sa_info))
        else:
            cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = initialize_firebase()

# ══════════════════════════════════════════
#  Config
# ══════════════════════════════════════════
LEAGUE_ID          = "184965"
FPL_API            = "https://fantasy.premierleague.com/api/"
# ── GW Range — ဒီနေရာပဲ ပြောင်းပါ ──────────────────────────
GW_START = 29   # Season စတင်သည့် GW — မပြောင်းရ
GW_END   = 33   # ← GW ပြီးတိုင်း ဒါပဲ တစ်ခု တက်ချိန်းပါ
GW_RANGE = range(GW_START, GW_END + 1)
# ──────────────────────────────────────────────────────────
MANUAL_NEW_ENTRIES = ["561639", "6993087"]
HEADERS            = {"User-Agent": "Mozilla/5.0"}

# ══════════════════════════════════════════
#  Helper — API fetch with retry
# ══════════════════════════════════════════
def fpl_get(url, retries=3, delay=2):
    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"  ⚠️  Attempt {attempt+1} failed: {e}")
            time.sleep(delay)
    return None

# ══════════════════════════════════════════
#  Tournament Points Calculator
#  Rule: TC extra နုတ်၊ BB bench နုတ်၊ Hit နုတ်
# ══════════════════════════════════════════
def calc_tournament_pts(entry_id, gw, raw_pts, hit_cost, active_chip):
    """
    FPL API 'points' တွင် TC/BB ရမှတ်ပါပြီးသား
    ပြိုင်ပွဲ rule အရ TC extra နဲ့ BB bench ပြန်နုတ်ရမယ်
    """

    adjustment = 0  # နုတ်ရမည့် ပမာဏ

    picks_data = fpl_get(f"{FPL_API}entry/{entry_id}/event/{gw}/picks/")
    if not picks_data:
        print(f"    ⚠️  GW{gw} picks API failed — raw pts သုံးမည်")
        return raw_pts - hit_cost, 0, 0

    picks = picks_data.get('picks', [])

    # ── TC adjustment ──────────────────────
    # API pts မှာ captain pts × 3 ပါပြီး
    # ပြိုင်ပွဲ rule: TC=×3 → ×1 နုတ် → captain ×2 ကျန်ရစ်
    tc_deduct = 0
    if active_chip == '3xc':
        captain = next((p for p in picks if p.get('is_captain')), None)
        if captain:
            # captain player ရဲ့ live points ဆွဲရမယ်
            player_id   = captain['element']
            live_data   = fpl_get(f"{FPL_API}event/{gw}/live/")
            if live_data:
                elements = live_data.get('elements', [])
                cap_el   = next((e for e in elements if e['id'] == player_id), None)
                if cap_el:
                    cap_pts   = cap_el['stats']['total_points']
                    # API မှာ ×3 ပါပြီး → ×1 နုတ် → captain ×2 ကျန်
                    tc_deduct = cap_pts * 1
                    print(f"    🎖️  TC: captain {player_id} = {cap_pts}pts | API×3={cap_pts*3} → နုတ်×1={tc_deduct} → ကျန်{cap_pts*2}")
        adjustment += tc_deduct

    # ── BB adjustment ──────────────────────
    # API pts မှာ bench player pts ပါပြီး
    # ပြိုင်ပွဲ rule: bench pts နုတ်
    bb_deduct = 0
    if active_chip == 'bboost':
        bench_players = [p for p in picks if p.get('multiplier') == 0]
        live_data = fpl_get(f"{FPL_API}event/{gw}/live/")
        if live_data and bench_players:
            elements = live_data.get('elements', [])
            for bp in bench_players:
                bp_el = next((e for e in elements if e['id'] == bp['element']), None)
                if bp_el:
                    bp_pts     = bp_el['stats']['total_points']
                    bb_deduct += bp_pts
                    print(f"    🪑  BB bench player {bp['element']} = {bp_pts}pts")
            print(f"    🪑  BB total bench deduct: -{bb_deduct}")
        adjustment += bb_deduct

    # ── Final calculation ──────────────────
    # raw_pts = FPL pts (TC×3, BB bench ပါပြီး)
    # tournament_pts = raw_pts - tc_extra - bb_bench - hit
    tournament_pts = raw_pts - adjustment - hit_cost

    print(f"    📊 raw={raw_pts} | TC_deduct={tc_deduct} | BB_deduct={bb_deduct} | hit={hit_cost} | tournament={tournament_pts}")

    return tournament_pts, tc_deduct, bb_deduct

# ══════════════════════════════════════════
#  Step 1 — League standings
# ══════════════════════════════════════════
def get_league_players():
    print("📡 FPL League Standings ဆွဲယူနေသည်...")
    data = fpl_get(f"{FPL_API}leagues-classic/{LEAGUE_ID}/standings/")
    if not data:
        print("❌ League API failed"); return [], []
    api_players   = data['standings']['results']
    api_entry_ids = [str(p['entry']) for p in api_players]
    print(f"  ✅ API players: {len(api_players)}")
    return api_players, api_entry_ids

# ══════════════════════════════════════════
#  Step 2 — Division setup
# ══════════════════════════════════════════
def setup_divisions(api_players, api_entry_ids):
    print("\n🏗️  Division Setup...")
    all_entries = []

    for i, player in enumerate(api_players):
        entry_id = str(player['entry'])
        division = "Division A" if (i + 1) <= 12 else "Division B"
        all_entries.append((entry_id, division, player['player_name'], player['entry_name']))

    for entry_id in MANUAL_NEW_ENTRIES:
        if entry_id not in api_entry_ids:
            try:
                p_res = fpl_get(f"{FPL_API}entry/{entry_id}/")
                name  = f"{p_res['player_first_name']} {p_res['player_last_name']}"
                team  = p_res['name']
            except:
                name = "Pending Name"; team = "Pending Team"
            all_entries.append((entry_id, "Division B", name, team))
            print(f"  🆕 Manual: {team} → Division B")

    for entry_id, division, name, team in all_entries:
        doc_ref  = db.collection("tw_mm_tournament").document(entry_id)
        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            gw_fields = {}
            for gw in GW_RANGE:
                gw_fields[f"gw_{gw}_pts"]  = 0
                gw_fields[f"gw_{gw}_hit"]  = 0
                gw_fields[f"gw_{gw}_chip"] = None
            doc_ref.set({
                "entry_id": entry_id, "name": name, "team": team,
                "division": division, "total_net": 0, **gw_fields
            })
            print(f"  ✅ [NEW] {team} → {division}")
        else:
            # division ကို မထိဘူး — Firebase မှာ manual ပြင်ထားရင် ကျန်ရစ်မယ်
            # name/team ပဲ update — division သပ်သပ်
            existing_div = doc_snap.to_dict().get("division", "")
            print(f"  🔄 [UPDATE] {team} | division kept: {existing_div}")
            doc_ref.update({"name": name, "team": team})

    return all_entries

# ══════════════════════════════════════════
#  Step 3 — GW points sync
# ══════════════════════════════════════════
def sync_gw_points(all_entries):
    print("\n📊 GW ရမှတ် Sync...")

    for entry_id, division, name, team in all_entries:
        print(f"\n  👤 {team} ({name})")
        update_data = {}
        total_net   = 0

        history_data = fpl_get(f"{FPL_API}entry/{entry_id}/history/")
        if not history_data:
            print(f"    ❌ History API failed — skip"); continue

        for gw in GW_RANGE:
            gw_entry = next(
                (h for h in history_data.get('current', []) if h['event'] == gw),
                None
            )
            if not gw_entry:
                print(f"    ⏭️  GW{gw} — no data yet"); continue

            raw_pts  = gw_entry.get('points', 0)
            hit_cost = gw_entry.get('event_transfers_cost', 0)

            # Chip check
            chip       = None
            picks_data = fpl_get(f"{FPL_API}entry/{entry_id}/event/{gw}/picks/")
            if picks_data:
                active_chip = picks_data.get('active_chip')
                chip_map = {
                    '3xc':      '3xc',
                    'bboost':   'bboost',
                    'freehit':  'freehit',
                    'wildcard': 'wildcard',
                }
                chip = chip_map.get(active_chip) if active_chip else None

            # Tournament points calculation (TC/BB rule applied)
            tournament_pts, tc_ded, bb_ded = calc_tournament_pts(
                entry_id, gw, raw_pts, hit_cost, chip
            )

            update_data[f"gw_{gw}_pts"]  = tournament_pts
            update_data[f"gw_{gw}_hit"]  = hit_cost
            update_data[f"gw_{gw}_chip"] = chip
            total_net += tournament_pts

            chip_str = f" [{chip.upper()}]" if chip else ""
            print(f"    GW{gw}: raw={raw_pts} hit=-{hit_cost}{chip_str} → tourney={tournament_pts}")

            time.sleep(0.4)

        if update_data:
            update_data["total_net"] = total_net
            db.collection("tw_mm_tournament").document(entry_id).update(update_data)
            print(f"    💾 Saved — total_net: {total_net}")

# ══════════════════════════════════════════
#  Main
# ══════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 50)
    print("  TW MM Tournament — sync_master.py")
    print("  Rule: TC extra×1 နုတ် (cap×2 ကျန်) | BB bench နုတ် | Hit နုတ်")
    print("=" * 50)

    api_players, api_entry_ids = get_league_players()
    if not api_players:
        exit(1)

    all_entries = setup_divisions(api_players, api_entry_ids)
    sync_gw_points(all_entries)

    print("\n" + "=" * 50)
    print("  ✅ Sync complete!")
    print("=" * 50)
