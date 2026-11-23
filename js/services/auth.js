function resolveUserRole(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (typeof ACCOUNT_ROLES !== 'undefined' && ACCOUNT_ROLES[cleanEmail]) {
        return ACCOUNT_ROLES[cleanEmail];
    }
    if (cleanEmail.includes('kasir1')) return { role: 'cashier1', name: 'Kasir 1' };
    if (cleanEmail.includes('kasir2')) return { role: 'cashier2', name: 'Kasir 2' };
    return {
        role: 'admin',
        name: cleanEmail ? cleanEmail.split('@')[0] : 'Admin Utama'
    };
}

function resetLoginButton() {
    const submitBtn = document.getElementById('btn-login-submit');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Masuk ke Sistem';
    }
}

async function openMainAppAfterAuth(userObj, isFromCloud = false) {
    currentUser = userObj;
    try {
        localStorage.setItem('pos_offline_session', JSON.stringify(currentUser));
    } catch (e) {}

    if (typeof hideLoginModal === 'function') hideLoginModal();
    if (typeof applyRolePermissions === 'function') {
        applyRolePermissions();
    }

    if (isFromCloud && typeof loadFromCloudOrLocal === 'function') {
        try {
            await loadFromCloudOrLocal(true);
        } catch (e) {
            console.warn('Cloud load fallback to local:', e);
            if (typeof loadLocalFallback === 'function') loadLocalFallback();
        }
        if (typeof startRealtimeFirestoreListener === 'function') {
            startRealtimeFirestoreListener();
        }
    } else if (typeof loadLocalFallback === 'function') {
        loadLocalFallback();
    }

    const targetTab = (currentUser && currentUser.role === 'admin') ? 'dashboard' : 'pos';
    if (typeof switchTab === 'function') {
        switchTab(targetTab);
    }
}

function setupAuthStateListener() {
    if (!auth || typeof auth.onAuthStateChanged !== 'function') return;
    auth.onAuthStateChanged(async (user) => {
        isAuthInitialized = true;
        if (user) {
            const roleInfo = resolveUserRole(user.email);
            await openMainAppAfterAuth({
                uid: user.uid,
                email: user.email,
                role: roleInfo.role,
                name: roleInfo.name
            }, true);
        } else if (!currentUser) {
            let hasLocalSession = false;
            try {
                hasLocalSession = Boolean(localStorage.getItem('pos_offline_session'));
            } catch (e) {}
            if (!hasLocalSession && typeof showLoginModal === 'function') {
                showLoginModal();
            }
            resetLoginButton();
        }
    });
}

async function handleLogin(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-password');
    const submitBtn = document.getElementById('btn-login-submit');

    const email = (emailEl && emailEl.value ? emailEl.value : '').trim();
    const password = passEl && passEl.value ? passEl.value : '';

    if (!email) {
        showToast('Email akun wajib diisi!', true);
        resetLoginButton();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Memproses...';
    }

    try {
        if (typeof isFirebaseConnected !== 'undefined' && isFirebaseConnected && auth) {
            if (!password) {
                throw new Error('Password wajib diisi untuk login Firebase.');
            }
            const cred = await auth.signInWithEmailAndPassword(email, password);
            const roleInfo = resolveUserRole(cred.user.email);
            await openMainAppAfterAuth({
                uid: cred.user.uid,
                email: cred.user.email,
                role: roleInfo.role,
                name: roleInfo.name
            }, true);
            showToast(`Selamat datang, ${currentUser.name}!`);
        } else {
            const roleInfo = resolveUserRole(email);
            await openMainAppAfterAuth({
                uid: 'local-' + Date.now(),
                email: email,
                role: roleInfo.role,
                name: roleInfo.name
            }, false);
            showToast(`Masuk sebagai ${currentUser.name}`);
        }
    } catch (err) {
        console.error('Login error:', err);
        let msg = err.message || 'Gagal login!';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            msg = 'Email atau password salah!';
        } else if (err.code === 'auth/network-request-failed') {
            msg = 'Koneksi internet bermasalah. Coba Mode Lokal / Offline.';
        }
        showToast(msg, true);
    } finally {
        resetLoginButton();
    }
}

async function enterOfflineMode() {
    resetLoginButton();
    await openMainAppAfterAuth({
        uid: 'offline-admin',
        email: 'admin@abs.com',
        role: 'admin',
        name: 'Admin Utama (Lokal)'
    }, false);
    showToast('Masuk ke Mode Lokal / Offline');
}

async function logout() {
    try {
        localStorage.removeItem('pos_offline_session');
    } catch (e) {}

    if (typeof firestoreUnsubscribe === 'function' || firestoreUnsubscribe) {
        try { firestoreUnsubscribe(); } catch (e) {}
        firestoreUnsubscribe = null;
    }
    try {
        if (typeof isFirebaseConnected !== 'undefined' && isFirebaseConnected && auth && auth.currentUser) {
            await auth.signOut();
        }
    } catch (e) {
        console.error('Logout warning:', e);
    }

    currentUser = null;
    const passEl = document.getElementById('login-password');
    if (passEl) passEl.value = '';
    resetLoginButton();
    if (typeof showLoginModal === 'function') showLoginModal();
    showToast('Anda telah keluar dari sistem.');
}
