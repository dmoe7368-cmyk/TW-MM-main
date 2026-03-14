"""
sync_playoff_points.py — TW FA Cup
Rules:
  - Net pts = raw pts - hit cost (chip မပေါင်း)
  - TC chip → cap pts original (x2 မဟုတ်)
  - BB chip → bench pts မပေါင်း
  - Tiebreak: Cap pts → VCap pts → GK pts
"""

import requests, firebase_admin, os, json, time
from firebase_admin import credentials, firestore

def initialize_firebase():
    if not firebase_admin._apps:
        sa_info = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if sa_info:
            cred = credentials.Certificate(json.loads(sa_info))
        else:
            cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

db      = initialize_firebase()
FPL_API = "https://fantasy.premierleague.com/api/"

# ── GW Number ကိုဒီမှာပဲ ချိန်းပါ ──────────────────────────────
TARGET_GW = 32   # ← GW ပြောင်းတိုင်း ဒီနေရာပဲ ပြောင်းပါ
# ──────────────────────────────────────────────────────────────

def get_live_pts_map(gw_num):
    """GW live points map {player_id: total_points}"""
    try:
        res = requests.get(f"{FPL_API}event/{gw_num}/live/", timeout=15).json()
        return {item['id']: item['stats']['total_points'] for item in res['elements']}
    except Exception as e:
        print(f"  ❌ live map error: {e}")
        return {}

def get_player_stats(entry_id, gw_num, live_map):
    """
    Returns:
      pts      = raw pts - hit cost  (chip မပေါင်း)
      hit      = transfer cost (4,8,12...)
      chip     = active chip string or None
      cap_pts  = captain original pts (TC ဆိုလဲ x2 မဟုတ်)
      vcap_pts = vice captain original pts
      gk_pts   = starting GK pts
    """
    empty = {"pts":0,"hit":0,"chip":None,"cap_pts":0,"vcap_pts":0,"gk_pts":0}
    if not entry_id:
        return empty
    try:
        url  = f"{FPL_API}entry/{entry_id}/event/{gw_num}/picks/"
        res  = requests.get(url, timeout=12).json()
        hist = res['entry_history']

        raw_pts = hist['points']           # FPL gross (chip bonus ပါနိုင်)
        hit     = hist['event_transfers_cost']  # 0,4,8...

        # Chip
        chip = res.get('active_chip')
        valid_chips = ['3xc','bboost','freehit','wildcard']
        chip = chip if chip in valid_chips else None

        # raw net pts = gross - bonus from chip + raw player pts only
        # BB ဆိုရင် FPL က bench pts ပေါင်းထားတယ် → bench_points နုတ်
        bench_bonus = hist.get('points_on_bench', 0) if chip == 'bboost' else 0
        # TC ဆိုရင် FPL က cap x2 ပေါင်းထားတယ် → cap original pts နုတ် (cap x2 - cap x1)
        # ဒါပေမဲ့ live_map ကနေ cap original ယူမည် — အောက်မှာ တွက်မည်

        picks   = res['picks']
        cap_id  = next((p['element'] for p in picks if p['is_captain']),    None)
        vcap_id = next((p['element'] for p in picks if p['is_vice_captain']),None)
        # Starting GK = position==1 နဲ့ multiplier>0 (playing XI)
        gk_id   = next((p['element'] for p in picks
                        if p['position'] == 1 and p['multiplier'] > 0), None)

        cap_pts  = live_map.get(cap_id,  0) if cap_id  else 0
        vcap_pts = live_map.get(vcap_id, 0) if vcap_id else 0
        gk_pts   = live_map.get(gk_id,   0) if gk_id   else 0

        # TC chip → FPL gross မှာ cap_pts တစ်ခေါက် ထပ်ပေါင်းထားတယ် → နုတ်
        tc_bonus = cap_pts if chip == '3xc' else 0

        net_pts = raw_pts - bench_bonus - tc_bonus - hit

        return {
            "pts":      net_pts,
            "hit":      hit,
            "chip":     chip,
            "cap_pts":  cap_pts,
            "vcap_pts": vcap_pts,
            "gk_pts":   gk_pts,
        }
    except Exception as e:
        print(f"    ⚠️  entry {entry_id} error: {e}")
        return empty

def sync_playoff_points():
    print(f"🚀 TW FA Cup GW{TARGET_GW} Syncing...")
    live_map = get_live_pts_map(TARGET_GW)
    if not live_map:
        print("❌ Cannot get live data. Abort.")
        return

    for doc in db.collection("tw_fa_playoff").stream():
        m      = doc.to_dict()
        doc_id = doc.id

        status_low = m.get('status','').lower().strip()
        if status_low in ('complete','done','finished'):
            print(f"⏩ {doc_id} [{status_low}] — skip")
            continue

        h_id = m.get('home_id')
        a_id = m.get('away_id')
        if not h_id or not a_id:
            continue

        print(f"🔄 {doc_id}")
        h = get_player_stats(h_id, TARGET_GW, live_map)
        a = get_player_stats(a_id, TARGET_GW, live_map)

        update = {
            "home_pts":      h['pts'],
            "home_hit":      h['hit'],
            "home_chip":     h['chip'],
            "home_cap_pts":  h['cap_pts'],
            "home_vcap_pts": h['vcap_pts'],
            "home_gk_pts":   h['gk_pts'],
            "away_pts":      a['pts'],
            "away_hit":      a['hit'],
            "away_chip":     a['chip'],
            "away_cap_pts":  a['cap_pts'],
            "away_vcap_pts": a['vcap_pts'],
            "away_gk_pts":   a['gk_pts'],
        }

        if m.get('status','').lower() == 'upcoming':
            update['status'] = 'live'

        db.collection("tw_fa_playoff").document(doc_id).update(update)
        print(f"  ✅ H:{h['pts']}pts({h['hit']}hit) A:{a['pts']}pts({a['hit']}hit)")
        time.sleep(0.5)

    print(f"\n✅ GW{TARGET_GW} Sync Done!")

if __name__ == "__main__":
    sync_playoff_points()
