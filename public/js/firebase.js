// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyCQ3HiYLafcgfKDrVXzeP5tVGd3ephui5M",
  authDomain: "cobraz69.firebaseapp.com",
  projectId: "cobraz69",
  storageBucket: "cobraz69.firebasestorage.app",
  messagingSenderId: "966165847096",
  appId: "1:966165847096:web:7a131aae701d3a752b1acd"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global Firebase services
window.auth = firebase.auth();
window.db = firebase.firestore();
window.provider = new firebase.auth.GoogleAuthProvider();
