// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDE11cAUZfJoZMMCF-eyqGDUioYDQSCWrs",
  authDomain: "tw-fpl-tour.firebaseapp.com",
  projectId: "tw-fpl-tour",
  storageBucket: "tw-fpl-tour.firebasestorage.app",
  messagingSenderId: "1023019839565",
  appId: "1:1023019839565:web:e91650d5c475c54a63ec04",
  measurementId: "G-48KP6S02RK"
};

// Firebase Initialize
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// 🔗 Admin Contact Links — ဒီနေရာမှာပဲ ပြောင်းလဲပါ
window.TW_CONTACTS = {
    facebook:  "https://m.me/YOUR_FB_PAGE",      // ← FB Messenger link ထည့်ပါ
    telegram:  "https://t.me/YOUR_TG_GROUP",      // ← Telegram group link ထည့်ပါ
};

console.log("TW MM Tournament - Firebase Connected! 🏆");
