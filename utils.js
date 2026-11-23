function formatRupiah(amount) {
    const num = Number(amount) || 0;
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatProductCode(id) {
    const cleanId = String(id || '').trim();
    const prefix = (typeof settings !== 'undefined' && settings && settings.productPrefix) ? String(settings.productPrefix).trim() : 'PRD-';
    if (!prefix) return cleanId;
    if (cleanId.toUpperCase().startsWith(prefix.toUpperCase())) {
        return cleanId;
    }
    return `${prefix}${cleanId}`;
}

function isSameDay(dateA, dateB) {
    return dateA.getFullYear() === dateB.getFullYear() &&
           dateA.getMonth() === dateB.getMonth() &&
           dateA.getDate() === dateB.getDate();
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');
    if (!toast || !msgEl) {
        console.log(isError ? '[ERROR]' : '[INFO]', message);
        return;
    }

    msgEl.innerText = message;
    if (iconEl) {
        iconEl.className = isError
            ? 'fa-solid fa-circle-exclamation text-rose-400 text-base md:text-lg'
            : 'fa-solid fa-circle-check text-emerald-400 text-base md:text-lg';
    }

    if (typeof toastTimer !== 'undefined' && toastTimer) clearTimeout(toastTimer);
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    toastTimer = setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}
