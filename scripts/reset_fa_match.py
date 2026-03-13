"""
reset_fa_match.py — TW FA Cup
Specific match reset — home_id/away_id/names ထိန်းထား
pts/status/winner တွေ reset

Usage:
  python scripts/reset_fa_match.py --match R16_01
  python scripts/reset_fa_match.py --match QF_02
  python scripts/reset_fa_match.py --all        ← အကုန် reset
"""

import os, json, argparse, firebase_admin
from firebase_admin import credentials, firestore

parser = argparse.ArgumentParser()
parser.add_argument('--match', type=str, default=None, help='Match ID e.g. R16_01')
parser.add_argument('--all',   action='store_true',    help='Reset all matches')
args = parser.parse_args()

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

RESET_FIELDS = {
    "home_pts":      0,
    "home_hit":      0,
    "home_chip":     None,
    "home_cap_pts":  0,
    "home_vcap_pts": 0,
    "home_gk_pts":   0,
    "away_pts":      0,
    "away_hit":      0,
    "away_chip":     None,
    "away_cap_pts":  0,
    "away_vcap_pts": 0,
    "away_gk_pts":   0,
    "status":        "upcoming",
    "winner":        "",
}

def reset_match(doc_id):
    ref = db.collection("tw_fa_playoff").document(doc_id)
    doc = ref.get()
    if not doc.exists:
        print(f"  ❌ {doc_id} — မတွေ့ပါ")
        return
    ref.update(RESET_FIELDS)
    d = doc.to_dict()
    print(f"  ✅ {doc_id} reset — {d.get('home_name','?')} vs {d.get('away_name','?')}")

if args.all:
    print("🔄 All matches reset...")
    for doc in db.collection("tw_fa_playoff").stream():
        reset_match(doc.id)
elif args.match:
    print(f"🔄 Resetting {args.match}...")
    reset_match(args.match)
else:
    print("❌ --match R16_01 သို့မဟုတ် --all ထည့်ပါ")

print("\n✅ Done!")
