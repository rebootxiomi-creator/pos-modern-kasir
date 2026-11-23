function initClock() {
    setInterval(() => {
        const now = new Date();
        const clockEl = document.getElementById('realtime-clock');
        if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID');
    }, 1000);
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    msgEl.innerText = message;
    iconEl.className = isError
        ? "fa-solid fa-circle-exclamation text-rose-400 text-base md:text-lg"
        : "fa-solid fa-circle-check text-emerald-400 text-base md:text-lg";

    toast.classList.remove('translate-y-20', 'opacity-0');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function switchTab(tabId) {
    if (currentUser && currentUser.role !== 'admin' && tabId !== 'pos') {
        showToast('Akses dibatasi: Kasir hanya dapat mengakses halaman Kasir (POS)!', true);
        return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(el => {
        el.classList.remove('bg-indigo-50', 'text-indigo-600', 'border-indigo-600', 'border-b-indigo-600');
        el.classList.add('text-slate-600', 'border-transparent');
    });

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.remove('hidden');
    }
    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-indigo-50', 'text-indigo-600', 'border-b-indigo-600', 'md:border-l-indigo-600');
        activeBtn.classList.remove('text-slate-600', 'border-transparent');
    }

    if (tabId === 'dashboard') loadDashboardData();
    if (tabId === 'pos') renderPOSCatalog();
    if (tabId === 'products') renderProductTable();
    if (tabId === 'reports') renderReportsView();
}

function refreshActiveView() {
    if (!currentUser) return;
    if (currentUser.role === 'admin') {
        loadDashboardData();
        renderProductTable();
        renderReportsView();
    }
    renderPOSCatalog();
}
