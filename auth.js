// Authentication System for Water Intake Tracker
class AuthSystem {
    // Class constants for localStorage keys
    static USERS_KEY = 'waterTracker_users';
    static SESSION_KEY = 'waterTracker_session';

    constructor() {
        this.usersKey = AuthSystem.USERS_KEY;
        this.sessionKey = AuthSystem.SESSION_KEY;
        
        // Only initialize auth page logic if we're on auth.html
        if (this.isAuthPage()) {
            this.init();
        }
    }

    isAuthPage() {
        // Check if we're on the auth.html page
        const path = window.location.pathname;
        return path.endsWith('auth.html') || path === '/' || path === '';
    }

    init() {
        // Check if already logged in, redirect to main app
        if (this.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form toggle
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignUp();
        });

        document.getElementById('show-signin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignIn();
        });

        // Sign In form
        document.getElementById('signin-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        // Sign Up form
        document.getElementById('signup-form-element').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Password toggle buttons
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                this.togglePasswordVisibility(targetId);
            });
        });

        // Password strength indicator
        document.getElementById('signup-password').addEventListener('input', (e) => {
            this.checkPasswordStrength(e.target.value);
        });

        // Forgot Password (placeholder)
        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            alert('Password reset functionality is not implemented in this demo. Please contact support or create a new account.');
        });
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
        document.getElementById('password-strength').textContent = '';
        document.getElementById('password-strength').className = 'password-strength';
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

    hashPassword(password) {
        // Simple base64 encoding for demo purposes
        // In production, use proper backend hashing with salt (bcrypt, argon2, etc.)
        return btoa(password + ':watertracker:salt');
    }

    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    getUsers() {
        const users = localStorage.getItem(this.usersKey);
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem(this.usersKey, JSON.stringify(users));
    }

    userExists(email) {
        const users = this.getUsers();
        return users.some(user => user.email.toLowerCase() === email.toLowerCase());
    }

    showError(errorId, message) {
        const errorElement = document.getElementById(errorId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    handleSignUp() {
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

        if (this.userExists(email)) {
            this.showError('signup-error', 'An account with this email already exists. Please sign in.');
            return;
        }

        // Create user
        const users = this.getUsers();
        const newUser = {
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        // Auto sign in after successful signup
        this.createSession(email.toLowerCase());
        window.location.href = 'index.html';
    }

    handleSignIn() {
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

        // Find user
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            this.showError('signin-error', 'Invalid email or password.');
            return;
        }

        // Verify password
        if (!this.verifyPassword(password, user.password)) {
            this.showError('signin-error', 'Invalid email or password.');
            return;
        }

        // Create session and redirect
        this.createSession(user.email);
        window.location.href = 'index.html';
    }

    createSession(email) {
        const session = {
            email: email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(AuthSystem.SESSION_KEY, JSON.stringify(session));
    }

    isAuthenticated() {
        const session = localStorage.getItem(AuthSystem.SESSION_KEY);
        return session !== null;
    }

    static getCurrentUser() {
        const session = localStorage.getItem(AuthSystem.SESSION_KEY);
        if (session) {
            return JSON.parse(session);
        }
        return null;
    }

    static logout() {
        localStorage.removeItem(AuthSystem.SESSION_KEY);
        window.location.href = 'auth.html';
    }

    static requireAuth() {
        const session = localStorage.getItem(AuthSystem.SESSION_KEY);
        if (!session) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    }
}

// Initialize authentication system when DOM is loaded (only on auth.html)
document.addEventListener('DOMContentLoaded', () => {
    // Only create AuthSystem instance on auth.html page
    // Using AuthSystem.prototype to check if we're on auth page
    const authSystem = new AuthSystem();
    if (authSystem.isAuthPage()) {
        // Instance already initialized in constructor
    }
});
