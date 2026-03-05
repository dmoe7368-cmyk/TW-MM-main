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
FPL_API = "https://fantasy.premierleague.com/api/"

# 🎯 ပြိုင်ပွဲဝင်မည့် အပတ်စဉ်ကို ဤနေရာတွင် ပြောင်းပါ
TARGET_GW = 29

def get_gw_detailed_stats(entry_id, gw_num):
    """
    FPL API မှ တစ်ဦးချင်းစီ၏ အမှတ်၊ Hit နှင့် Chip များကို ဆွဲယူသည်
    """
    url = f"{FPL_API}entry/{entry_id}/event/{gw_num}/picks/"
    try:
        res = requests.get(url, timeout=15)
        if res.status_code == 200:
            d = res.json()
            history = d.get('entry_history')
            if not history:
                return None

            pts = history.get('points', 0)
            cost = history.get('event_transfers_cost', 0)
            chip = d.get('active_chip')

            # JS UI နှင့် ကိုက်ညီစေရန် Chip ၄ မျိုးလုံးကို သတ်မှတ်သည်
            # 3xc (TC), bboost (BB), freehit (FH), wildcard (WC)
            valid_chips = ['3xc', 'bboost', 'freehit', 'wildcard']
            chip_to_save = chip if chip in valid_chips else None

            return {
                "net_pts": pts - cost,  # Hit နှုတ်ပြီးသား အသားတင်ရမှတ်
                "hit": cost,           # နှုတ်လိုက်သော Hit အမှတ် (ဥပမာ - 4)
                "chip": chip_to_save
            }
    except Exception as e:
        print(f"⚠️ Error fetching {entry_id}: {e}")
    return None

def sync_fpl_scores():
    print(f"⚽ GW {TARGET_GW} Update စတင်နေပါပြီ (Chips & Hits logic အပြည့်အစုံဖြင့်)...")

    # Database မှ ပြိုင်ပွဲဝင်အားလုံးကို ဆွဲထုတ်သည်
    managers = db.collection("tw_mm_tournament").stream()

    count = 0
    for doc in managers:
        entry_id = doc.id
        existing_data = doc.to_dict()

        # API မှ data ဆွဲယူသည်
        data = get_gw_detailed_stats(entry_id, TARGET_GW)

        if data:
            # ✅ ယခုအပတ်အတွက် Update လုပ်မည့် Payload
            # JS ဘက်က pts, hit, chip field များကို အသုံးပြုထားသဖြင့် ၎င်းအတိုင်း သိမ်းသည်
            update_payload = {
                f"gw_{TARGET_GW}_pts": data['net_pts'],
                f"gw_{TARGET_GW}_hit": data['hit'],
                f"gw_{TARGET_GW}_chip": data['chip']
            }

            # ✅ Total Net Point ကို ပြန်လည်တွက်ချက်ခြင်း (GW 29 မှ 35 ထိ)
            new_total_net = 0
            for gw in range(29, 36):
                if gw == TARGET_GW:
                    new_total_net += data['net_pts']
                else:
                    # Database ထဲရှိ အခြားအပတ်များမှ အမှတ်ဟောင်းများကို ပေါင်းသည်
                    new_total_net += existing_data.get(f"gw_{gw}_pts", 0)

            update_payload["total_net"] = new_total_net

            # Firestore သို့ Update ပို့သည်
            db.collection("tw_mm_tournament").document(entry_id).update(update_payload)

            # Console မှာ အခြေအနေပြရန်
            hit_str = f"(-{data['hit']} hit)" if data['hit'] > 0 else ""
            chip_str = f"[{data['chip']}]" if data['chip'] else ""

            print(f"✅ [{count+1}] {existing_data.get('team')} -> PTS: {data['net_pts']} {hit_str} {chip_str} | Total: {new_total_net}")
        else:
            print(f"❌ [{count+1}] {existing_data.get('team')} - No data found for GW{TARGET_GW}")

        count += 1
        time.sleep(0.5) # Rate limit အတွက် ခေတ္တနားသည်

    print(f"---")
    print(f"⭐ GW {TARGET_GW} Sync လုပ်ငန်းစဉ် အောင်မြင်စွာ ပြီးဆုံးပါပြီ။")

if __name__ == "__main__":
    sync_fpl_scores()
