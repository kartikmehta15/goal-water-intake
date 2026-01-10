// Firebase Configuration
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQvSXT3pB0mNB2fsLva_GHGilKVLeGQSU",
  authDomain: "water-intake-tracker-6d9c1.firebaseapp.com",
  projectId: "water-intake-tracker-6d9c1",
  storageBucket: "water-intake-tracker-6d9c1.firebasestorage.app",
  messagingSenderId: "493478307594",
  appId: "1:493478307594:web:7c50471cd8d3f2f620bcf3",
  measurementId: "G-589YE5KW60"
};


// Initialize Firebase
let firebaseApp = null;
let auth = null;
let db = null;

try {
    // Check if Firebase config is valid
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || 
        firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.error('⚠️ Firebase is not configured properly!');
        console.error('Please update the firebaseConfig in auth.js with your actual Firebase credentials.');
        console.error('See README.md for setup instructions.');
        
        // Show user-friendly error
        document.addEventListener('DOMContentLoaded', () => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc3545;color:white;padding:20px;text-align:center;z-index:10000;';
            errorDiv.innerHTML = `
                <h3>⚠️ Firebase Configuration Required</h3>
                <p>Please configure your Firebase project credentials in auth.js to use this application.</p>
                <p style="font-size:0.9em;margin-top:10px;">See README.md for detailed setup instructions.</p>
            `;
            document.body.insertBefore(errorDiv, document.body.firstChild);
        });
    }
    
    if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
        firebaseApp = firebase.app();
    }
    auth = firebase.auth();
    db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('Persistence not available in this browser');
            }
        });
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.warn('Running without Firebase - please configure your Firebase project');
}

// Authentication System for Water Intake Tracker
class AuthSystem {
    constructor() {
        // Only initialize auth page logic if we're on auth.html
        if (this.isAuthPage()) {
            this.init();
        }
        
        // Monitor online/offline status
        this.setupOnlineMonitoring();
    }

    isAuthPage() {
        // Check if we're on the auth.html page
        const path = window.location.pathname;
        return path.endsWith('auth.html') || path === '/' || path === '';
    }

    init() {
        // Check if already logged in, redirect to main app
        if (auth) {
            auth.onAuthStateChanged((user) => {
                if (user) {
                    window.location.href = 'index.html';
                } else {
                    this.setupEventListeners();
                }
            });
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Form toggle
        const showSignup = document.getElementById('show-signup');
        const showSignin = document.getElementById('show-signin');
        
        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignUp();
            });
        }

        if (showSignin) {
            showSignin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignIn();
            });
        }

        // Sign In form
        const signinForm = document.getElementById('signin-form-element');
        if (signinForm) {
            signinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignIn();
            });
        }

        // Sign Up form
        const signupForm = document.getElementById('signup-form-element');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignUp();
            });
        }

        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                this.togglePasswordVisibility(targetId);
            });
        });

        // Password strength indicator
        const signupPassword = document.getElementById('signup-password');
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }

        // Forgot Password
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Google Sign-In buttons
        const googleSigninBtn = document.getElementById('google-signin-btn');
        const googleSignupBtn = document.getElementById('google-signup-btn');
        
        if (googleSigninBtn) {
            googleSigninBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
        
        if (googleSignupBtn) {
            googleSignupBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }
    }

    setupOnlineMonitoring() {
        const offlineMessage = document.getElementById('offline-message');
        
        window.addEventListener('online', () => {
            if (offlineMessage) {
                offlineMessage.classList.remove('show');
            }
        });

        window.addEventListener('offline', () => {
            if (offlineMessage) {
                offlineMessage.classList.add('show');
            }
        });

        // Check initial state
        if (!navigator.onLine && offlineMessage) {
            offlineMessage.classList.add('show');
        }
    }

    showLoading(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.querySelector('.loading-text');
        if (overlay) {
            if (loadingText) loadingText.textContent = text;
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showSignUp() {
        document.getElementById('signin-form').classList.remove('active');
        document.getElementById('signup-form').classList.add('active');
        this.clearErrors();
    }

    showSignIn() {
        document.getElementById('signup-form').classList.remove('active');
        document.getElementById('signin-form').classList.add('active');
        this.clearErrors();
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
            el.textContent = '';
        });
        const strengthIndicator = document.getElementById('password-strength');
        if (strengthIndicator) {
            strengthIndicator.textContent = '';
            strengthIndicator.className = 'password-strength';
        }
    }

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const button = document.querySelector(`[data-target="${inputId}"]`);
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('password-strength');
        
        if (!strengthIndicator) return;
        
        if (password.length === 0) {
            strengthIndicator.textContent = '';
            strengthIndicator.className = 'password-strength';
            return;
        }

        let strength = 0;
        
        // Length check
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        
        // Complexity checks
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) {
            strengthIndicator.textContent = 'Weak password';
            strengthIndicator.className = 'password-strength weak';
        } else if (strength <= 3) {
            strengthIndicator.textContent = 'Medium password';
            strengthIndicator.className = 'password-strength medium';
        } else {
            strengthIndicator.textContent = 'Strong password';
            strengthIndicator.className = 'password-strength strong';
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    async handleSignUp() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        this.clearErrors();

        // Validation
        if (!this.validateEmail(email)) {
            this.showError('signup-error', 'Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            this.showError('signup-error', 'Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('signup-error', 'Passwords do not match.');
            return;
        }

        try {
            this.showLoading('Creating account...');
            
            // Create user with Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Initialize user data in Firestore
            await this.initializeUserData(userCredential.user.uid);
            
            this.hideLoading();
            
            // Redirect will happen automatically via onAuthStateChanged
        } catch (error) {
            this.hideLoading();
            console.error('Sign up error:', error);
            
            let errorMessage = 'An error occurred during sign up. Please try again.';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists. Please sign in.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled. Please configure Firebase Authentication.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
            }
            
            this.showError('signup-error', errorMessage);
        }
    }

    async handleSignIn() {
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;

        this.clearErrors();

        // Validation
        if (!this.validateEmail(email)) {
            this.showError('signin-error', 'Please enter a valid email address.');
            return;
        }

        if (!password) {
            this.showError('signin-error', 'Please enter your password.');
            return;
        }

        try {
            this.showLoading('Signing in...');
            
            // Sign in with Firebase Authentication
            await auth.signInWithEmailAndPassword(email, password);
            
            this.hideLoading();
            
            // Redirect will happen automatically via onAuthStateChanged
        } catch (error) {
            this.hideLoading();
            console.error('Sign in error:', error);
            
            let errorMessage = 'Invalid email or password.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Invalid email or password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed attempts. Please try again later.';
                    break;
            }
            
            this.showError('signin-error', errorMessage);
        }
    }

    async handleGoogleSignIn() {
        try {
            this.showLoading('Signing in with Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            
            // Check if this is a new user and initialize their data
            if (result.additionalUserInfo.isNewUser) {
                await this.initializeUserData(result.user.uid);
            }
            
            this.hideLoading();
            
            // Redirect will happen automatically via onAuthStateChanged
        } catch (error) {
            this.hideLoading();
            console.error('Google sign-in error:', error);
            
            let errorMessage = 'Failed to sign in with Google. Please try again.';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    errorMessage = 'Sign-in popup was closed. Please try again.';
                    break;
                case 'auth/cancelled-popup-request':
                    return; // User cancelled, no need to show error
                case 'auth/popup-blocked':
                    errorMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Google sign-in is not enabled. Please configure Firebase Authentication.';
                    break;
            }
            
            // Show error in the active form
            const activeForm = document.querySelector('.auth-form.active');
            const errorId = activeForm.id === 'signin-form' ? 'signin-error' : 'signup-error';
            this.showError(errorId, errorMessage);
        }
    }

    async handleForgotPassword() {
        const email = prompt('Please enter your email address:');
        
        if (!email) return;
        
        if (!this.validateEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        
        try {
            this.showLoading('Sending reset email...');
            await auth.sendPasswordResetEmail(email);
            this.hideLoading();
            alert('Password reset email sent! Please check your inbox.');
        } catch (error) {
            this.hideLoading();
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to send password reset email.';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
            }
            
            alert(errorMessage);
        }
    }

    async initializeUserData(userId) {
        try {
            // Create a user document in Firestore
            await db.collection('users').doc(userId).set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error initializing user data:', error);
            // Don't throw - this is not critical for authentication
        }
    }

    static getCurrentUser() {
        return auth ? auth.currentUser : null;
    }

    static async logout() {
        try {
            await auth.signOut();
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    }

    static requireAuth() {
        return new Promise((resolve) => {
            if (!auth) {
                window.location.href = 'auth.html';
                resolve(false);
                return;
            }
            
            auth.onAuthStateChanged((user) => {
                if (!user) {
                    window.location.href = 'auth.html';
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }
}

// Initialize authentication system when DOM is loaded (only on auth.html)
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});
