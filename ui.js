function startRealtimeClock() {
    const updateClock = () => {
        const el = document.getElementById('realtime-clock');
        if (el) {
            const now = new Date();
            el.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
        }
    };
    updateClock();
    setInterval(updateClock, 1000);
}

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';
    }
}

function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function applyRolePermissions() {
    const role = currentUser ? currentUser.role : 'admin';
    const isAdmin = role === 'admin';

    const navProducts = document.getElementById('nav-products');
    const navReports = document.getElementById('nav-reports');
    const navCashbank = document.getElementById('nav-cashbank');
    const navExpenses = document.getElementById('nav-expenses');
    const navBtnSettings = document.getElementById('nav-btn-settings');

    if (navProducts) navProducts.classList.toggle('hidden', !isAdmin);
    if (navReports) navReports.classList.toggle('hidden', !isAdmin);
    if (navCashbank) navCashbank.classList.toggle('hidden', !isAdmin);
    if (navExpenses) navExpenses.classList.toggle('hidden', !isAdmin);
    if (navBtnSettings) navBtnSettings.classList.toggle('hidden', !isAdmin);

    const headerCashier = document.getElementById('header-cashier-name');
    if (headerCashier && currentUser) {
        headerCashier.innerText = `${currentUser.name} (${currentUser.role.toUpperCase()})`;
    }

    const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
    if (activeTabEl && !isAdmin) {
        const activeId = activeTabEl.id.replace('tab-', '');
        if (['products', 'reports', 'cashbank', 'expenses', 'settings'].includes(activeId)) {
            switchTab('pos');
        }
    }
}

function switchTab(tabId) {
    const role = currentUser ? currentUser.role : 'admin';
    if (role !== 'admin' && ['products', 'reports', 'cashbank', 'expenses', 'settings'].includes(tabId)) {
        showToast('Akses menu ini khusus untuk Admin!', true);
        tabId = 'pos';
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-indigo-600', 'font-semibold');
        btn.classList.add('text-slate-600', 'border-transparent');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'border-transparent');
        activeBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'border-indigo-600', 'font-semibold');
    }

    if (tabId === 'dashboard' && typeof renderDashboard === 'function') {
        renderDashboard();
    } else if (tabId === 'pos' && typeof renderPOSView === 'function') {
        renderPOSView();
    } else if (tabId === 'products' && typeof renderProductTable === 'function') {
        renderProductTable();
    } else if (tabId === 'reports' && typeof renderReportsView === 'function') {
        renderReportsView();
    } else if (tabId === 'settings' && typeof populateSettingsForm === 'function') {
        populateSettingsForm();
    } else if (tabId === 'cashbank' && typeof renderCashBankView === 'function') {
        renderCashBankView();
    } else if (tabId === 'expenses' && typeof renderExpensesView === 'function') {
        renderExpensesView();
    }
}

function refreshActiveView() {
    const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
    const currentTab = activeTabEl ? activeTabEl.id.replace('tab-', '') : 'dashboard';

    if (currentTab === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
    if (currentTab === 'pos' && typeof renderPOSView === 'function') renderPOSView();
    if (currentTab === 'products' && typeof renderProductTable === 'function') renderProductTable();
    if (currentTab === 'reports' && typeof renderReportsView === 'function') renderReportsView();
    if (currentTab === 'cashbank' && typeof renderCashBankView === 'function') renderCashBankView();
    if (currentTab === 'expenses' && typeof renderExpensesView === 'function') renderExpensesView();
}
