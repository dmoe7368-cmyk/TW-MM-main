import requests
import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
import time

def initialize_firebase():
    if not firebase_admin._apps:
        service_account_info = os.environ.get('FIREBASE_SERVICE_ACCOUNT')
        if service_account_info:
            cred_dict = json.loads(service_account_info)
            cred = credentials.Certificate(cred_dict)
        else:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            cred_path = os.path.join(current_dir, 'serviceAccountKey.json')
            cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = initialize_firebase()

FPL_API = "https://fantasy.premierleague.com/api/"
LEAGUES = {
    "League_A": "151552",
    "League_B": "184965"
}

# vastaav cached bootstrap — FPL block bypass အတွက်
BOOTSTRAP_SOURCES = [
    "https://raw.githubusercontent.com/vastaav/fantasy-premier-league/master/data/2024-25/bootstrap-static.json",
    f"{FPL_API}bootstrap-static/",
]

def fetch_bootstrap():
    for url in BOOTSTRAP_SOURCES:
        try:
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            data = r.json()
            if data.get("events") and data.get("elements"):
                print(f"✅ Bootstrap from: {url[:60]}")
                return data
        except Exception as e:
            print(f"⚠️ Bootstrap failed {url[:50]}: {e}")
    raise RuntimeError("Bootstrap sources အားလုံး မရဘူး")

def get_fpl_base_data():
    r = fetch_bootstrap()
    players = {p['id']: p for p in r['elements']}

    # ✅ team_code ပါအောင် teams map ထဲ ထည့်မယ်
    teams = {
        t['id']: {
            'short': t['short_name'],
            'full':  t['name'],
            'code':  t['code']          # ← FPL official team code (jersey URL အတွက်)
        }
        for t in r['teams']
    }

    pos_map    = {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}
    current_gw = next(e['id'] for e in r['events'] if e['is_current'])
    return players, teams, pos_map, current_gw

def sync_scouts():
    players_raw, teams_map, pos_map, gw = get_fpl_base_data()
    print(f"--- 🚀 Syncing Data for Gameweek {gw} ---")

    # ── ၁။ League Scout Sync ──────────────────────────────────────────────────
    for league_name, l_id in LEAGUES.items():
        print(f"Processing {league_name}...")
        standings_url = f"{FPL_API}leagues-classic/{l_id}/standings/"
        try:
            standings_res = requests.get(standings_url).json()
            if 'standings' not in standings_res:
                print(f"⚠️ {league_name} data not found.")
                continue

            standings = standings_res['standings']['results']
            batch = db.batch()

            for team in standings:
                entry_id  = str(team['entry'])
                picks_url = f"{FPL_API}entry/{entry_id}/event/{gw}/picks/"
                picks_res = requests.get(picks_url).json()

                lineup = []
                if 'picks' in picks_res:
                    for p in picks_res['picks']:
                        p_id   = p['element']
                        p_info = players_raw.get(p_id)
                        if p_info:
                            team_info = teams_map.get(p_info['team'], {})
                            lineup.append({
                                "id":               p_id,
                                "name":             p_info['web_name'],
                                "pos":              pos_map[p_info['element_type']],
                                "team":             team_info.get('short', ''),
                                "team_code":        team_info.get('code', 0),  # ✅ Jersey URL အတွက်
                                "is_captain":       p.get('is_captain', False),
                                "is_vice_captain":  p.get('is_vice_captain', False),
                                "multiplier":       p.get('multiplier', 1),
                                "points":           p_info['event_points']
                            })

                data = {
                    "entry_id":      team['entry'],
                    "manager":       team['player_name'],
                    "team_name":     team['entry_name'],
                    "gw_points":     team['event_total'],
                    "total_points":  team['total'],
                    "active_chip":   picks_res.get('active_chip'),
                    "transfer_cost": picks_res.get('entry_history', {}).get('event_transfers_cost', 0),
                    "lineup":        lineup,
                    "last_updated":  firestore.SERVER_TIMESTAMP
                }

                doc_ref = db.collection(f"scout_{league_name}").document(entry_id)
                batch.set(doc_ref, data, merge=True)

            batch.commit()
            print(f"✅ {league_name} Updated with Live Scores.")
        except Exception as e:
            print(f"❌ Error in {league_name}: {e}")

    # ── ၂။ Player Scout Sync (Top 800) ───────────────────────────────────────
    print("Syncing Top 800 Players...")
    all_scouts = sorted(players_raw.values(), key=lambda x: x['total_points'], reverse=True)[:800]

    def commit_batch(items):
        s_batch = db.batch()
        for p in items:
            p_id      = p['id']
            team_info = teams_map.get(p['team'], {})
            try:
                f_res = requests.get(f"{FPL_API}element-summary/{p_id}/").json()

                next_fixtures = []
                for f in f_res.get('fixtures', [])[:5]:
                    is_home    = f['is_home']
                    opp_id     = f['team_a'] if is_home else f['team_h']
                    difficulty = f['difficulty']
                    bg_color   = "#375523"
                    if difficulty == 3: bg_color = "#e7d60d"
                    if difficulty >= 4: bg_color = "#e9190c"
                    next_fixtures.append({
                        "opponent":   teams_map[opp_id]['short'],
                        "is_home":    is_home,
                        "difficulty": difficulty,
                        "bg":         bg_color,
                        "text":       "#000" if difficulty == 3 else "#fff"
                    })

                s_ref = db.collection("scout_players").document(str(p_id))
                s_batch.set(s_ref, {
                    "name":         p['web_name'],
                    "full_name":    f"{p['first_name']} {p['second_name']}",
                    "team":         team_info.get('short', ''),
                    "team_full":    team_info.get('full', ''),
                    "team_code":    team_info.get('code', 0),   # ✅ Player Scout popup အတွက်
                    "pos":          pos_map[p['element_type']],
                    "gw_points":    p['event_points'],
                    "form":         p['form'],
                    "price":        p['now_cost'] / 10,
                    "total_points": p['total_points'],
                    "ownership":    p['selected_by_percent'],
                    "goals":        p['goals_scored'],
                    "assists":      p['assists'],
                    "clean_sheets": p['clean_sheets'],
                    "bonus":        p['bonus'],
                    "xg":           p['expected_goals'],
                    "ict":          p['ict_index'],
                    "fixtures":     next_fixtures,
                    "last_updated": firestore.SERVER_TIMESTAMP
                }, merge=True)
                time.sleep(0.01)
            except:
                continue
        s_batch.commit()

    for i in range(0, len(all_scouts), 500):
        chunk = all_scouts[i:i + 500]
        commit_batch(chunk)
        print(f"✅ Processed {i + len(chunk)} players...")

    print("✨ Sync Completed Successfully!")

if __name__ == "__main__":
    sync_scouts()
