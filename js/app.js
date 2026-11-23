document.addEventListener('DOMContentLoaded', () => {
    if (typeof startRealtimeClock === 'function') startRealtimeClock();
    if (typeof applySettingsToUI === 'function') applySettingsToUI();

    let restoredSession = null;
    try {
        const rawSession = localStorage.getItem('pos_offline_session');
        if (rawSession) {
            restoredSession = JSON.parse(rawSession);
        }
    } catch (e) {}

    if (typeof initFirebaseFromStorage === 'function') {
        try {
            initFirebaseFromStorage();
        } catch (e) {
            console.error('Init Firebase warning:', e);
        }
    }

    if (restoredSession && restoredSession.role && typeof openMainAppAfterAuth === 'function') {
        openMainAppAfterAuth(restoredSession, false);
    } else {
        if (typeof showLoginModal === 'function') showLoginModal();
        if (typeof resetLoginButton === 'function') resetLoginButton();
    }
});
