// Firebase Configuration
const firebaseConfig = {
  apiKey:            "AIzaSyBxx5OUP8ykraOj8yg-l7890ilzhTSDWlY",
  authDomain:        "tw-mm-main.firebaseapp.com",
  projectId:         "tw-mm-main",
  storageBucket:     "tw-mm-main.firebasestorage.app",
  messagingSenderId: "702506795870",
  appId:             "1:702506795870:web:a42ce4ec078cb62e2705cf",
  measurementId:     "G-VBHZWJTXH9"
};

// Firebase Initialize
firebase.initializeApp(firebaseConfig);

const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();  // ← Photo/Voice upload

// 🔗 Admin Contact Links
window.TW_CONTACTS = {
    facebook: "https://m.me/cm/AbaB1mquJbM2q8KY/?send_source=cm%3Acopy_invite_link",
    telegram: "https://t.me/doephagyi",
};

console.log("TW MM Tournament - Firebase Connected! 🏆");
