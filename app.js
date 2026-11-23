window.onload = function() {
    initClock();
    initFirebaseFromStorage();
    if (!isFirebaseConnected) {
        loadLocalFallback();
        const savedOfflineUser = localStorage.getItem('pos_offline_user');
        if (savedOfflineUser) {
            try {
                currentUser = JSON.parse(savedOfflineUser);
                document.getElementById('login-modal').classList.add('hidden');
                applyRolePermissions();
                applySettingsToUI();
                switchTab(currentUser.role === 'admin' ? 'dashboard' : 'pos');
            } catch (e) {
                document.getElementById('login-modal').classList.remove('hidden');
            }
        } else {
            document.getElementById('login-modal').classList.remove('hidden');
        }
    }
};
