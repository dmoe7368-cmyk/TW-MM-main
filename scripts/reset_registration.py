"""
reset_registration.py — TW MM Tournament
Weekly/Cup reset — sub-collection history မပျက်
users week_paid/cup_paid → false သာ reset

Usage:
  python reset_registration.py --type weekly --gw 31
  python reset_registration.py --type cup --season 14
  python reset_registration.py --type both --gw 31 --season 14
  (--gw / --season မပါရင် current + 1 auto)
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
            cred = credentials.Certificate(
                pathlib.Path(__file__).parent / 'serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

db = init_firebase()

def get_current_config():
    cfg = db.collection('tw_config').document('settings').get()
    if cfg.exists:
        d = cfg.to_dict()
        return d.get('current_gw', 29), d.get('current_season', 13)
    return 29, 13

def batch_reset_field(field):
    """users collection မှာ field=True ဖြစ်တာတွေ False ပြန်ထည့်"""
    count = 0
    batch = db.batch()
    for u in db.collection('users').where(field, '==', True).stream():
        batch.update(u.reference, {field: False})
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    return count

def reset_weekly(gw):
    print(f"\n🔄 Weekly Reset → GW{gw}")
    count = batch_reset_field('week_paid')
    print(f"  ✅ week_paid reset: {count} users")

    db.collection('tw_config').document('settings').set({
        'weekly_open': True,
        'current_gw':  gw,
    }, merge=True)
    print(f"  ✅ weekly_open=True | current_gw={gw}")
    print(f"  📁 tw_registrations/weekly/gw_{gw-1} history ကျန်ရစ် ✅")

def reset_cup(season):
    print(f"\n🔄 Cup Reset → Season {season}")
    count = batch_reset_field('cup_paid')
    print(f"  ✅ cup_paid reset: {count} users")

    db.collection('tw_config').document('settings').set({
        'cup_open':       True,
        'current_season': season,
    }, merge=True)
    print(f"  ✅ cup_open=True | current_season={season}")
    print(f"  📁 tw_registrations/cup/season_{season-1} history ကျန်ရစ် ✅")

# ── Run ────────────────────────────────────────────────────────
cur_gw, cur_season = get_current_config()

if args.type in ('weekly', 'both'):
    gw = args.gw if args.gw else cur_gw + 1
    reset_weekly(gw)

if args.type in ('cup', 'both'):
    season = args.season if args.season else cur_season + 1
    reset_cup(season)

print("\n✨ Reset complete!")
