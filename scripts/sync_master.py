import requests
import firebase_admin
from firebase_admin import credentials, firestore
import os, json, time

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

# --- Configuration ---
LEAGUE_ID = "184965"
FPL_API = "https://fantasy.premierleague.com/api/"
GW_RANGE = range(29, 36) # Week 29 မှ 35 ထိ

# API မှာ မတွေ့သေးတဲ့ အသင်းသစ် ID များ (Division B ထဲ အသေထည့်မည်)
MANUAL_NEW_ENTRIES = ["561639", "6993087"]

def setup_tournament_24_teams():
    print(f"🚀 Master Setup (Force Division B for New Entries) စတင်ပါပြီ...")

    # ၁။ API ကနေ လက်ရှိ Standings ကို အရင်ယူမယ်
    try:
        league_res = requests.get(f"{FPL_API}leagues-classic/{LEAGUE_ID}/standings/").json()
        api_players = league_res['standings']['results']
        api_entry_ids = [str(p['entry']) for p in api_players]
    except Exception as e:
        print(f"❌ API Error: {e}"); return

    # ၂။ API ကနေ ရတဲ့ အသင်းတွေကို နေရာချခြင်း
    for i, player in enumerate(api_players):
        entry_id = str(player['entry'])
        doc_ref = db.collection("tw_mm_tournament").document(entry_id)

        # Division Logic (A: 1-12, B: 13+)
        rank = i + 1
        division = "Division A" if rank <= 12 else "Division B"

        # ရှိပြီးသားအသင်းဆို အမှတ်မပျက်အောင် update ပဲလုပ်မယ်၊ မရှိရင် set လုပ်မယ်
        doc_snap = doc_ref.get()
        if not doc_snap.exists:
            weekly_fields = {f"gw_{gw}_{f}": (0 if f != 'chip' else None) for gw in GW_RANGE for f in ['pts', 'hit', 'chip']}
            data = {
                "entry_id": entry_id,
                "name": player['player_name'],
                "team": player['entry_name'],
                "division": division,
                "total_net": 0,
                **weekly_fields
            }
            doc_ref.set(data)
            print(f"✅ [API Entry] {player['entry_name']} -> {division}")
        else:
            doc_ref.update({"division": division, "name": player['player_name'], "team": player['entry_name']})
            print(f"✅ [API Update] {player['entry_name']} -> {division}")

    # ၃။ API မှာ မတွေ့သေးတဲ့ ID (၂) ခုကို Division B ထဲ Force ထည့်ခြင်း
    for entry_id in MANUAL_NEW_ENTRIES:
        if entry_id not in api_entry_ids:
            doc_ref = db.collection("tw_mm_tournament").document(entry_id)
            if not doc_ref.get().exists:
                # အသင်းအချက်အလက်ကို Entry API ကနေ သပ်သပ်ဆွဲယူမယ်
                try:
                    p_res = requests.get(f"{FPL_API}entry/{entry_id}/").json()
                    name = f"{p_res['player_first_name']} {p_res['player_last_name']}"
                    team = p_res['name']
                except:
                    name = "Pending Name"; team = "Pending Team"

                weekly_fields = {f"gw_{gw}_{f}": (0 if f != 'chip' else None) for gw in GW_RANGE for f in ['pts', 'hit', 'chip']}
                manual_data = {
                    "entry_id": entry_id,
                    "name": name,
                    "team": team,
                    "division": "Division B", # ဒီ ၂ သင်းကို Division B ထဲ အသေထည့်သည်
                    "total_net": 0,
                    **weekly_fields
                }
                doc_ref.set(manual_data)
                print(f"🆕 [Manual Entry Added] {team} -> Division B")
            else:
                doc_ref.update({"division": "Division B"})
                print(f"✅ [Manual Update] ID: {entry_id} -> Fixed Division B")

    print(f"---")
    print(f"⭐ ၂၄ သင်းလုံးအတွက် Division A (1-12) နှင့် Division B (13-24) သတ်မှတ်ပြီးပါပြီ။")

if __name__ == "__main__":
    setup_tournament_24_teams()
