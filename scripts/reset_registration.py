"""
reset_registration.py — TW MM Tournament
Weekly/Cup registration reset script

Weekly : ပတ်တိုင်း GW ပြီးတာနဲ့ run
Cup    : Season end (GW35) မှ run

Usage:
  python reset_registration.py --type weekly
  python reset_registration.py --type cup
  python reset_registration.py --type both
"""

import os, json, argparse, firebase_admin
from firebase_admin import credentials, firestore

# ── Args ──────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument('--type', choices=['weekly','cup','both'], required=True)
args = parser.parse_args()

# ── Firebase Init ─────────────────────────────────────────────
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

def reset_weekly():
    print("\n🔄 Weekly Reset စတင်သည်...")

    # 1. tw_registrations — weekly_* docs delete
    reg_ref = db.collection("tw_registrations")
    weekly_docs = [d for d in reg_ref.stream() if d.id.startswith("weekly_")]
    for doc in weekly_docs:
        doc.reference.delete()
    print(f"  🗑️  tw_registrations weekly docs deleted: {len(weekly_docs)}")

    # 2. users — week_paid: false (batch)
    users_ref = db.collection("users")
    paid_users = users_ref.where("week_paid", "==", True).stream()
    batch = db.batch()
    count = 0
    for u in paid_users:
        batch.update(u.reference, {"week_paid": False})
        count += 1
        if count % 400 == 0:   # Firestore batch limit 500
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f"  ✅ users week_paid reset: {count}")

    # 3. tw_config/settings — weekly_open: true
    db.collection("tw_config").document("settings").set(
        {"weekly_open": True}, merge=True
    )
    print("  ✅ tw_config/settings weekly_open = True")
    print("✅ Weekly Reset ပြီးပါပြီ!\n")

def reset_cup():
    print("\n🔄 Cup Reset စတင်သည်...")

    # 1. tw_registrations — cup_* docs delete
    reg_ref = db.collection("tw_registrations")
    cup_docs = [d for d in reg_ref.stream() if d.id.startswith("cup_")]
    for doc in cup_docs:
        doc.reference.delete()
    print(f"  🗑️  tw_registrations cup docs deleted: {len(cup_docs)}")

    # 2. users — cup_paid: false (batch)
    users_ref = db.collection("users")
    paid_users = users_ref.where("cup_paid", "==", True).stream()
    batch = db.batch()
    count = 0
    for u in paid_users:
        batch.update(u.reference, {"cup_paid": False})
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    if count % 400 != 0:
        batch.commit()
    print(f"  ✅ users cup_paid reset: {count}")

    # 3. tw_config/settings — cup_open: true
    db.collection("tw_config").document("settings").set(
        {"cup_open": True}, merge=True
    )
    print("  ✅ tw_config/settings cup_open = True")
    print("✅ Cup Reset ပြီးပါပြီ!\n")

# ── Run ───────────────────────────────────────────────────────
if args.type in ('weekly', 'both'):
    reset_weekly()

if args.type in ('cup', 'both'):
    reset_cup()

print("✨ reset_registration.py complete!")
