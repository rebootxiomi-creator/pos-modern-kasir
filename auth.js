function setupAuthStateListener() {
    if (!auth || isAuthInitialized) return;
    isAuthInitialized = true;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            localStorage.removeItem('pos_offline_user');
            const mapped = mapRoleFromEmail(user.email);
            currentUser = {
                uid: user.uid,
                email: user.email,
                role: mapped.role,
                name: mapped.name
            };
            localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
            document.getElementById('login-modal').classList.add('hidden');
            applyRolePermissions();
            await loadFromCloudOrLocal(true);
            startRealtimeFirestoreListener();
            switchTab(currentUser.role === 'admin' ? 'dashboard' : 'pos');
            if (currentUser.role === 'admin') loadDashboardData();
        } else {
            if (firestoreUnsubscribe) {
                firestoreUnsubscribe();
                firestoreUnsubscribe = null;
            }
            const offlineUser = localStorage.getItem('pos_offline_user');
            if (!offlineUser) {
                currentUser = null;
                localStorage.removeItem('pos_current_user');
                loadLocalFallback();
                document.getElementById('login-modal').classList.remove('hidden');
            }
        }
    });
}

function enterOfflineMode() {
    currentUser = {
        uid: 'local-admin',
        email: 'admin@lokal.app',
        role: 'admin',
        name: settings.cashierName || 'Admin Lokal'
    };
    localStorage.setItem('pos_offline_user', JSON.stringify(currentUser));
    loadLocalFallback();
    document.getElementById('login-modal').classList.add('hidden');
    applyRolePermissions();
    applySettingsToUI();
    switchTab('dashboard');
    showToast('Masuk menggunakan Mode Lokal (Offline)');
}

function mapRoleFromEmail(email = '') {
    const normalized = String(email).toLowerCase().trim();
    if (ACCOUNT_ROLES[normalized]) {
        return ACCOUNT_ROLES[normalized];
    }
    if (normalized.includes('kasir2') || normalized.includes('cashier2')) {
        return { role: 'cashier2', name: 'Kasir 2' };
    }
    if (normalized.includes('kasir1') || normalized.includes('kasir') || normalized.includes('cashier1') || normalized.includes('cashier')) {
        return { role: 'cashier1', name: 'Kasir 1' };
    }
    return { role: 'admin', name: 'Admin Utama' };
}

async function handleLogin(event) {
    event.preventDefault();
    if (!isFirebaseConnected || !auth) {
        showToast('Firebase belum terhubung! Gunakan tombol Mode Lokal di bawah atau hubungkan Firebase.', true);
        return;
    }

    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('btn-login-submit');

    submitBtn.disabled = true;
    submitBtn.innerText = 'Memproses...';

    try {
        const cred = await auth.signInWithEmailAndPassword(email, pass);
        const mapped = mapRoleFromEmail(cred.user.email);
        currentUser = {
            uid: cred.user.uid,
            email: cred.user.email,
            role: mapped.role,
            name: mapped.name
        };

        localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
        document.getElementById('login-modal').classList.add('hidden');
        applyRolePermissions();
        await loadFromCloudOrLocal(true);
        startRealtimeFirestoreListener();

        const targetTab = currentUser.role === 'admin' ? 'dashboard' : 'pos';
        switchTab(targetTab);
        if (currentUser.role === 'admin') loadDashboardData();
        showToast(`Berhasil login sebagai ${currentUser.name}`);
    } catch (error) {
        console.error(error);
        showToast(`Login gagal: ${error.message}`, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Masuk ke Sistem';
    }
}

async function logout() {
    try {
        if (isFirebaseConnected && auth) {
            await auth.signOut();
        }
    } catch (e) {
        console.error("Gagal sign out dari Firebase Auth:", e);
    }
    if (firestoreUnsubscribe) {
        firestoreUnsubscribe();
        firestoreUnsubscribe = null;
    }
    localStorage.removeItem('pos_current_user');
    localStorage.removeItem('pos_offline_user');
    currentUser = null;
    document.getElementById('login-password').value = '';
    document.getElementById('login-modal').classList.remove('hidden');
}

function applyRolePermissions() {
    const settingsBtn = document.getElementById('nav-btn-settings');
    const navReports = document.getElementById('nav-reports');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProducts = document.getElementById('nav-products');
    
    if (currentUser && currentUser.role !== 'admin') {
        if (navReports) navReports.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
        if (navDashboard) navDashboard.style.display = 'none';
        if (navProducts) navProducts.style.display = 'none';
        switchTab('pos');
    } else {
        if (navReports) navReports.style.display = 'flex';
        if (settingsBtn) settingsBtn.style.display = 'flex';
        if (navDashboard) navDashboard.style.display = 'flex';
        if (navProducts) navProducts.style.display = 'flex';
    }
}
