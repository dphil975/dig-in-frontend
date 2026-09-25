/**
 * Dig In Authentication System
 * Email + Google OAuth + Phone with 2FA
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadSession();
        this.setupAuthUI();
        this.requestPermissions();
    }

    async requestPermissions() {
        // Camera permission for scanning
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraStream.getTracks().forEach(track => track.stop());
            console.log("Camera permission granted");
        } catch (err) {
            console.log("Camera permission denied", err);
        }
        
        // Microphone permission for voice search
        try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStream.getTracks().forEach(track => track.stop());
            console.log("Microphone permission granted");
        } catch (err) {
            console.log("Microphone permission denied", err);
        }
    }

    setupAuthUI() {
        const authContainer = document.getElementById('authContainer') || this.createAuthContainer();
        
        if (!this.currentUser) {
            authContainer.innerHTML = `
                <div class="auth-prompt pixel-border">
                    <div class="dig-in-welcome">👩‍🍳</div>
                    <h3>CREATE YOUR KITCHEN PROFILE</h3>
                    <div class="auth-buttons">
                        <button id="emailSignupBtn" class="auth-btn">📧 Sign up with Email</button>
                        <button id="googleSignupBtn" class="auth-btn">🔐 Continue with Google</button>
                        <button id="phoneSignupBtn" class="auth-btn">📱 Sign up with Phone</button>
                    </div>
                    <p class="auth-note">Earn XP, save recipes, and track prices across stores!</p>
                </div>
            `;
            
            authContainer.querySelector('#emailSignupBtn')?.addEventListener('click', () => this.showEmailSignup());
            authContainer.querySelector('#googleSignupBtn')?.addEventListener('click', () => this.initGoogleSignup());
            authContainer.querySelector('#phoneSignupBtn')?.addEventListener('click', () => this.showPhoneSignup());
        } else {
            authContainer.innerHTML = `
                <div class="user-profile pixel-border">
                    <div class="user-avatar">${this.currentUser.avatar || '👩‍🍳'}</div>
                    <div class="user-info">
                        <span class="user-name">${this.currentUser.name || this.currentUser.email}</span>
                        <span class="user-xp">⭐ ${this.currentUser.xp || 0} XP</span>
                        <span class="user-reports">📝 ${this.currentUser.reportCount || 0} community reports</span>
                    </div>
                    <button id="logoutBtn" class="logout-btn">🚪</button>
                </div>
            `;
            
            authContainer.querySelector('#logoutBtn')?.addEventListener('click', () => this.logout());
        }
    }

    createAuthContainer() {
        const container = document.createElement('div');
        container.id = 'authContainer';
        container.className = 'auth-container';
        document.body.prepend(container);
        return container;
    }

    showEmailSignup() {
        const modal = this.createModal(`
            <h3>📧 SIGN UP WITH EMAIL</h3>
            <input type="email" id="signupEmail" placeholder="Email address" class="pixel-input">
            <input type="password" id="signupPassword" placeholder="Password" class="pixel-input">
            <input type="password" id="confirmPassword" placeholder="Confirm password" class="pixel-input">
            <button id="submitEmailSignup" class="pixel-button">CREATE ACCOUNT</button>
            <p class="auth-switch">Already have an account? <a href="#" id="switchToLogin">Log in</a></p>
        `);
        
        modal.querySelector('#submitEmailSignup').addEventListener('click', () => {
            const email = modal.querySelector('#signupEmail').value;
            const password = modal.querySelector('#signupPassword').value;
            const confirm = modal.querySelector('#confirmPassword').value;
            
            if (password !== confirm) {
                alert("Passwords don't match!");
                return;
            }
            
            this.createEmailAccount(email, password);
            modal.remove();
        });
        
        modal.querySelector('#switchToLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            this.showEmailLogin();
        });
    }

    showEmailLogin() {
        const modal = this.createModal(`
            <h3>🔐 LOG IN</h3>
            <input type="email" id="loginEmail" placeholder="Email address" class="pixel-input">
            <input type="password" id="loginPassword" placeholder="Password" class="pixel-input">
            <button id="submitLogin" class="pixel-button">LOG IN</button>
            <p class="auth-switch">No account? <a href="#" id="switchToSignup">Sign up</a></p>
        `);
        
        modal.querySelector('#submitLogin').addEventListener('click', () => {
            const email = modal.querySelector('#loginEmail').value;
            const password = modal.querySelector('#loginPassword').value;
            this.loginEmail(email, password);
            modal.remove();
        });
        
        modal.querySelector('#switchToSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
            this.showEmailSignup();
        });
    }

    showPhoneSignup() {
        const modal = this.createModal(`
            <h3>📱 SIGN UP WITH PHONE</h3>
            <select id="countryCode" class="pixel-select">
                <option value="+1">🇺🇸 +1 (US/CA)</option>
                <option value="+44">🇬🇧 +44 (UK)</option>
                <option value="+61">🇦🇺 +61 (Australia)</option>
            </select>
            <input type="tel" id="phoneNumber" placeholder="Phone number" class="pixel-input">
            <button id="sendVerificationCode" class="pixel-button">SEND VERIFICATION CODE</button>
            <div id="verificationSection" style="display:none;">
                <input type="text" id="verificationCode" placeholder="Enter 6-digit code" class="pixel-input">
                <button id="verifyCode" class="pixel-button">VERIFY & CREATE ACCOUNT</button>
            </div>
        `);
        
        let verificationSent = false;
        
        modal.querySelector('#sendVerificationCode').addEventListener('click', () => {
            const phone = modal.querySelector('#countryCode').value + modal.querySelector('#phoneNumber').value;
            this.sendPhoneVerification(phone);
            modal.querySelector('#verificationSection').style.display = 'block';
            modal.querySelector('#sendVerificationCode').disabled = true;
            verificationSent = true;
        });
        
        modal.querySelector('#verifyCode').addEventListener('click', () => {
            if (!verificationSent) return;
            const code = modal.querySelector('#verificationCode').value;
            this.verifyPhoneCode(code, modal);
        });
    }

    initGoogleSignup() {
        // Google OAuth integration
        // In production: Use Firebase Auth or Google Identity Services
        window.open('https://accounts.google.com/o/oauth2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&response_type=code&scope=email profile', '_blank');
        
        // For demo purposes
        setTimeout(() => {
            this.createSession({
                id: 'google_user_' + Date.now(),
                name: 'Google User',
                email: 'user@gmail.com',
                authMethod: 'google',
                xp: 100,
                createdAt: new Date().toISOString()
            });
        }, 2000);
    }

    createEmailAccount(email, password) {
        // In production: Send to backend API
        this.createSession({
            id: 'user_' + Date.now(),
            email: email,
            name: email.split('@')[0],
            authMethod: 'email',
            xp: 0,
            createdAt: new Date().toISOString()
        });
    }

    loginEmail(email, password) {
        this.createSession({
            id: 'user_' + Date.now(),
            email: email,
            name: email.split('@')[0],
            authMethod: 'email',
            xp: 100,
            lastLogin: new Date().toISOString()
        });
    }

    sendPhoneVerification(phone) {
        // In production: Use Twilio API
        console.log(`SMS sent to ${phone}: Code 123456`);
        alert(`Verification code sent to ${phone}\n(Demo: Use code 123456)`);
    }

    verifyPhoneCode(code, modal) {
        if (code === '123456') {
            this.createSession({
                id: 'phone_user_' + Date.now(),
                phone: modal.querySelector('#countryCode').value + modal.querySelector('#phoneNumber').value,
                authMethod: 'phone',
                xp: 50,
                createdAt: new Date().toISOString()
            });
            modal.remove();
        } else {
            alert("Invalid verification code");
        }
    }

    createSession(userData) {
        this.currentUser = userData;
        localStorage.setItem('digInSession', JSON.stringify(userData));
        this.setupAuthUI();
        this.dispatchAuthEvent();
    }

    loadSession() {
        const saved = localStorage.getItem('digInSession');
        if (saved) {
            this.currentUser = JSON.parse(saved);
            this.setupAuthUI();
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('digInSession');
        this.setupAuthUI();
    }

    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal pixel-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        
        return modal;
    }

    dispatchAuthEvent() {
        const event = new CustomEvent('userAuthenticated', { detail: { user: this.currentUser } });
        document.dispatchEvent(event);
    }
}