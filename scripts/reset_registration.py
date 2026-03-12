"""
reset_registration.py — TW MM Tournament
Weekly/Cup reset — history မပျက် — GW/Season ပြောင်းရုံ

Usage:
  python reset_registration.py --type weekly --gw 31
  python reset_registration.py --type cup --season 14
  python reset_registration.py --type both --gw 31 --season 14
"""

import os, json, argparse, firebase_admin
from firebase_admin import credentials, firestore

parser = argparse.ArgumentParser()
parser.add_argument('--type',   choices=['weekly','cup','both'], required=True)
parser.add_argument('--gw',     type=int, default=None)
parser.add_argument('--season', type=int, default=None)
args = parser.parse_args()

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

def reset_weekly(gw):
    print(f"\n🔄 Weekly Reset → GW{gw}")

    # 1. users — week_paid: false
    batch = db.batch()
    count = 0
    for u in db.collection("users").where("week_paid","==",True).stream():
        batch.update(u.reference, {"week_paid": False})
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f"  ✅ week_paid reset: {count} users")

    # 2. tw_config/settings — open + new GW
    db.collection("tw_config").document("settings").set({
        "weekly_open": True,
        "current_gw":  gw,
    }, merge=True)
    print(f"  ✅ weekly_open=True | current_gw={gw}")
    print(f"  📋 tw_registrations history ကျန်ရစ် ✅\n")

def reset_cup(season):
    print(f"\n🔄 Cup Reset → Season {season}")

    # 1. users — cup_paid: false
    batch = db.batch()
    count = 0
    for u in db.collection("users").where("cup_paid","==",True).stream():
        batch.update(u.reference, {"cup_paid": False})
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f"  ✅ cup_paid reset: {count} users")

    # 2. tw_config/settings — open + new season
    db.collection("tw_config").document("settings").set({
        "cup_open":       True,
        "current_season": season,
    }, merge=True)
    print(f"  ✅ cup_open=True | current_season={season}")
    print(f"  📋 tw_registrations history ကျန်ရစ် ✅\n")

# ── Run ───────────────────────────────────────────────────────
if args.type in ('weekly','both'):
    gw = args.gw
    if not gw:
        # Firebase ကနေ current_gw ယူပြီး +1
        cfg = db.collection("tw_config").document("settings").get()
        gw  = (cfg.to_dict().get("current_gw", 29) + 1) if cfg.exists else 30
    reset_weekly(gw)

if args.type in ('cup','both'):
    season = args.season
    if not season:
        cfg    = db.collection("tw_config").document("settings").get()
        season = (cfg.to_dict().get("current_season", 13) + 1) if cfg.exists else 14
    reset_cup(season)

print("✨ Reset complete!")
