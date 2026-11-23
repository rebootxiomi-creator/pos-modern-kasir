document.addEventListener('DOMContentLoaded', () => {
    if (typeof startRealtimeClock === 'function') startRealtimeClock();
    if (typeof applySettingsToUI === 'function') applySettingsToUI();

    showLoginModal();
    if (typeof resetLoginButton === 'function') resetLoginButton();

    if (typeof initFirebaseFromStorage === 'function') {
        try {
            initFirebaseFromStorage();
        } catch (e) {
            console.error('Init Firebase warning:', e);
        }
    }
});
