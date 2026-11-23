function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn(`Gagal membaca localStorage (${key}):`, e);
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn(`Gagal menyimpan ke localStorage (${key}):`, e);
    }
}

function initFirebaseFromStorage() {
    const savedConfig = safeLocalStorageGet('pos_firebase_config');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            if (document.getElementById('fb-api-key')) {
                document.getElementById('fb-api-key').value = config.apiKey || '';
                document.getElementById('fb-auth-domain').value = config.authDomain || '';
                document.getElementById('fb-project-id').value = config.projectId || '';
                document.getElementById('fb-storage-bucket').value = config.storageBucket || '';
                document.getElementById('fb-messaging-sender-id').value = config.messagingSenderId || '';
                document.getElementById('fb-app-id').value = config.appId || '';
            }

            if (config.apiKey && config.projectId) {
                connectFirebase(config);
            }
        } catch (e) {
            console.error("Config Firebase lokal tidak valid:", e);
        }
    }
}

function connectFirebase(config) {
    try {
        if (typeof firebase === 'undefined') {
            isFirebaseConnected = false;
            updateFirebaseStatusUI(false);
            return false;
        }

        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(config);
        } else {
            firebaseApp = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
        isFirebaseConnected = true;
        updateFirebaseStatusUI(true, config.projectId);
        if (typeof setupAuthStateListener === 'function') {
            setupAuthStateListener();
        }
        return true;
    } catch (e) {
        console.error(e);
        isFirebaseConnected = false;
        updateFirebaseStatusUI(false);
        if (typeof showToast === 'function') {
            showToast(`Error inisialisasi Firebase: ${e.message}`, true);
        }
        return false;
    }
}

function startRealtimeFirestoreListener() {
    if (!isFirebaseConnected || !db || !auth || !auth.currentUser) return;
    if (typeof firestoreUnsubscribe === 'function') {
        try { firestoreUnsubscribe(); } catch (e) {}
        firestoreUnsubscribe = null;
    }

    firestoreUnsubscribe = db.collection('pos_store').doc('main_data').onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data() || {};
            products = Array.isArray(data.products) ? data.products : [...DEFAULT_PRODUCTS];
            transactions = Array.isArray(data.transactions) ? data.transactions : [];
            accounts = Array.isArray(data.accounts) ? data.accounts : JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
            cashTransfers = Array.isArray(data.cashTransfers) ? data.cashTransfers : [];
            expenses = Array.isArray(data.expenses) ? data.expenses : [];
            settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };

            safeLocalStorageSet('pos_cloud_products', JSON.stringify(products));
            safeLocalStorageSet('pos_cloud_transactions', JSON.stringify(transactions));
            safeLocalStorageSet('pos_cloud_accounts', JSON.stringify(accounts));
            safeLocalStorageSet('pos_cloud_transfers', JSON.stringify(cashTransfers));
            safeLocalStorageSet('pos_cloud_expenses', JSON.stringify(expenses));
            safeLocalStorageSet('pos_cloud_settings', JSON.stringify(settings));

            if (typeof syncCartWithProducts === 'function') syncCartWithProducts();
            if (typeof applySettingsToUI === 'function') applySettingsToUI();
            if (typeof refreshActiveView === 'function') refreshActiveView();
        }
    }, (error) => {
        console.warn("Realtime snapshot error:", error);
    });
}

function testAndSaveFirebaseConfig() {
    const config = {
        apiKey: document.getElementById('fb-api-key').value.trim(),
        authDomain: document.getElementById('fb-auth-domain').value.trim(),
        projectId: document.getElementById('fb-project-id').value.trim(),
        storageBucket: document.getElementById('fb-storage-bucket').value.trim(),
        messagingSenderId: document.getElementById('fb-messaging-sender-id').value.trim(),
        appId: document.getElementById('fb-app-id').value.trim()
    };

    if (!config.apiKey || !config.projectId) {
        showToast('API Key dan Project ID wajib diisi!', true);
        return;
    }

    safeLocalStorageSet('pos_firebase_config', JSON.stringify(config));
    const connected = connectFirebase(config);
    if (connected) {
        showToast('Berhasil terhubung ke Firebase!');
        if (auth && auth.currentUser) {
            loadFromCloudOrLocal(true);
            startRealtimeFirestoreListener();
        }
    } else {
        showToast('Gagal terhubung ke Firebase. Periksa kembali konfigurasi Anda.', true);
    }
}

function updateFirebaseStatusUI(isConnected, projectName = '') {
    const statusText = document.getElementById('cloud-status-text');
    const desc = document.getElementById('settings-fb-desc');
    const icon = document.getElementById('firebase-icon');
    if (isConnected) {
        if (statusText) statusText.innerText = `Firebase: ${projectName}`;
        if (desc) desc.innerText = `Status: Terhubung ke Firebase (${projectName})`;
        if (icon) icon.className = "fa-solid fa-fire text-emerald-400 mr-1.5";
    } else {
        if (statusText) statusText.innerText = "Mode Lokal";
        if (desc) desc.innerText = "Status: Belum terhubung ke Firebase";
        if (icon) icon.className = "fa-solid fa-fire text-amber-300 mr-1.5";
    }
}

function loadLocalFallback() {
    const savedProducts = safeLocalStorageGet('pos_cloud_products');
    const savedTrx = safeLocalStorageGet('pos_cloud_transactions');
    const savedAccounts = safeLocalStorageGet('pos_cloud_accounts');
    const savedTransfers = safeLocalStorageGet('pos_cloud_transfers');
    const savedExpenses = safeLocalStorageGet('pos_cloud_expenses');
    const savedSettings = safeLocalStorageGet('pos_cloud_settings');

    try {
        products = savedProducts ? JSON.parse(savedProducts) : [...DEFAULT_PRODUCTS];
        transactions = savedTrx ? JSON.parse(savedTrx) : [];
        accounts = savedAccounts ? JSON.parse(savedAccounts) : JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        cashTransfers = savedTransfers ? JSON.parse(savedTransfers) : [];
        expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        settings = savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
        console.warn("Gagal parse data lokal, kembali ke default:", e);
        products = [...DEFAULT_PRODUCTS];
        transactions = [];
        accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
        cashTransfers = [];
        expenses = [];
        settings = { ...DEFAULT_SETTINGS };
    }

    if (typeof applySettingsToUI === 'function') {
        applySettingsToUI();
    }
}

// Atomic Firestore transaction mutator to eliminate multi-cashier race conditions
async function mutateStoreDataAtomic(mutatorFn) {
    if (isFirebaseConnected && db && auth && auth.currentUser) {
        const docRef = db.collection('pos_store').doc('main_data');
        try {
            await db.runTransaction(async (t) => {
                const doc = await t.get(docRef);
                const data = doc.exists ? (doc.data() || {}) : {};
                const state = {
                    products: Array.isArray(data.products) ? JSON.parse(JSON.stringify(data.products)) : JSON.parse(JSON.stringify(products)),
                    transactions: Array.isArray(data.transactions) ? JSON.parse(JSON.stringify(data.transactions)) : JSON.parse(JSON.stringify(transactions)),
                    accounts: Array.isArray(data.accounts) ? JSON.parse(JSON.stringify(data.accounts)) : JSON.parse(JSON.stringify(accounts)),
                    cashTransfers: Array.isArray(data.cashTransfers) ? JSON.parse(JSON.stringify(data.cashTransfers)) : JSON.parse(JSON.stringify(cashTransfers)),
                    expenses: Array.isArray(data.expenses) ? JSON.parse(JSON.stringify(data.expenses)) : JSON.parse(JSON.stringify(expenses)),
                    settings: { ...DEFAULT_SETTINGS, ...settings, ...(data.settings || {}) }
                };

                mutatorFn(state);

                products = state.products;
                transactions = state.transactions;
                accounts = state.accounts;
                cashTransfers = state.cashTransfers;
                expenses = state.expenses;
                settings = state.settings;

                t.set(docRef, {
                    products: state.products,
                    transactions: state.transactions,
                    accounts: state.accounts,
                    cashTransfers: state.cashTransfers,
                    expenses: state.expenses,
                    settings: state.settings,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            safeLocalStorageSet('pos_cloud_products', JSON.stringify(products));
            safeLocalStorageSet('pos_cloud_transactions', JSON.stringify(transactions));
            safeLocalStorageSet('pos_cloud_accounts', JSON.stringify(accounts));
            safeLocalStorageSet('pos_cloud_transfers', JSON.stringify(cashTransfers));
            safeLocalStorageSet('pos_cloud_expenses', JSON.stringify(expenses));
            safeLocalStorageSet('pos_cloud_settings', JSON.stringify(settings));

            const statusText = document.getElementById('cloud-status-text');
            if (statusText) {
                statusText.innerText = "Firebase Synced";
                setTimeout(() => {
                    if (isFirebaseConnected) {
                        const cfg = JSON.parse(safeLocalStorageGet('pos_firebase_config') || '{}');
                        statusText.innerText = `Firebase: ${cfg.projectId || 'Connected'}`;
                    }
                }, 1500);
            }
        } catch (err) {
            console.error("Atomic Firestore transaction failed:", err);
            throw err;
        }
    } else {
        const state = { products, transactions, accounts, cashTransfers, expenses, settings };
        mutatorFn(state);
        products = state.products;
        transactions = state.transactions;
        accounts = state.accounts;
        cashTransfers = state.cashTransfers;
        expenses = state.expenses;
        settings = state.settings;

        safeLocalStorageSet('pos_cloud_products', JSON.stringify(products));
        safeLocalStorageSet('pos_cloud_transactions', JSON.stringify(transactions));
        safeLocalStorageSet('pos_cloud_accounts', JSON.stringify(accounts));
        safeLocalStorageSet('pos_cloud_transfers', JSON.stringify(cashTransfers));
        safeLocalStorageSet('pos_cloud_expenses', JSON.stringify(expenses));
        safeLocalStorageSet('pos_cloud_settings', JSON.stringify(settings));
    }
}

async function loadFromCloudOrLocal(forceFromFirebase = false) {
    let loadedFromFB = false;

    if (isFirebaseConnected && db && auth && auth.currentUser) {
        try {
            const doc = await db.collection('pos_store').doc('main_data').get();
            if (doc.exists) {
                const data = doc.data() || {};
                products = Array.isArray(data.products) ? data.products : [...DEFAULT_PRODUCTS];
                transactions = Array.isArray(data.transactions) ? data.transactions : [];
                accounts = Array.isArray(data.accounts) ? data.accounts : JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
                cashTransfers = Array.isArray(data.cashTransfers) ? data.cashTransfers : [];
                expenses = Array.isArray(data.expenses) ? data.expenses : [];
                settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
                loadedFromFB = true;

                safeLocalStorageSet('pos_cloud_products', JSON.stringify(products));
                safeLocalStorageSet('pos_cloud_transactions', JSON.stringify(transactions));
                safeLocalStorageSet('pos_cloud_accounts', JSON.stringify(accounts));
                safeLocalStorageSet('pos_cloud_transfers', JSON.stringify(cashTransfers));
                safeLocalStorageSet('pos_cloud_expenses', JSON.stringify(expenses));
                safeLocalStorageSet('pos_cloud_settings', JSON.stringify(settings));
            } else if (forceFromFirebase && typeof showToast === 'function') {
                showToast('Dokumen pos_store/main_data belum ada di Firestore.', true);
            }
        } catch (e) {
            console.warn("Gagal mengambil data dari Firebase:", e);
            if (typeof showToast === 'function') {
                showToast(`Gagal ambil data Firebase: ${e.code || e.message}`, true);
            }
        }
    } else if (forceFromFirebase && (!auth || !auth.currentUser) && typeof showToast === 'function') {
        showToast('Data dimuat dari penyimpanan lokal.', false);
    }

    if (!loadedFromFB) {
        loadLocalFallback();
    }

    if (typeof syncCartWithProducts === 'function') syncCartWithProducts();
    if (typeof applySettingsToUI === 'function') applySettingsToUI();
    if (typeof refreshActiveView === 'function') refreshActiveView();
}
