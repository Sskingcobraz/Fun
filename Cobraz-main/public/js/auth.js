import { 
  auth, 
  provider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  db,
  doc,
  setDoc,
  getDoc
} from './firebase.js';

// Generate unique Cobraz address
const generateCobrazAddress = () => {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'CBZ-';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Handle Google Sign-In
const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in Firestore
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userRef, {
        username: user.displayName || 'User',
        email: user.email,
        cobrazBalance: 100, // Starting balance
        cobrazAddress: generateCobrazAddress(),
        joinDate: new Date(),
        isAdmin: false
      });
    }
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    alert('Sign in failed: ' + error.message);
  }
};

// Initialize auth state listener
const initAuthState = () => {
  onAuthStateChanged(auth, (user) => {
    const signInBtn = document.getElementById('googleSignIn');
    const signOutBtn = document.getElementById('signOutBtn');
    
    if (user) {
      // User is signed in
      if (signInBtn) signInBtn.style.display = 'none';
      if (signOutBtn) signOutBtn.style.display = 'block';
      
      if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        window.location.href = '/dashboard.html';
      }
    } else {
      // User is signed out
      if (signInBtn) signInBtn.style.display = 'block';
      if (signOutBtn) signOutBtn.style.display = 'none';
      
      if (!['/index.html', '/'].includes(window.location.pathname)) {
        window.location.href = '/index.html';
      }
    }
  });
};

// Handle Sign Out
const handleSignOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', () => {
  initAuthState();
  
  const googleSignInBtn = document.getElementById('googleSignIn');
  const signOutBtn = document.getElementById('signOutBtn');
  
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);
  }
  
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }
});
