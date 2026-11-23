document.addEventListener('DOMContentLoaded', async () => {
    if (typeof startRealtimeClock === 'function') startRealtimeClock();
    if (typeof applySettingsToUI === 'function') applySettingsToUI();

    let restoredSession = null;
    try {
        const rawSession = localStorage.getItem('pos_offline_session');
        if (rawSession) {
            restoredSession = JSON.parse(rawSession);
        }
    } catch (e) {
        console.warn('Gagal membaca sesi lokal:', e);
    }

    if (typeof initFirebaseFromStorage === 'function') {
        try {
            initFirebaseFromStorage();
        } catch (e) {
            console.error('Init Firebase warning:', e);
        }
    }

    const hasFirebase = typeof isFirebaseConnected !== 'undefined' && Boolean(isFirebaseConnected);

    if (restoredSession && restoredSession.role && typeof openMainAppAfterAuth === 'function') {
        await openMainAppAfterAuth(restoredSession, hasFirebase);
    } else {
        if (typeof loadLocalFallback === 'function') {
            loadLocalFallback();
        }
        if (typeof showLoginModal === 'function') showLoginModal();
        if (typeof resetLoginButton === 'function') resetLoginButton();
    }
});
