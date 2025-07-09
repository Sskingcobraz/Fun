// auth.js

// Generate unique Cobraz address
function generateCobrazAddress() {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'CBZ-';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
  try {
    const result = await auth.signInWithPopup(provider);
    await createUserDoc(result.user);
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert("Google Login failed: " + error.message);
  }
}

// Handle Email/Password Sign-In or Sign-Up
async function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;

  try {
    // Try sign-in first
    const result = await auth.signInWithEmailAndPassword(email, password);
    window.location.href = '/dashboard.html';
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Auto-create account
      try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await createUserDoc(result.user, email.split('@')[0]);
        alert("Account created!");
        window.location.href = '/dashboard.html';
      } catch (error) {
        alert("Sign-up failed: " + error.message);
      }
    } else {
      alert("Login failed: " + err.message);
    }
  }
}

// Create user doc in Firestore
async function createUserDoc(user, defaultName = 'User') {
  const userRef = db.collection("users").doc(user.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    await userRef.set({
      username: user.displayName || defaultName,
      email: user.email,
      cobrazBalance: 100,
      cobrazAddress: generateCobrazAddress(),
      joinDate: new Date(),
      isAdmin: false
    });
  }
}

// Auth state handling
function initAuthState() {
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  auth.onAuthStateChanged(user => {
    if (user && window.location.pathname === "/index.html") {
      window.location.href = "/dashboard.html";
    }
  });
}

// Modal handling
function initModal() {
  const modal = document.getElementById('loginModal');
  const openBtn = document.getElementById('loginBtn');
  const closeBtn = document.getElementById('closeModal');
  const emailForm = document.getElementById('emailLoginForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.style.display = 'block');
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
  }

  if (emailForm) {
    emailForm.addEventListener('submit', handleEmailLogin);
  }

  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  initAuthState();
  initModal();

  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) googleBtn.addEventListener("click", handleGoogleSignIn);
});
