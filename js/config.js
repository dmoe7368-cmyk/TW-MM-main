// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxx5OUP8ykraOj8yg-l7890ilzhTSDWlY",
  authDomain: "tw-mm-main.firebaseapp.com",
  projectId: "tw-mm-main",
  storageBucket: "tw-mm-main.firebasestorage.app",
  messagingSenderId: "702506795870",
  appId: "1:702506795870:web:a42ce4ec078cb62e2705cf",
  measurementId: "G-VBHZWJTXH9"
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
